package events

import "time"

const (
	EventTypeWorksCreate       = "works.create"
	EventTypeWorksUpdate       = "works.update"
	EventTypeWorksPublish      = "works.publish"
	EventTypeWorksRecalcStats  = "works.recalc_stats"
	EventTypeWorksStatsUpdated = "works.stats.updated"
	EventTypeWorksQuery        = "works.query"

	EventTypeChaptersCreate = "chapters.create"
	EventTypeChaptersUpdate = "chapters.update"
	EventTypeChaptersDelete = "chapters.delete"

	EventTypeCharactersCreate = "characters.create"
	EventTypeCharactersUpdate = "characters.update"

	EventTypeDraftsCreate = "drafts.create"
	EventTypeDraftsUpdate = "drafts.update"

	EventTypePromptsCreate = "prompts.create"
	EventTypePromptsUpdate = "prompts.update"

	EventTypeSettingsCreate = "settings.create"
	EventTypeSettingsUpdate = "settings.update"

	EventTypeWorldviewCategoryCreate = "worldview.category.create"
	EventTypeWorldviewCategoryUpdate = "worldview.category.update"
	EventTypeWorldviewItemCreate     = "worldview.item.create"
	EventTypeWorldviewItemUpdate     = "worldview.item.update"
)

const (
	ModuleWorks      = "works"
	ModuleChapters   = "chapters"
	ModuleCharacters = "characters"
	ModuleDrafts     = "drafts"
	ModulePrompts    = "prompts"
	ModuleSettings   = "settings"
	ModuleWorldview  = "worldview"
)

const (
	AggregateTypeWork              = "work"
	AggregateTypeChapter           = "chapter"
	AggregateTypeCharacter         = "character"
	AggregateTypeDraft             = "draft"
	AggregateTypePrompt            = "prompt"
	AggregateTypeSetting           = "setting"
	AggregateTypeWorldviewCategory = "worldview_category"
	AggregateTypeWorldviewItem     = "worldview_item"
)

const (
	ProducerWorksService             = "works.service"
	ProducerChaptersService          = "chapters.service"
	ProducerCharactersService        = "characters.service"
	ProducerDraftsService            = "drafts.service"
	ProducerPromptsService           = "prompts.service"
	ProducerSettingsService          = "settings.service"
	ProducerWorldviewCategoryService = "worldview.category.service"
	ProducerWorldviewItemService     = "worldview.item.service"
)

const (
	OutboxChannelInApp = "inapp"
)

const (
	OutboxStatusPending = "pending"
	OutboxStatusSent    = "sent"
	OutboxStatusFailed  = "failed"
)

// FactEvent 表示业务事实变更事件。
type FactEvent struct {
	EventID       string         `json:"event_id"`
	EventType     string         `json:"event_type"`
	AggregateType string         `json:"aggregate_type"`
	AggregateID   string         `json:"aggregate_id"`
	OccurredAt    time.Time      `json:"occurred_at"`
	Producer      string         `json:"producer"`
	Payload       map[string]any `json:"payload"`
	TraceID       string         `json:"trace_id"`
}

// QueueTask 表示事件路由后生成的模块任务。
type QueueTask struct {
	TaskID        string         `json:"task_id"`
	Module        string         `json:"module"`
	EventID       string         `json:"event_id"`
	EventType     string         `json:"event_type"`
	AggregateType string         `json:"aggregate_type"`
	AggregateID   string         `json:"aggregate_id"`
	TraceID       string         `json:"trace_id"`
	Payload       map[string]any `json:"payload"`
	PartitionKey  string         `json:"partition_key"`
	RetryCount    int            `json:"retry_count"`
	NextRetryAt   time.Time      `json:"next_retry_at"`
}

// OutboxMessage 表示模块更新后写入的通知消息。
type OutboxMessage struct {
	MessageID  string         `json:"message_id"`
	Module     string         `json:"module"`
	Channel    string         `json:"channel"`
	Payload    map[string]any `json:"payload"`
	Status     string         `json:"status"`
	RetryCount int            `json:"retry_count"`
}
