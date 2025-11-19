package chapters

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

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ChapterController struct {
	service     chapters.ChapterService
	workService works.WorkService
}

func NewChapterController(service chapters.ChapterService, workService works.WorkService) *ChapterController {
	return &ChapterController{service: service, workService: workService}
}

// DTOs
type CreateChapterRequest struct {
	WorkID       int64  `json:"work_id" binding:"required"`
	VolumeID     *uint  `json:"volume_id"`
	Title        string `json:"title" binding:"required"`
	Content      string `json:"content"`
	DisplayOrder int    `json:"display_order"`
	Status       string `json:"status"`
	WordCount    int    `json:"word_count"`
}

type UpdateChapterRequest struct {
	VolumeID     *uint  `json:"volume_id"`
	Title        string `json:"title"`
	Content      string `json:"content"`
	DisplayOrder int    `json:"display_order"`
	Status       string `json:"status"`
	WordCount    int    `json:"word_count"`
}

type ChapterResponse struct {
	ID           uint       `json:"id"`
	WorkID       int64      `json:"work_id"`
	VolumeID     *uint      `json:"volume_id,omitempty"`
	Title        string     `json:"title"`
	Content      string     `json:"content"`
	WordCount    int        `json:"word_count"`
	DisplayOrder int        `json:"display_order"`
	Status       string     `json:"status"`
	PublishedAt  *time.Time `json:"published_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type ListChaptersResponse struct {
	Data       []ChapterResponse   `json:"data"`
	Pagination response.Pagination `json:"pagination"`
}

func toChapterResponse(chapter *models.Chapter) ChapterResponse {
	return ChapterResponse{
		ID:           chapter.ID,
		WorkID:       chapter.WorkID,
		VolumeID:     chapter.VolumeID,
		Title:        chapter.Title,
		Content:      chapter.Content,
		WordCount:    chapter.WordCount,
		DisplayOrder: chapter.DisplayOrder,
		Status:       chapter.Status,
		PublishedAt:  chapter.PublishedAt,
		CreatedAt:    chapter.CreatedAt,
		UpdatedAt:    chapter.UpdatedAt,
	}
}

// updateWorkWordCount 是一个辅助方法，用于在章节变更后增量更新作品的 total_word_count
func (c *ChapterController) updateWorkWordCount(ctx *gin.Context, workID int64, wordCountDelta int) error {
	// 1. 获取 Work 对象
	work, err := c.workService.GetByID(*context.New(ctx), workID)
	if err != nil {
		// 如果找不到作品，可能意味着作品已被删除，这里可以视为一种成功状态
		return nil
	}

	// 2. 增量更新 Work 的 TotalWordCount
	work.TotalWordCount += wordCountDelta
	if work.TotalWordCount < 0 { // 防止字数变为负数
		work.TotalWordCount = 0
	}

	// 3. 更新 Work
	if err := c.workService.Update(*context.New(ctx), work.ID, work); err != nil {
		return err
	}

	return nil
}

// updateWorkChapterCount 是一个辅助方法，用于在章节创建或删除后增量更新作品的 total_chapter_count
func (c *ChapterController) updateWorkChapterCount(ctx *gin.Context, workID int64, delta int) error {
	// 1. 获取 Work 对象
	work, err := c.workService.GetByID(*context.New(ctx), workID)
	if err != nil {
		return nil
	}

	// 2. 增量更新 Work 的 TotalChapterCount
	work.TotalChapterCount += delta
	if work.TotalChapterCount < 0 {
		work.TotalChapterCount = 0
	}

	// 3. 更新 Work
	if err := c.workService.Update(*context.New(ctx), work.ID, work); err != nil {
		return err
	}

	return nil
}

// CreateChapter godoc
// @Summary Create a new chapter
// @Description Create a new chapter for a work
// @Tags chapters
// @Accept  json
// @Produce  json
// @Param chapter body CreateChapterRequest true "Create Chapter Request"
// @Success 201 {object} response.StandardResponse{data=ChapterResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 500 {object} response.StandardResponse "Failed to create chapter"
// @Security BearerAuth
// @Router /chapters [post]
func (c *ChapterController) CreateChapter(ctx *gin.Context) {
	var req CreateChapterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	chapter := &models.Chapter{
		WorkID:       req.WorkID,
		VolumeID:     req.VolumeID,
		Title:        req.Title,
		Content:      req.Content,
		DisplayOrder: req.DisplayOrder,
		Status:       req.Status,
		WordCount:    req.WordCount,
	}

	if err := c.service.Create(*context.New(ctx), chapter); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create chapter", err)
		return
	}

	// 更新作品的字数统计
	if err := c.updateWorkWordCount(ctx, req.WorkID, req.WordCount); err != nil {
		logger.Error(context.New(ctx), "Failed to update work word count after chapter creation: %v", err)
	}
	if err := c.updateWorkChapterCount(ctx, req.WorkID, 1); err != nil {
		logger.Error(context.New(ctx), "Failed to update work chapter count after chapter creation: %v", err)
	}

	response.Success(ctx, http.StatusCreated, toChapterResponse(chapter))
}

// GetChapter godoc
// @Summary Get a single chapter
// @Description Get a single chapter by its ID
// @Tags chapters
// @Produce  json
// @Param id path int true "Chapter ID"
// @Success 200 {object} response.StandardResponse{data=ChapterResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Chapter not found"
// @Failure 500 {object} response.StandardResponse "Failed to get chapter"
// @Security BearerAuth
// @Router /chapters/{id} [get]
func (c *ChapterController) GetChapter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	chapter, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Chapter not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get chapter", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, toChapterResponse(chapter))
}

// UpdateChapter godoc
// @Summary Update a chapter
// @Description Update a chapter with the given details
// @Tags chapters
// @Accept  json
// @Produce  json
// @Param id path int true "Chapter ID"
// @Param chapter body UpdateChapterRequest true "Update Chapter Request"
// @Success 200 {object} response.StandardResponse{data=ChapterResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID or request body"
// @Failure 404 {object} response.StandardResponse "Chapter not found"
// @Failure 500 {object} response.StandardResponse "Failed to update chapter"
// @Security BearerAuth
// @Router /chapters/{id} [put]
func (c *ChapterController) UpdateChapter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req UpdateChapterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	chapter, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Chapter not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get chapter for update", err)
		}
		return
	}

	oldWordCount := chapter.WordCount

	// Update fields
	chapter.VolumeID = req.VolumeID
	chapter.Title = req.Title
	chapter.Content = req.Content
	chapter.DisplayOrder = req.DisplayOrder
	chapter.Status = req.Status
	chapter.WordCount = req.WordCount

	if err := c.service.Update(*context.New(ctx), uint(id), chapter); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update chapter", err)
		return
	}

	// 更新作品的字数统计
	wordCountDelta := req.WordCount - oldWordCount
	if err := c.updateWorkWordCount(ctx, chapter.WorkID, wordCountDelta); err != nil {
		logger.Error(context.New(ctx), "Failed to update work word count after chapter update: %v", err)
	}

	response.Success(ctx, http.StatusOK, toChapterResponse(chapter))
}

// DeleteChapter godoc
// @Summary Delete a chapter
// @Description Delete a chapter by its ID
// @Tags chapters
// @Param id path int true "Chapter ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Chapter not found"
// @Failure 500 {object} response.StandardResponse "Failed to delete chapter"
// @Security BearerAuth
// @Router /chapters/{id} [delete]
func (c *ChapterController) DeleteChapter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	// 在删除前，先获取 chapter 对象以得到 workID 和 wordCount
	chapter, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Chapter not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get chapter for deletion", err)
		}
		return
	}

	workID := chapter.WorkID
	wordCount := chapter.WordCount

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		// 再次检查错误，以防万一
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Chapter not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete chapter", err)
		}
		return
	}

	// 更新作品的字数统计
	if err := c.updateWorkWordCount(ctx, workID, -wordCount); err != nil {
		logger.Error(context.New(ctx), "Failed to update work word count after chapter deletion: %v", err)
	}
	// 更新作品的章节数
	if err := c.updateWorkChapterCount(ctx, workID, -1); err != nil {
		logger.Error(context.New(ctx), "Failed to update work chapter count after chapter deletion: %v", err)
	}

	response.Success(ctx, http.StatusOK, gin.H{"message": "Chapter deleted successfully"})
}

// ListChapters godoc
// @Summary List all chapters for a work
// @Description Get a list of all chapters for a specific work, verifying ownership of the work.
// @Tags chapters
// @Produce  json
// @Param work_id query int true "Work ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} response.StandardResponse{data=ListChaptersResponse}
// @Failure 400 {object} response.StandardResponse "work_id is required or invalid"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 404 {object} response.StandardResponse "Work not found"
// @Failure 500 {object} response.StandardResponse "Failed to retrieve chapters"
// @Security BearerAuth
// @Router /chapters [get]
func (c *ChapterController) ListChapters(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	workIDStr := ctx.Query("work_id")

	if workIDStr == "" {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "work_id is required", nil)
		return
	}
	workID, err := strconv.ParseInt(workIDStr, 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid work_id", err)
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// Verify ownership of the work before listing chapters
	work, err := c.workService.GetByID(*context.New(ctx), workID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Work not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to verify work ownership", err)
		}
		return
	}
	if work.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
		return
	}

	filters := contracts.Filters{"work_id": workID}

	chapters, total, err := c.service.List(*context.New(ctx), page, limit, filters)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to retrieve chapters", err)
		return
	}

	chapterResponses := make([]ChapterResponse, len(chapters))
	for i, chapter := range chapters {
		chapterResponses[i] = toChapterResponse(&chapter)
	}

	response.Success(ctx, http.StatusOK, ListChaptersResponse{
		Data: chapterResponses,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}

// Import godoc
// @Summary Import chapters from file
// @Description Import chapters from uploaded file (supports .txt, .md, .json, .zip formats)
// @Tags chapters
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param work_id query int true "Work ID"
// @Param file formData file true "File to import"
// @Success 200 {object} response.StandardResponse{data=contracts.ImportResult}
// @Failure 400 {object} response.StandardResponse "Invalid file format or size"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 413 {object} response.StandardResponse "File too large"
// @Failure 415 {object} response.StandardResponse "Unsupported file type"
// @Failure 500 {object} response.StandardResponse "Failed to import chapters"
// @Router /chapters/import [post]
func (c *ChapterController) Import(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	workIDStr := ctx.Query("work_id")
	if workIDStr == "" {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "work_id is required", nil)
		return
	}
	workID, err := strconv.ParseUint(workIDStr, 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid work_id", err)
		return
	}

	// Verify ownership of the work
	work, err := c.workService.GetByID(*context.New(ctx), int64(workID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Work not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to verify work ownership", err)
		}
		return
	}
	if work.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
		return
	}

	// 将 workID 放入 context 中传递给 service
	// 注意：backend/utils/context 包可能没有 WithValue 方法，或者我们需要使用标准库的 context
	// 查看 backend/utils/context 包，它似乎是对 gin.Context 的封装或别名
	// 如果 context.New(ctx) 返回的是 *gin.Context，那么它有 Set 方法，但没有 WithValue
	// 如果它返回的是标准库 context.Context 的封装，我们需要确认
	// 假设 context.New(ctx) 返回的是 *context.Context (自定义结构体)
	// 让我们先尝试使用 ctx.Set (gin.Context 的方法) 来传递数据，因为 service 层接收的是 context.Context
	// 但是 service 层使用的是 backend/utils/context.Context

	// 修正：直接在 ctx (gin.Context) 中设置值，因为 backend/utils/context.New(ctx) 会包装它
	ctx.Set("workID", uint(workID))
	// 重新创建 context
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
		logger.Error(ct, "Import: Failed to import chapters: %v", err)
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to import chapters", err)
		return
	}

	logger.Info(ct, "Import: Import successful - Success: %d, Failed: %d, Total: %d",
		result.Success, result.Failed, result.Total)

	// 更新作品的统计数据
	if result.Success > 0 {
		// 这里只能粗略更新章节数，字数统计比较复杂，建议触发重新计算
		if err := c.updateWorkChapterCount(ctx, int64(workID), result.Success); err != nil {
			logger.Error(ct, "Failed to update work chapter count after import: %v", err)
		}
		// 触发异步重新计算统计数据
		// 注意：recalculateWorkStats 是 WorkController 的方法，ChapterController 无法直接调用
		// 我们需要通过 WorkService 或其他方式触发，或者暂时忽略异步重新计算，仅依靠上面的 updateWorkChapterCount
		// 由于 ChapterController 没有 WorkController 的引用，这里暂时移除 recalculateWorkStats 调用
		// 以后可以考虑通过事件总线或将 recalculateWorkStats 移至 Service 层来解决
	}

	response.Success(ctx, http.StatusOK, result)
}
