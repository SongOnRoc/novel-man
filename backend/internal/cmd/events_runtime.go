package cmd

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"novel-man/backend/internal/config"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/logger"
	Ctx "novel-man/backend/utils/context"
)

var managedModules = []string{
	events.ModuleWorks,
	events.ModuleChapters,
	events.ModuleCharacters,
	events.ModuleDrafts,
	events.ModulePrompts,
	events.ModuleSettings,
	events.ModuleWorldview,
}

func applySchedulerConcurrency(ctx *Ctx.Context, scheduler *events.QueueScheduler, overrides map[string]int) {
	effective := make(map[string]int, len(managedModules))
	for _, module := range managedModules {
		limit := 1
		if overrides != nil {
			if configured, ok := overrides[module]; ok && configured > 0 {
				limit = configured
			}
		}
		scheduler.SetModuleConcurrencyLimit(module, limit)
		effective[module] = scheduler.ModuleConcurrencyLimit(module)
	}

	parts := make([]string, 0, len(effective))
	for _, module := range managedModules {
		parts = append(parts, fmt.Sprintf("%s=%d", module, effective[module]))
	}
	logger.Info(ctx, "scheduler concurrency applied {}", strings.Join(parts, ","))
}

func startEventAlertCollector(
	scheduler *events.QueueScheduler,
	outbox events.OutboxStore,
	notifier *events.NotifierWorker,
	eventsCfg config.EventsConfig,
) func() {
	interval := time.Duration(eventsCfg.AlertCollectIntervalSeconds) * time.Second
	if interval <= 0 {
		interval = 30 * time.Second
	}
	dlqThreshold := eventsCfg.DLQThreshold
	if dlqThreshold <= 0 {
		dlqThreshold = 1
	}
	outboxPendingThreshold := eventsCfg.OutboxPendingThreshold
	if outboxPendingThreshold <= 0 {
		outboxPendingThreshold = 20
	}

	stopCh := make(chan struct{})
	var stopOnce sync.Once
	stopFn := func() {
		stopOnce.Do(func() {
			close(stopCh)
		})
	}

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		ctx := Ctx.New()
		logger.Info(ctx, "event alert collector started interval_seconds={} dlq_threshold={} outbox_pending_threshold={}", int(interval.Seconds()), dlqThreshold, outboxPendingThreshold)
		for {
			select {
			case <-ticker.C:
				emitEventAlertSnapshot(ctx, scheduler, outbox, notifier, dlqThreshold, outboxPendingThreshold)
			case <-stopCh:
				logger.Info(ctx, "event alert collector stopped")
				return
			}
		}
	}()

	return stopFn
}

func emitEventAlertSnapshot(
	ctx *Ctx.Context,
	scheduler *events.QueueScheduler,
	outbox events.OutboxStore,
	notifier *events.NotifierWorker,
	dlqThreshold int,
	outboxPendingThreshold int,
) {
	snapshot := events.BuildAlertSnapshot(scheduler, outbox, dlqThreshold, outboxPendingThreshold)
	schedulerMetrics := scheduler.Metrics()
	notifierMetrics := notifier.Metrics()
	counts := outbox.Counts()

	modules := make([]string, 0, len(managedModules))
	for _, module := range managedModules {
		modules = append(modules, fmt.Sprintf("%s=%d", module, scheduler.ModuleConcurrencyLimit(module)))
	}
	sort.Strings(modules)

	logger.Info(
		ctx,
		"event alert snapshot dlq_size={} dlq_alert={} outbox_pending={} outbox_failed={} outbox_backlog_alert={} outbox_failed_alert={} outbox_sent={} scheduler_retried={} scheduler_dead_lettered={} scheduler_consume_failure={} notifier_retried={} notifier_failed={} notifier_sent={} concurrency={} ",
		snapshot.DLQSize,
		snapshot.DLQAlert,
		snapshot.OutboxPending,
		snapshot.OutboxFailed,
		snapshot.OutboxBacklogAlert,
		snapshot.OutboxFailedAlert,
		counts.Sent,
		schedulerMetrics.Retried,
		schedulerMetrics.DeadLettered,
		schedulerMetrics.ConsumeFailure,
		notifierMetrics.Retried,
		notifierMetrics.Failed,
		notifierMetrics.Sent,
		strings.Join(modules, ","),
	)
}
