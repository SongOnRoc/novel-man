package ops

import (
	"errors"
	"net/http"
	"strconv"

	opsc "novel-man/backend/internal/contracts/ops"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type OpsController struct {
	service opsc.OpsService
}

func NewOpsController(service opsc.OpsService) *OpsController {
	return &OpsController{service: service}
}

type ListJobsResponse struct {
	Data       any                 `json:"data"`
	Pagination response.Pagination `json:"pagination"`
}

// CreateWorksRecalcStatsJob godoc
// @Summary Create a works stats recalculation ops job
// @Description Create a new ops job of type works.recalc_stats (cluster-safe unique by lock)
// @Tags ops
// @Accept  json
// @Produce  json
// @Param payload body ops.CreateWorksRecalcStatsJobRequest true "Create job payload"
// @Success 201 {object} response.StandardResponse{data=models.OpsJob}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 409 {object} response.StandardResponse "Job already running"
// @Failure 500 {object} response.StandardResponse "Failed to create job"
// @Security BearerAuth
// @Router /ops/jobs/works/recalc-stats [post]
func (c *OpsController) CreateWorksRecalcStatsJob(ctx *gin.Context) {
	var req opsc.CreateWorksRecalcStatsJobRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	adminIDAny, exists := ctx.Get("adminID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	adminID, ok := adminIDAny.(uint)
	if !ok {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	traceHeader := ctx.GetHeader("X-Trace-ID")
	var traceID *string
	if traceHeader != "" {
		traceID = &traceHeader
	}

	job, err := c.service.CreateWorksRecalcStatsJob(*context.New(ctx), adminID, nil, traceID, req)
	if err != nil {
		// MVP：用 message 区分冲突
		if err.Error() == "job already running (lock not acquired)" {
			response.Error(ctx, http.StatusConflict, http.StatusConflict, "Job already running", err)
			return
		}
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create job", err)
		return
	}

	response.Success(ctx, http.StatusCreated, job)
}

// ListJobs godoc
// @Summary List ops jobs
// @Description List ops jobs with optional filters and pagination
// @Tags ops
// @Produce  json
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Page size (default: 20)"
// @Param type query string false "Filter by job_type"
// @Param status query string false "Filter by status"
// @Success 200 {object} response.StandardResponse{data=ListJobsResponse}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 500 {object} response.StandardResponse "Failed to list jobs"
// @Security BearerAuth
// @Router /ops/jobs [get]
func (c *OpsController) ListJobs(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	jobType := ctx.Query("type")
	status := ctx.Query("status")

	jobs, total, err := c.service.ListJobs(*context.New(ctx), page, limit, jobType, status)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to list jobs", err)
		return
	}

	response.Success(ctx, http.StatusOK, ListJobsResponse{
		Data: jobs,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}

// GetJob godoc
// @Summary Get ops job detail
// @Description Get a single ops job by job_id
// @Tags ops
// @Produce  json
// @Param job_id path string true "Job ID"
// @Success 200 {object} response.StandardResponse{data=models.OpsJob}
// @Failure 400 {object} response.StandardResponse "Invalid job_id"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 404 {object} response.StandardResponse "Job not found"
// @Failure 500 {object} response.StandardResponse "Failed to get job"
// @Security BearerAuth
// @Router /ops/jobs/{job_id} [get]
func (c *OpsController) GetJob(ctx *gin.Context) {
	jobID := ctx.Param("job_id")
	if jobID == "" {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid job_id", nil)
		return
	}

	job, err := c.service.GetJob(*context.New(ctx), jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Job not found", err)
			return
		}
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get job", err)
		return
	}

	response.Success(ctx, http.StatusOK, job)
}

// CancelJob godoc
// @Summary Request cancel ops job
// @Description Request cancel for a running job (two-phase cancel: request only)
// @Tags ops
// @Accept  json
// @Produce  json
// @Param job_id path string true "Job ID"
// @Param payload body ops.RequestCancelJobRequest false "Cancel reason"
// @Success 200 {object} response.StandardResponse{data=object{requested=bool}}
// @Failure 400 {object} response.StandardResponse "Invalid request"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 404 {object} response.StandardResponse "Job not found"
// @Failure 409 {object} response.StandardResponse "Job not running"
// @Failure 500 {object} response.StandardResponse "Failed to request cancel"
// @Security BearerAuth
// @Router /ops/jobs/{job_id}/cancel [post]
func (c *OpsController) CancelJob(ctx *gin.Context) {
	jobID := ctx.Param("job_id")
	if jobID == "" {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid job_id", nil)
		return
	}

	// 先查一次，区分 404 vs 非 running
	job, err := c.service.GetJob(*context.New(ctx), jobID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Job not found", err)
			return
		}
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get job", err)
		return
	}
	if job.Status != "running" {
		response.Error(ctx, http.StatusConflict, http.StatusConflict, "Job not running", nil)
		return
	}

	var req opsc.RequestCancelJobRequest
	_ = ctx.ShouldBindJSON(&req) // reason 可选

	adminIDAny, exists := ctx.Get("adminID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	adminID, ok := adminIDAny.(uint)
	if !ok {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	reason := req.Reason
	requested, err := c.service.RequestCancel(*context.New(ctx), jobID, adminID, reason)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to request cancel", err)
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"requested": requested})
}

// DeleteJob godoc
// @Summary Permanently delete an ops job
// @Description Hard delete an ops job by job_id (permanent)
// @Tags ops
// @Produce  json
// @Param job_id path string true "Job ID"
// @Success 200 {object} response.StandardResponse{data=object{deleted=bool}}
// @Failure 400 {object} response.StandardResponse "Invalid job_id"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 500 {object} response.StandardResponse "Failed to delete job"
// @Security BearerAuth
// @Router /ops/jobs/{job_id} [delete]
func (c *OpsController) DeleteJob(ctx *gin.Context) {
	jobID := ctx.Param("job_id")
	if jobID == "" {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid job_id", nil)
		return
	}

	deleted, err := c.service.DeleteJob(*context.New(ctx), jobID)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete job", err)
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"deleted": deleted})
}

// ClearJobs godoc
// @Summary Clear ops jobs by current filter (including pagination)
// @Description Hard delete ops jobs by filters + pagination range (page/limit are part of the clearing scope)
// @Tags ops
// @Produce  json
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Page size (default: 20)"
// @Param type query string false "Filter by job_type"
// @Param status query string false "Filter by status"
// @Success 200 {object} response.StandardResponse{data=object{deleted=int64}}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 500 {object} response.StandardResponse "Failed to clear jobs"
// @Security BearerAuth
// @Router /ops/jobs [delete]
func (c *OpsController) ClearJobs(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "20"))
	jobType := ctx.Query("type")
	status := ctx.Query("status")

	deleted, err := c.service.ClearJobs(*context.New(ctx), page, limit, jobType, status)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to clear jobs", err)
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"deleted": deleted})
}
