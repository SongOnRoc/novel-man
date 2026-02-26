package events

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"novel-man/backend/internal/logger"
	"novel-man/backend/utils/context"

	"github.com/google/uuid"
)

// ModuleConsumer 表示模块消费者执行入口。
type ModuleConsumer func(ctx context.Context, task QueueTask) error

// EventManager 负责事件路由并生成 QueueTask。
type EventManager struct {
	scheduler *QueueScheduler

	mu          sync.RWMutex
	subscribers map[string][]string
	consumers   map[string]ModuleConsumer
}

func NewEventManager(scheduler *QueueScheduler) *EventManager {
	return &EventManager{
		scheduler:   scheduler,
		subscribers: make(map[string][]string),
		consumers:   make(map[string]ModuleConsumer),
	}
}

// RegisterRoutes 注册事件类型到模块列表的映射。
//
// 约束：同一个 eventType 可能被多个模块订阅（例如 chapters.* 既被 chapters 模块消费，
// 也被 works 模块用于统计回写）。因此这里应做“追加 + 去重”，而不是覆盖。
func (m *EventManager) RegisterRoutes(eventType string, modules ...string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	existing := m.subscribers[eventType]
	for _, mod := range modules {
		seen := false
		for _, e := range existing {
			if e == mod {
				seen = true
				break
			}
		}
		if !seen {
			existing = append(existing, mod)
		}
	}
	m.subscribers[eventType] = existing
}

// RegisterConsumer 注册模块消费者实现。
func (m *EventManager) RegisterConsumer(module string, consumer ModuleConsumer) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.consumers[module] = consumer
}

// Dispatch 将 FactEvent 路由为 QueueTask 并提交调度。
func (m *EventManager) Dispatch(ctx context.Context, event FactEvent) error {
	if m.scheduler == nil {
		return errors.New("queue scheduler is nil")
	}

	m.mu.RLock()
	modules := append([]string{}, m.subscribers[event.EventType]...)
	consumers := make(map[string]ModuleConsumer, len(m.consumers))
	for module, consumer := range m.consumers {
		consumers[module] = consumer
	}
	m.mu.RUnlock()

	for _, module := range modules {
		consumer, ok := consumers[module]
		if !ok {
			logger.Warn(&ctx, "skip route because consumer not registered event_id={} module={}", event.EventID, module)
			continue
		}

		task := QueueTask{
			TaskID:        uuid.NewString(),
			Module:        module,
			EventID:       event.EventID,
			EventType:     event.EventType,
			AggregateType: event.AggregateType,
			AggregateID:   event.AggregateID,
			TraceID:       event.TraceID,
			Payload:       event.Payload,
			PartitionKey:  BuildPartitionKey(event.AggregateType, event.AggregateID, module),
			RetryCount:    0,
			NextRetryAt:   time.Now(),
		}

		if err := m.scheduler.Enqueue(ctx, task, consumer); err != nil {
			return fmt.Errorf("enqueue task failed module=%s event_id=%s: %w", module, event.EventID, err)
		}
	}

	return nil
}

func BuildPartitionKey(aggregateType, aggregateID, module string) string {
	return aggregateType + ":" + aggregateID + ":" + module
}

func BuildDedupKey(eventID, module string) string {
	return eventID + ":" + module
}
