package ops

import (
	"net/http"

	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	opsc "novel-man/backend/internal/contracts/ops"
	controller_ops "novel-man/backend/internal/controllers/ops"
	"novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	repo_gorm "novel-man/backend/internal/repositories/gorm"
	service_ops "novel-man/backend/internal/services/ops"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
)

type opsModule struct {
	middlewareProvider *middlewares.MiddlewareProvider
}

func init() {
	apps.Register(&opsModule{})

	// repositories
	container.Container.Provide(repo_gorm.NewOpsJobGormRepository)
	container.Container.Provide(repo_gorm.NewOpsJobLockGormRepository)

	// service + controller
	container.Container.Provide(service_ops.NewOpsService)
	container.Container.Provide(controller_ops.NewOpsController)
}

func (m *opsModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *controller_ops.OpsController,
		provider *middlewares.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		opsGroup := router.Group("/ops")
		adminAuthMiddleware, ok := m.getMiddleware(auth.AdminAuthMiddlewareName)
		if !ok {
			panic("admin auth middleware not found")
		}
		opsGroup.Use(adminAuthMiddleware)
		opsGroup.Use(requireOpsRole())

		jobsGroup := opsGroup.Group("/jobs")
		{
			jobsGroup.POST("/works/recalc-stats", controller.CreateWorksRecalcStatsJob)
			jobsGroup.GET("", controller.ListJobs)
			jobsGroup.GET("/:job_id", controller.GetJob)
			jobsGroup.POST("/:job_id/cancel", controller.CancelJob)
			jobsGroup.DELETE("/:job_id", controller.DeleteJob)
			jobsGroup.DELETE("", controller.ClearJobs)
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *opsModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}

func requireOpsRole() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		roleAny, exists := ctx.Get("adminRole")
		if !exists {
			response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
			ctx.Abort()
			return
		}
		role, ok := roleAny.(string)
		if !ok {
			response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
			ctx.Abort()
			return
		}

		if role != opsc.OpsRoleAdmin && role != opsc.OpsRoleOperator {
			response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}
