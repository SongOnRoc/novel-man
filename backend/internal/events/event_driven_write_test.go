package events

import (
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"novel-man/backend/utils/context"
)

func waitUntil(t *testing.T, timeout time.Duration, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if cond() {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatalf("condition not met before timeout=%s", timeout)
}

func TestDispatchQueryEventDoesNotTriggerWriteTask(t *testing.T) {
	scheduler := NewQueueScheduler()
	manager := NewEventManager(scheduler)
	called := false
	manager.RegisterConsumer(ModuleWorks, func(ctx context.Context, task QueueTask) error {
		called = true
		return nil
	})

	err := manager.Dispatch(*context.New(), FactEvent{
		EventID:       "evt-query",
		EventType:     EventTypeWorksQuery,
		AggregateType: AggregateTypeWork,
		AggregateID:   "1",
		TraceID:       "trace-query",
	})
	if err != nil {
		t.Fatalf("dispatch query event failed: %v", err)
	}

	time.Sleep(40 * time.Millisecond)
	if called {
		t.Fatal("query event should not trigger consumer")
	}
	metrics := scheduler.Metrics()
	if metrics.Enqueued != 0 || metrics.Consumed != 0 {
		t.Fatalf("unexpected scheduler metrics for query event: %+v", metrics)
	}
}

func TestDispatchPreservesTraceabilityFields(t *testing.T) {
	scheduler := NewQueueScheduler()
	manager := NewEventManager(scheduler)

	captured := make(chan QueueTask, 1)
	manager.RegisterRoutes(EventTypeChaptersUpdate, ModuleChapters)
	manager.RegisterConsumer(ModuleChapters, func(ctx context.Context, task QueueTask) error {
		captured <- task
		return nil
	})

	err := manager.Dispatch(*context.New(), FactEvent{
		EventID:       "evt-trace",
		EventType:     EventTypeChaptersUpdate,
		AggregateType: AggregateTypeChapter,
		AggregateID:   "42",
		TraceID:       "trace-42",
		Payload:       map[string]any{"chapter_id": uint(42)},
	})
	if err != nil {
		t.Fatalf("dispatch failed: %v", err)
	}

	select {
	case task := <-captured:
		if task.EventID != "evt-trace" {
			t.Fatalf("unexpected event_id: %s", task.EventID)
		}
		if task.TraceID != "trace-42" {
			t.Fatalf("unexpected trace_id: %s", task.TraceID)
		}
		if task.EventType != EventTypeChaptersUpdate {
			t.Fatalf("unexpected event_type: %s", task.EventType)
		}
		if task.PartitionKey != BuildPartitionKey(AggregateTypeChapter, "42", ModuleChapters) {
			t.Fatalf("unexpected partition key: %s", task.PartitionKey)
		}
	case <-time.After(300 * time.Millisecond):
		t.Fatal("did not receive routed task")
	}
}

func TestReplaySameEvent100TimesIsConsistent(t *testing.T) {
	scheduler := NewQueueScheduler()
	manager := NewEventManager(scheduler)

	var mu sync.Mutex
	calls := 0
	manager.RegisterRoutes(EventTypeCharactersUpdate, ModuleCharacters)
	manager.RegisterConsumer(ModuleCharacters, func(ctx context.Context, task QueueTask) error {
		mu.Lock()
		calls++
		mu.Unlock()
		return nil
	})

	for i := 0; i < 100; i++ {
		err := manager.Dispatch(*context.New(), FactEvent{
			EventID:       "evt-replay",
			EventType:     EventTypeCharactersUpdate,
			AggregateType: AggregateTypeCharacter,
			AggregateID:   "7",
			TraceID:       "trace-replay",
			Payload:       map[string]any{"character_id": uint(7)},
		})
		if err != nil {
			t.Fatalf("dispatch failed at i=%d: %v", i, err)
		}
	}

	waitUntil(t, 500*time.Millisecond, func() bool {
		mu.Lock()
		defer mu.Unlock()
		return calls == 1
	})

	metrics := scheduler.Metrics()
	if metrics.DedupHit != 99 {
		t.Fatalf("unexpected dedup hits: %d", metrics.DedupHit)
	}
	if metrics.Consumed != 1 {
		t.Fatalf("unexpected consumed count: %d", metrics.Consumed)
	}
}

func TestSchedulerModuleConcurrencyLimit(t *testing.T) {
	scheduler := NewQueueScheduler()
	scheduler.SetModuleConcurrencyLimit(ModuleWorks, 1)

	start := make(chan struct{}, 2)
	release := make(chan struct{})
	manager := NewEventManager(scheduler)
	manager.RegisterRoutes(EventTypeWorksUpdate, ModuleWorks)
	manager.RegisterConsumer(ModuleWorks, func(ctx context.Context, task QueueTask) error {
		start <- struct{}{}
		<-release
		return nil
	})

	for i := 0; i < 2; i++ {
		err := manager.Dispatch(*context.New(), FactEvent{
			EventID:       fmt.Sprintf("evt-c5-%d", i),
			EventType:     EventTypeWorksUpdate,
			AggregateType: AggregateTypeWork,
			AggregateID:   "99",
			TraceID:       "trace-c5",
			Payload:       map[string]any{"work_id": 99},
		})
		if err != nil {
			t.Fatalf("dispatch failed: %v", err)
		}
	}

	select {
	case <-start:
	case <-time.After(300 * time.Millisecond):
		t.Fatal("first task did not start")
	}

	select {
	case <-start:
		t.Fatal("second task started before module slot released")
	case <-time.After(120 * time.Millisecond):
	}

	close(release)
	waitUntil(t, 500*time.Millisecond, func() bool { return scheduler.Metrics().Consumed == 2 })
}

func TestRetryUsesJitterToAvoidThunderingHerd(t *testing.T) {
	scheduler := NewQueueScheduler()
	manager := NewEventManager(scheduler)
	manager.RegisterRoutes(EventTypeWorksUpdate, ModuleWorks)

	attempts := sync.Map{}
	manager.RegisterConsumer(ModuleWorks, func(ctx context.Context, task QueueTask) error {
		value, _ := attempts.LoadOrStore(task.TaskID, 0)
		count := value.(int)
		if count == 0 {
			attempts.Store(task.TaskID, 1)
			return errors.New("first attempt fail")
		}
		return nil
	})

	for i := 0; i < 8; i++ {
		err := manager.Dispatch(*context.New(), FactEvent{
			EventID:       fmt.Sprintf("evt-d4-%d", i),
			EventType:     EventTypeWorksUpdate,
			AggregateType: AggregateTypeWork,
			AggregateID:   fmt.Sprintf("%d", i),
			TraceID:       "trace-d4",
			Payload:       map[string]any{"work_id": i},
		})
		if err != nil {
			t.Fatalf("dispatch failed: %v", err)
		}
	}

	waitUntil(t, 2*time.Second, func() bool {
		metrics := scheduler.Metrics()
		return metrics.Retried >= 8 && metrics.Consumed >= 8
	})

	if scheduler.Metrics().DeadLettered != 0 {
		t.Fatalf("unexpected dlq count: %d", scheduler.Metrics().DeadLettered)
	}
}

func TestNotifierFailureDoesNotAffectMainPath(t *testing.T) {
	outbox := NewInMemoryOutboxStore()
	worker := &NotifierWorker{
		store:    outbox,
		handlers: make(map[string]NotifierHandler),
		maxRetry: 3,
		stopCh:   make(chan struct{}),
	}
	worker.RegisterHandler(OutboxChannelInApp, func(ctx context.Context, message OutboxMessage) error {
		return errors.New("downstream unavailable")
	})

	scheduler := NewQueueScheduler()
	manager := NewEventManager(scheduler)
	manager.RegisterRoutes(EventTypeSettingsUpdate, ModuleSettings)
	manager.RegisterConsumer(ModuleSettings, func(ctx context.Context, task QueueTask) error {
		return outbox.Add(ctx, OutboxMessage{
			Module:  ModuleSettings,
			Channel: OutboxChannelInApp,
			Payload: map[string]any{"event_id": task.EventID},
			Status:  OutboxStatusPending,
		})
	})

	err := manager.Dispatch(*context.New(), FactEvent{
		EventID:       "evt-v4",
		EventType:     EventTypeSettingsUpdate,
		AggregateType: AggregateTypeSetting,
		AggregateID:   "5",
		TraceID:       "trace-v4",
		Payload:       map[string]any{"setting_id": 5},
	})
	if err != nil {
		t.Fatalf("dispatch failed: %v", err)
	}
	waitUntil(t, 400*time.Millisecond, func() bool { return scheduler.Metrics().Consumed == 1 })

	for i := 0; i < 3; i++ {
		worker.ProcessOnce(*context.New())
	}

	counts := outbox.Counts()
	if counts.Failed == 0 {
		t.Fatalf("expected failed outbox message, got counts=%+v", counts)
	}
	if scheduler.Metrics().Consumed != 1 {
		t.Fatalf("main path consume should stay successful, got %d", scheduler.Metrics().Consumed)
	}
}
