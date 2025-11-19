package works

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"
	"sync"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type WorkController struct {
	service                 works.WorkService
	chapter                 chapters.ChapterService
	recalculationInProgress sync.Map
}

func NewWorkController(service works.WorkService, chapterService chapters.ChapterService) *WorkController {
	return &WorkController{
		service:                 service,
		chapter:                 chapterService,
		recalculationInProgress: sync.Map{},
	}
}

// DTOs
type CreateWorkRequest struct {
	Title         string `json:"title" binding:"required"`
	Description   string `json:"description"`
	Category      string `json:"category"`
	Status        string `json:"status"`
	CoverImageURL string `json:"cover_image_url"`
	Outline       string `json:"outline"`
}

type UpdateWorkRequest struct {
	Title         string `json:"title"`
	Description   string `json:"description"`
	Category      string `json:"category"`
	Status        string `json:"status"`
	Outline       string `json:"outline"`
	CoverImageURL string `json:"cover_image_url"`
}

type WorkResponse struct {
	ID                int64     `json:"id"`
	UserID            uint      `json:"user_id"`
	Title             string    `json:"title"`
	Description       string    `json:"description"`
	Category          string    `json:"category"`
	Status            string    `json:"status"`
	CoverImageURL     string    `json:"cover_image_url"`
	Outline           string    `json:"outline"`
	TotalWordCount    int       `json:"total_word_count"`
	TotalChapterCount int       `json:"total_chapter_count"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type ListWorksResponse struct {
	Data       []WorkResponse      `json:"data"`
	Pagination response.Pagination `json:"pagination"`
}

func toWorkResponse(work *models.Work) WorkResponse {
	return WorkResponse{
		ID:                work.ID,
		UserID:            work.UserID,
		Title:             work.Title,
		Description:       work.Description,
		Category:          work.Category,
		Status:            work.Status,
		CoverImageURL:     work.CoverImageURL,
		Outline:           work.Outline,
		TotalWordCount:    work.TotalWordCount,
		TotalChapterCount: work.TotalChapterCount,
		CreatedAt:         work.CreatedAt,
		UpdatedAt:         work.UpdatedAt,
	}
}

// recalculateWorkStats 是一个辅助方法，用于异步地重新计算和更新作品的统计数据
func (c *WorkController) recalculateWorkStats(ctx context.Context, work *models.Work) {
	// 1. 获取该作品下的所有章节
	filters := contracts.Filters{"work_id": work.ID}
	chapters, _, err := c.chapter.List(ctx, 1, 100000, filters)
	if err != nil {
		// 在后台任务中，我们通常只记录错误，而不影响主流程
		logger.Error(&ctx, "Failed to list chapters for stats recalculation for work %d: %v", work.ID, err)
		return
	}

	// 2. 计算总字数和总章节数
	totalWordCount := 0
	for _, chapter := range chapters {
		totalWordCount += chapter.WordCount
	}
	totalChapterCount := len(chapters)

	// 3. 如果统计数据没有变化，则无需更新
	if totalWordCount == work.TotalWordCount && totalChapterCount == work.TotalChapterCount {
		return
	}

	// 4. 更新 Work 的统计数据
	work.TotalWordCount = totalWordCount
	work.TotalChapterCount = totalChapterCount
	if err := c.service.Update(ctx, work.ID, work); err != nil {
		logger.Error(&ctx, "Failed to update work stats after recalculation for work %d: %v", work.ID, err)
	}
}

// CreateWork godoc
// @Summary Create a new work
// @Description Create a new work with the given details
// @Tags works
// @Accept  json
// @Produce  json
// @Param work body CreateWorkRequest true "Create Work Request"
// @Success 201 {object} response.StandardResponse{data=WorkResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to create work"
// @Security BearerAuth
// @Router /works [post]
func (c *WorkController) CreateWork(ctx *gin.Context) {
	var req CreateWorkRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	work := &models.Work{
		UserID:        userID.(uint),
		Title:         req.Title,
		Description:   req.Description,
		CoverImageURL: req.CoverImageURL,
		Category:      req.Category,
		Outline:       req.Outline,
		Status:        req.Status,
	}
	if work.Status == "" {
		work.Status = "draft"
	}

	if err := c.service.Create(*context.New(ctx), work); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create work", err)
		return
	}

	response.Success(ctx, http.StatusCreated, toWorkResponse(work))
}

// GetWork godoc
// @Summary Get a single work
// @Description Get a single work by its ID
// @Tags works
// @Produce  json
// @Param id path int true "Work ID"
// @Success 200 {object} response.StandardResponse{data=WorkResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Work not found"
// @Failure 500 {object} response.StandardResponse "Failed to get work"
// @Security BearerAuth
// @Router /works/{id} [get]
func (c *WorkController) GetWork(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	work, err := c.service.GetByID(*context.New(ctx), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Work not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get work", err)
		}
		return
	}

	// 惰性计算：如果 total_word_count 为 0，则异步重新计算
	// if work.TotalWordCount == 0 || work.TotalChapterCount == 0 {
	// 使用 sync.Map 防止对同一个 work 的并发计算
	if _, loaded := c.recalculationInProgress.LoadOrStore(work.ID, true); !loaded {
		go func() {
			// 在 goroutine 结束时，从 map 中删除标记
			defer c.recalculationInProgress.Delete(work.ID)
			// 使用克隆的 context，以防原始请求结束
			c.recalculateWorkStats(*context.New(ctx.Copy()), work)
		}()
		// }
	}

	response.Success(ctx, http.StatusOK, toWorkResponse(work))
}

// UpdateWork godoc
// @Summary Update a work
// @Description Update a work with the given details
// @Tags works
// @Accept  json
// @Produce  json
// @Param id path int true "Work ID"
// @Param work body UpdateWorkRequest true "Update Work Request"
// @Success 200 {object} response.StandardResponse{data=WorkResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID or request body"
// @Failure 404 {object} response.StandardResponse "Work not found"
// @Failure 500 {object} response.StandardResponse "Failed to update work"
// @Security BearerAuth
// @Router /works/{id} [put]
func (c *WorkController) UpdateWork(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req UpdateWorkRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	work, err := c.service.GetByID(*context.New(ctx), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Work not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get work for update", err)
		}
		return
	}

	// Update fields from request
	work.Title = req.Title
	work.Description = req.Description
	work.CoverImageURL = req.CoverImageURL
	work.Category = req.Category
	work.Outline = req.Outline
	work.Status = req.Status

	if err := c.service.Update(*context.New(ctx), id, work); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update work", err)
		return
	}

	response.Success(ctx, http.StatusOK, toWorkResponse(work))
}

// DeleteWork godoc
// @Summary Delete a work
// @Description Delete a work by its ID
// @Tags works
// @Param id path int true "Work ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Work not found"
// @Failure 500 {object} response.StandardResponse "Failed to delete work"
// @Security BearerAuth
// @Router /works/{id} [delete]
func (c *WorkController) DeleteWork(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	if err := c.service.Delete(*context.New(ctx), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Work not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete work", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"message": "Work deleted successfully"})
}

// ListWorks godoc
// @Summary List user's works
// @Description Get a list of the current user's works with pagination
// @Tags works
// @Produce  json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Param status query string false "Filter by status"
// @Success 200 {object} response.StandardResponse{data=ListWorksResponse}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to retrieve works"
// @Security BearerAuth
// @Router /works [get]
func (c *WorkController) ListWorks(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	status := ctx.Query("status")

	// 1. 从 Gin Context 获取 userID
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// 2. 创建过滤器并强制加入 userID
	filters := make(contracts.Filters)
	filters["user_id"] = userID.(uint) // 强制按用户ID过滤

	if status != "" {
		filters["status"] = status
	}

	works, total, err := c.service.List(*context.New(ctx), page, limit, filters)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to retrieve works", err)
		return
	}

	workResponses := make([]WorkResponse, len(works))
	for i, work := range works {
		// 惰性计算：如果 total_word_count 为 0，则异步重新计算
		// if work.TotalWordCount == 0 || work.TotalChapterCount == 0 {
		// 使用 sync.Map 防止对同一个 work 的并发计算
		if _, loaded := c.recalculationInProgress.LoadOrStore(work.ID, true); !loaded {
			// 捕获 work 变量以在闭包中使用
			currentWork := work
			go func() {
				// 在 goroutine 结束时，从 map 中删除标记
				defer c.recalculationInProgress.Delete(currentWork.ID)
				// 使用克隆的 context，以防原始请求结束
				c.recalculateWorkStats(*context.New(ctx.Copy()), &currentWork)
			}()
		}
		// }
		workResponses[i] = toWorkResponse(&work)
	}

	response.Success(ctx, http.StatusOK, ListWorksResponse{
		Data: workResponses,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}

// PublishWork godoc
// @Summary Publish a work
// @Description Publish a work by its ID
// @Tags works
// @Param id path int true "Work ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Work not found"
// @Failure 500 {object} response.StandardResponse "Failed to publish work"
// @Security BearerAuth
// @Router /works/{id}/publish [post]
func (c *WorkController) PublishWork(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	if err := c.service.Publish(*context.New(ctx), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Work not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to publish work", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"message": "Work published successfully"})
}

// Import godoc
// @Summary Import works from file
// @Description Import works from uploaded file (supports .json formats)
// @Tags works
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "File to import"
// @Success 200 {object} response.StandardResponse{data=contracts.ImportResult}
// @Failure 400 {object} response.StandardResponse "Invalid file format or size"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 413 {object} response.StandardResponse "File too large"
// @Failure 415 {object} response.StandardResponse "Unsupported file type"
// @Failure 500 {object} response.StandardResponse "Failed to import works"
// @Router /works/import [post]
func (c *WorkController) Import(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	ct := context.New(ctx)
	// 获取上传的文件
	// Generated frontend client uses "data" key, so we check that first, fallback to "file"
	file, err := ctx.FormFile("data")
	if err != nil {
		file, err = ctx.FormFile("file")
	}
	if err != nil {
		logger.Warn(ct, "Import: Failed to get file from form: %v", err)
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "No file uploaded", err)
		return
	}

	logger.Info(ct, "Import: File received - Name: %s, Size: %d, ContentType: %s",
		file.Filename, file.Size, file.Header.Get("Content-Type"))

	// 调用导入服务
	result, err := c.service.Import(*ct, file, userID.(uint))
	if err != nil {
		logger.Error(ct, "Import: Failed to import works: %v", err)
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to import works", err)
		return
	}

	logger.Info(ct, "Import: Import successful - Success: %d, Failed: %d, Total: %d",
		result.Success, result.Failed, result.Total)

	response.Success(ctx, http.StatusOK, result)
}
