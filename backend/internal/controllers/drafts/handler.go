package drafts

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DraftController struct {
	service drafts.DraftService
}

func NewDraftController(service drafts.DraftService) *DraftController {
	return &DraftController{service: service}
}

// DTOs
type CreateDraftRequest struct {
	WorkID      *int64 `json:"work_id"`
	Title       string `json:"title" binding:"required"`
	Content     string `json:"content"`
	Description string `json:"description"`
	Status      string `json:"status"`
	WordCount   int    `json:"word_count"`
}

type UpdateDraftRequest struct {
	WorkID      *int64 `json:"work_id,omitempty"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	Description string `json:"description"`
	Status      string `json:"status"`
	WordCount   int    `json:"word_count"`
}

type DraftResponse struct {
	ID          uint      `json:"id"`
	UserID      uint      `json:"user_id"`
	WorkID      *int64    `json:"work_id,omitempty"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Description string    `json:"description"`
	WordCount   int       `json:"word_count"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ListDraftsResponse struct {
	Data       []DraftResponse     `json:"data"`
	Pagination response.Pagination `json:"pagination"`
}

// ChapterResponse needs to be defined here to avoid circular dependency
// This should be ideally in a shared DTOs package
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

func toDraftResponse(draft *models.Draft) DraftResponse {
	return DraftResponse{
		ID:          draft.ID,
		UserID:      draft.UserID,
		WorkID:      draft.WorkID,
		Title:       draft.Title,
		Content:     draft.Content,
		Description: draft.Description,
		WordCount:   draft.WordCount,
		Status:      draft.Status,
		CreatedAt:   draft.CreatedAt,
		UpdatedAt:   draft.UpdatedAt,
	}
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

// CreateDraft godoc
// @Summary Create a new draft
// @Description Create a new draft with the given details
// @Tags drafts
// @Accept  json
// @Produce  json
// @Param draft body CreateDraftRequest true "Create Draft Request"
// @Success 201 {object} response.StandardResponse{data=DraftResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to create draft"
// @Security BearerAuth
// @Router /drafts [post]
func (c *DraftController) CreateDraft(ctx *gin.Context) {
	var req CreateDraftRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	userID, _ := ctx.Get("userID")

	draft := &models.Draft{
		UserID:      userID.(uint),
		WorkID:      req.WorkID,
		Title:       req.Title,
		Content:     req.Content,
		Description: req.Description,
		Status:      req.Status,
		WordCount:   req.WordCount,
	}

	if err := c.service.Create(*context.New(ctx), draft); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create draft", err)
		return
	}

	response.Success(ctx, http.StatusCreated, toDraftResponse(draft))
}

// GetDraft godoc
// @Summary Get a single draft
// @Description Get a single draft by its ID
// @Tags drafts
// @Produce  json
// @Param id path int true "Draft ID"
// @Success 200 {object} response.StandardResponse{data=DraftResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Draft not found"
// @Failure 500 {object} response.StandardResponse "Failed to get draft"
// @Security BearerAuth
// @Router /drafts/{id} [get]
func (c *DraftController) GetDraft(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	draft, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Draft not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get draft", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, toDraftResponse(draft))
}

// UpdateDraft godoc
// @Summary Update a draft
// @Description Update a draft with the given details
// @Tags drafts
// @Accept  json
// @Produce  json
// @Param id path int true "Draft ID"
// @Param draft body UpdateDraftRequest true "Update Draft Request"
// @Success 200 {object} response.StandardResponse{data=DraftResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID or request body"
// @Failure 404 {object} response.StandardResponse "Draft not found"
// @Failure 500 {object} response.StandardResponse "Failed to update draft"
// @Security BearerAuth
// @Router /drafts/{id} [put]
func (c *DraftController) UpdateDraft(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req UpdateDraftRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	draft, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Draft not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get draft for update", err)
		}
		return
	}

	draft.Title = req.Title
	draft.Content = req.Content
	draft.WordCount = req.WordCount
	draft.Description = req.Description
	draft.Status = req.Status
	// Allow associating a draft with a work.
	// If req.WorkID is nil, it will not be updated.
	// If req.WorkID is a valid int64 pointer, it will be updated.
	if req.WorkID != nil {
		draft.WorkID = req.WorkID
	}

	if err := c.service.Update(*context.New(ctx), uint(id), draft); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update draft", err)
		return
	}

	response.Success(ctx, http.StatusOK, toDraftResponse(draft))
}

// DeleteDraft godoc
// @Summary Delete a draft
// @Description Delete a draft by its ID
// @Tags drafts
// @Param id path int true "Draft ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Draft not found"
// @Failure 500 {object} response.StandardResponse "Failed to delete draft"
// @Security BearerAuth
// @Router /drafts/{id} [delete]
func (c *DraftController) DeleteDraft(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Draft not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete draft", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"message": "Draft deleted successfully"})
}

// ListDrafts godoc
// @Summary List user's drafts
// @Description Get a list of the current user's drafts, optionally filtered by work_id.
// @Tags drafts
// @Produce  json
// @Param work_id query int false "Filter by Work ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} response.StandardResponse{data=ListDraftsResponse}
// @Failure 400 {object} response.StandardResponse "Invalid work_id"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to retrieve drafts"
// @Security BearerAuth
// @Router /drafts [get]
func (c *DraftController) ListDrafts(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	workIDStr := ctx.Query("work_id")

	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	filters := make(contracts.Filters)
	filters["user_id"] = userID.(uint)

	if workIDStr != "" {
		workID, err := strconv.ParseInt(workIDStr, 10, 64)
		if err != nil {
			response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid work_id", err)
			return
		}
		filters["work_id"] = workID
	}

	drafts, total, err := c.service.List(*context.New(ctx), page, limit, filters)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to retrieve drafts", err)
		return
	}

	draftResponses := make([]DraftResponse, len(drafts))
	for i, draft := range drafts {
		draftResponses[i] = toDraftResponse(&draft)
	}

	response.Success(ctx, http.StatusOK, ListDraftsResponse{
		Data: draftResponses,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}

// PublishDraft godoc
// @Summary Publish a draft to a chapter
// @Description Publish a draft by its ID, creating a new chapter and deleting the draft
// @Tags drafts
// @Param id path int true "Draft ID"
// @Success 200 {object} response.StandardResponse{data=ChapterResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Draft not found"
// @Failure 500 {object} response.StandardResponse "Failed to publish draft"
// @Security BearerAuth
// @Router /drafts/{id}/publish [post]
func (c *DraftController) PublishDraft(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	chapter, err := c.service.Publish(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Draft not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to publish draft", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, toChapterResponse(chapter))
}
