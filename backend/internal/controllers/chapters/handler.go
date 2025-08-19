package chapters

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/contracts/works"
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

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Chapter not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete chapter", err)
		}
		return
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
