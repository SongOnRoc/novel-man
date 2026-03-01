package events

import (
	"sync"
	"time"

	"novel-man/backend/internal/logger"
	"novel-man/backend/utils/context"

	"github.com/google/uuid"
)

type OutboxCounts struct {
	Pending int
	Sent    int
	Failed  int
}

type OutboxStore interface {
	Add(ctx context.Context, message OutboxMessage) error
	Pending(limit int) []OutboxMessage
	MarkSent(messageID string)
	MarkRetry(messageID string, retryCount int)
	MarkDead(messageID string, retryCount int)
	Counts() OutboxCounts
}

type InMemoryOutboxStore struct {
	mu       sync.Mutex
	messages map[string]OutboxMessage
	order    []string
}

func NewInMemoryOutboxStore() OutboxStore {
	return &InMemoryOutboxStore{
		messages: make(map[string]OutboxMessage),
		order:    make([]string, 0),
	}
}

func (s *InMemoryOutboxStore) Add(ctx context.Context, message OutboxMessage) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if message.MessageID == "" {
		message.MessageID = uuid.NewString()
	}
	if message.Status == "" {
		message.Status = OutboxStatusPending
	}
	s.messages[message.MessageID] = message
	s.order = append(s.order, message.MessageID)
	logger.Info(&ctx, "outbox message added message_id={} module={} channel={} status={}", message.MessageID, message.Module, message.Channel, message.Status)
	return nil
}

func (s *InMemoryOutboxStore) Pending(limit int) []OutboxMessage {
	s.mu.Lock()
	defer s.mu.Unlock()

	if limit <= 0 {
		limit = 64
	}
	result := make([]OutboxMessage, 0, limit)
	for _, id := range s.order {
		msg, ok := s.messages[id]
		if !ok {
			continue
		}
		if msg.Status == OutboxStatusPending {
			result = append(result, msg)
			if len(result) >= limit {
				break
			}
		}
	}
	return result
}

func (s *InMemoryOutboxStore) MarkSent(messageID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	msg, ok := s.messages[messageID]
	if !ok {
		return
	}
	msg.Status = OutboxStatusSent
	s.messages[messageID] = msg
}

func (s *InMemoryOutboxStore) MarkRetry(messageID string, retryCount int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	msg, ok := s.messages[messageID]
	if !ok {
		return
	}
	msg.RetryCount = retryCount
	msg.Status = OutboxStatusPending
	s.messages[messageID] = msg
}

func (s *InMemoryOutboxStore) MarkDead(messageID string, retryCount int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	msg, ok := s.messages[messageID]
	if !ok {
		return
	}
	msg.RetryCount = retryCount
	msg.Status = OutboxStatusFailed
	s.messages[messageID] = msg
}

func (s *InMemoryOutboxStore) Counts() OutboxCounts {
	s.mu.Lock()
	defer s.mu.Unlock()

	counts := OutboxCounts{}
	for _, msg := range s.messages {
		switch msg.Status {
		case OutboxStatusPending:
			counts.Pending++
		case OutboxStatusSent:
			counts.Sent++
		case OutboxStatusFailed:
			counts.Failed++
		}
	}
	return counts
}

type NotifierHandler func(ctx context.Context, message OutboxMessage) error

type NotifierMetrics struct {
	Sent    int64
	Retried int64
	Failed  int64
}

type NotifierWorker struct {
	store    OutboxStore
	handlers map[string]NotifierHandler
	mu       sync.Mutex
	metrics  NotifierMetrics

	maxRetry int
	interval time.Duration
	stopCh   chan struct{}
	stopOnce sync.Once
}

func NewNotifierWorker(store OutboxStore) *NotifierWorker {
	w := &NotifierWorker{
		store:    store,
		handlers: make(map[string]NotifierHandler),
		maxRetry: 3,
		interval: 300 * time.Millisecond,
		stopCh:   make(chan struct{}),
	}
	w.RegisterHandler(OutboxChannelInApp, func(ctx context.Context, message OutboxMessage) error {
		logger.Info(&ctx, "notifier send success channel={} message_id={} module={}", message.Channel, message.MessageID, message.Module)
		return nil
	})
	go w.run()
	return w
}

func (w *NotifierWorker) RegisterHandler(channel string, handler NotifierHandler) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.handlers[channel] = handler
}

func (w *NotifierWorker) run() {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			w.ProcessOnce(*context.New())
		case <-w.stopCh:
			return
		}
	}
}

func (w *NotifierWorker) ProcessOnce(ctx context.Context) {
	pending := w.store.Pending(64)
	for _, msg := range pending {
		handler := w.getHandler(msg.Channel)
		if handler == nil {
			handler = w.getHandler(OutboxChannelInApp)
		}
		if handler == nil {
			w.store.MarkDead(msg.MessageID, msg.RetryCount)
			w.addFailed()
			logger.Error(&ctx, "notifier handler missing channel={} message_id={}", msg.Channel, msg.MessageID)
			continue
		}

		if err := handler(ctx, msg); err != nil {
			if msg.RetryCount+1 >= w.maxRetry {
				w.store.MarkDead(msg.MessageID, msg.RetryCount+1)
				w.addFailed()
				logger.Warn(&ctx, "notifier send failed permanently message_id={} retry_count={} error={}", msg.MessageID, msg.RetryCount+1, err)
				continue
			}
			w.store.MarkRetry(msg.MessageID, msg.RetryCount+1)
			w.addRetried()
			logger.Warn(&ctx, "notifier send retry message_id={} retry_count={} error={}", msg.MessageID, msg.RetryCount+1, err)
			continue
		}

		w.store.MarkSent(msg.MessageID)
		w.addSent()
	}
}

func (w *NotifierWorker) Stop() {
	w.stopOnce.Do(func() {
		close(w.stopCh)
	})
}

func (w *NotifierWorker) Metrics() NotifierMetrics {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.metrics
}

func (w *NotifierWorker) getHandler(channel string) NotifierHandler {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.handlers[channel]
}

func (w *NotifierWorker) addSent() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.metrics.Sent++
}

func (w *NotifierWorker) addRetried() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.metrics.Retried++
}

func (w *NotifierWorker) addFailed() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.metrics.Failed++
}

type AlertSnapshot struct {
	DLQSize            int
	OutboxPending      int
	OutboxFailed       int
	DLQAlert           bool
	OutboxBacklogAlert bool
	OutboxFailedAlert  bool
}

func BuildAlertSnapshot(scheduler *QueueScheduler, outbox OutboxStore, dlqThreshold, outboxPendingThreshold int) AlertSnapshot {
	dlqSize := len(scheduler.DeadLetterTasks())
	counts := outbox.Counts()
	return AlertSnapshot{
		DLQSize:            dlqSize,
		OutboxPending:      counts.Pending,
		OutboxFailed:       counts.Failed,
		DLQAlert:           dlqSize >= dlqThreshold,
		OutboxBacklogAlert: counts.Pending >= outboxPendingThreshold,
		OutboxFailedAlert:  counts.Failed > 0,
	}
}
