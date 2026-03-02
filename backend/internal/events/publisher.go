package events

import (
	"errors"
	"time"

	"novel-man/backend/internal/logger"
	"novel-man/backend/utils/context"

	"github.com/google/uuid"
)

// Publisher 负责在业务事实提交成功后发布事件。
type Publisher interface {
	PublishFactEvent(ctx context.Context, event FactEvent) error
}

// DefaultPublisher 是默认的 FactEvent 发布实现。
type DefaultPublisher struct {
	manager *EventManager
}

func NewPublisher(manager *EventManager) Publisher {
	return &DefaultPublisher{manager: manager}
}

func (p *DefaultPublisher) PublishFactEvent(ctx context.Context, event FactEvent) error {
	if p.manager == nil {
		return errors.New("event manager is nil")
	}

	if event.EventID == "" {
		event.EventID = uuid.NewString()
	}
	if event.TraceID == "" {
		event.TraceID = ctx.TraceID()
	}
	if event.OccurredAt.IsZero() {
		event.OccurredAt = time.Now()
	}

	logger.Info(&ctx, "fact event published event_id={} event_type={} aggregate_type={} aggregate_id={} trace_id={}",
		event.EventID,
		event.EventType,
		event.AggregateType,
		event.AggregateID,
		event.TraceID,
	)

	return p.manager.Dispatch(ctx, event)
}
