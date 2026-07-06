package cmd

import (
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/events"
	opsrunner "novel-man/backend/internal/services/ops/runner"

	// 激活各业务模块 - 通过空白导入实现模块的自动注册
	_ "novel-man/backend/internal/apps/auth"
	_ "novel-man/backend/internal/apps/chapters"
	_ "novel-man/backend/internal/apps/characters"
	_ "novel-man/backend/internal/apps/drafts"
	_ "novel-man/backend/internal/apps/favorites"
	_ "novel-man/backend/internal/apps/generate"
	_ "novel-man/backend/internal/apps/ops"
	_ "novel-man/backend/internal/apps/prompts"
	_ "novel-man/backend/internal/apps/relationships"
	_ "novel-man/backend/internal/apps/settings"
	_ "novel-man/backend/internal/apps/works"
	_ "novel-man/backend/internal/apps/worldview"
	// 激活中间件
	// 在新的DI架构中，不再需要通过空白导入来激活中间件。
	// 它们的初始化器由其各自的包注册到容器中，
	// 然后由 middlewares.InitMiddlewares() 统一初始化。
)

func init() {
	if err := container.Container.Provide(events.NewQueueScheduler); err != nil {
		panic(err)
	}
	if err := container.Container.Provide(events.NewEventManager); err != nil {
		panic(err)
	}
	if err := container.Container.Provide(events.NewPublisher); err != nil {
		panic(err)
	}
	if err := container.Container.Provide(events.NewInMemoryOutboxStore); err != nil {
		panic(err)
	}
	if err := container.Container.Provide(events.NewNotifierWorker); err != nil {
		panic(err)
	}
	if err := container.Container.Invoke(func(*events.NotifierWorker) {}); err != nil {
		panic(err)
	}

	// ops runner: works.recalc_stats
	// 仅注册 provider；实际启动必须延后到数据库完成初始化并注入容器之后。
	if err := container.Container.Provide(opsrunner.NewGormWorkScannerDB); err != nil {
		panic(err)
	}
	if err := container.Container.Provide(opsrunner.NewWorksRecalcStatsRunner); err != nil {
		panic(err)
	}
}
