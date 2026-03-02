package events

import (
	"fmt"
	"math/rand"
	"sync"
	"time"

	"novel-man/backend/internal/logger"
	"novel-man/backend/utils/context"
)

type scheduledTask struct {
	task     QueueTask
	consumer ModuleConsumer
}

// SchedulerMetrics 提供最小可观测计数。
type SchedulerMetrics struct {
	Enqueued       int64
	DedupHit       int64
	Retried        int64
	DeadLettered   int64
	Consumed       int64
	ConsumeFailure int64
}

// QueueScheduler 提供入队/投递/去重/重试/DLQ 基础能力。
type QueueScheduler struct {
	queue chan scheduledTask

	maxRetry    int
	baseBackoff time.Duration
	maxJitter   time.Duration

	mu                 sync.Mutex
	processedDedup     map[string]struct{}
	dlq                []QueueTask
	metrics            SchedulerMetrics
	moduleConcurrency  map[string]int
	defaultConcurrency int
	inFlightByModule   map[string]int
	slotCond           *sync.Cond
}

func NewQueueScheduler() *QueueScheduler {
	s := &QueueScheduler{
		queue:              make(chan scheduledTask, 1024),
		maxRetry:           5,
		baseBackoff:        200 * time.Millisecond,
		maxJitter:          100 * time.Millisecond,
		processedDedup:     make(map[string]struct{}),
		dlq:                make([]QueueTask, 0),
		moduleConcurrency:  make(map[string]int),
		defaultConcurrency: 1,
		inFlightByModule:   make(map[string]int),
	}
	s.slotCond = sync.NewCond(&s.mu)
	go s.run()
	return s
}

func (s *QueueScheduler) Enqueue(ctx context.Context, task QueueTask, consumer ModuleConsumer) error {
	dedupKey := BuildDedupKey(task.EventID, task.Module)

	s.mu.Lock()
	if task.RetryCount == 0 {
		if _, exists := s.processedDedup[dedupKey]; exists {
			s.metrics.DedupHit++
			s.mu.Unlock()
			logger.Info(&ctx, "dedup hit event_id={} module={} dedup_key={}", task.EventID, task.Module, dedupKey)
			return nil
		}
		s.processedDedup[dedupKey] = struct{}{}
	}
	s.metrics.Enqueued++
	s.mu.Unlock()

	select {
	case s.queue <- scheduledTask{task: task, consumer: consumer}:
		logger.Info(&ctx, "task enqueued task_id={} event_id={} module={} partition_key={}", task.TaskID, task.EventID, task.Module, task.PartitionKey)
		return nil
	default:
		return fmt.Errorf("queue is full")
	}
}

func (s *QueueScheduler) run() {
	for payload := range s.queue {
		s.acquireModuleSlot(payload.task.Module)
		go s.consumeTask(payload)
	}
}

func (s *QueueScheduler) consumeTask(payload scheduledTask) {
	task := payload.task
	consumer := payload.consumer
	ctx := *context.New()
	defer s.releaseModuleSlot(task.Module)

	if err := consumer(ctx, task); err != nil {
		s.handleFailure(ctx, task, consumer, err)
		return
	}

	s.markConsumed(task)
	logger.Info(&ctx, "task consumed task_id={} event_id={} module={}", task.TaskID, task.EventID, task.Module)
}

func (s *QueueScheduler) handleFailure(ctx context.Context, task QueueTask, consumer ModuleConsumer, consumeErr error) {
	s.mu.Lock()
	s.metrics.ConsumeFailure++
	s.mu.Unlock()

	if task.RetryCount >= s.maxRetry {
		s.mu.Lock()
		s.metrics.DeadLettered++
		s.dlq = append(s.dlq, task)
		s.mu.Unlock()
		logger.Error(&ctx, "task moved to dlq task_id={} event_id={} module={} error={}", task.TaskID, task.EventID, task.Module, consumeErr)
		return
	}

	task.RetryCount++
	delay := s.nextRetryDelay(task.RetryCount)
	task.NextRetryAt = time.Now().Add(delay)

	s.mu.Lock()
	s.metrics.Retried++
	s.mu.Unlock()

	logger.Warn(&ctx, "task retry scheduled task_id={} event_id={} module={} retry_count={} next_retry_at={} error={}",
		task.TaskID,
		task.EventID,
		task.Module,
		task.RetryCount,
		task.NextRetryAt.Format(time.RFC3339Nano),
		consumeErr,
	)

	go func(retryTask QueueTask) {
		time.Sleep(time.Until(retryTask.NextRetryAt))
		_ = s.Enqueue(*context.New(), retryTask, consumer)
	}(task)
}

func (s *QueueScheduler) nextRetryDelay(retryCount int) time.Duration {
	exponential := s.baseBackoff * time.Duration(1<<(retryCount-1))
	jitter := time.Duration(rand.Int63n(int64(s.maxJitter) + 1))
	return exponential + jitter
}

func (s *QueueScheduler) markConsumed(task QueueTask) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.metrics.Consumed++
}

func (s *QueueScheduler) Metrics() SchedulerMetrics {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.metrics
}

func (s *QueueScheduler) SetModuleConcurrencyLimit(module string, limit int) {
	if limit <= 0 {
		limit = 1
	}
	s.mu.Lock()
	s.moduleConcurrency[module] = limit
	s.mu.Unlock()
	s.slotCond.Broadcast()
}

func (s *QueueScheduler) ModuleConcurrencyLimit(module string) int {
	s.mu.Lock()
	defer s.mu.Unlock()
	if limit, ok := s.moduleConcurrency[module]; ok && limit > 0 {
		return limit
	}
	return s.defaultConcurrency
}

func (s *QueueScheduler) acquireModuleSlot(module string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for s.inFlightByModule[module] >= s.moduleConcurrencyLimitNoLock(module) {
		s.slotCond.Wait()
	}
	s.inFlightByModule[module]++
}

func (s *QueueScheduler) releaseModuleSlot(module string) {
	s.mu.Lock()
	if s.inFlightByModule[module] > 0 {
		s.inFlightByModule[module]--
	}
	s.mu.Unlock()
	s.slotCond.Broadcast()
}

func (s *QueueScheduler) moduleConcurrencyLimitNoLock(module string) int {
	if limit, ok := s.moduleConcurrency[module]; ok && limit > 0 {
		return limit
	}
	return s.defaultConcurrency
}

func (s *QueueScheduler) DeadLetterTasks() []QueueTask {
	s.mu.Lock()
	defer s.mu.Unlock()
	cloned := make([]QueueTask, len(s.dlq))
	copy(cloned, s.dlq)
	return cloned
}
