package cmd

import (
	// 激活各业务模块 - 通过空白导入实现模块的自动注册
	_ "novel-man/backend/internal/apps/auth"
	_ "novel-man/backend/internal/apps/chapters"
	_ "novel-man/backend/internal/apps/characters"
	_ "novel-man/backend/internal/apps/drafts"
	_ "novel-man/backend/internal/apps/generate"
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
