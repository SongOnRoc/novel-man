package drafts

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// DraftController 只依赖于 contracts.DraftService 接口
type DraftController struct {
	service drafts.DraftService
}

func NewDraftController(service drafts.DraftService) *DraftController {
	return &DraftController{service: service}
}

// CreateDraftRequest 定义创建草稿的请求结构
type CreateDraftRequest struct {
	UserID      uint   `json:"user_id" binding:"required"`
	WorkID      *uint  `json:"work_id,omitempty"`
	Title       string `json:"title" binding:"required"`
	Content     string `json:"content"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

// CreateDraft godoc
// @Summary Create a new draft
// @Description Create a new draft with the given details
// @Tags drafts
// @Accept  json
// @Produce  json
// @Param draft body CreateDraftRequest true "Create Draft Request"
// @Success 201 {object} models.Draft
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /drafts [post]
func (c *DraftController) CreateDraft(ctx *gin.Context) {
	var req CreateDraftRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	draft := &models.Draft{
		UserID:      req.UserID,
		WorkID:      req.WorkID,
		Title:       req.Title,
		Content:     req.Content,
		Description: req.Description,
		Status:      req.Status,
		WordCount:   len([]rune(req.Content)), // 简单计算字数
	}

	if err := c.service.Create(*context.New(ctx), draft); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, draft)
}

// GetDraft godoc
// @Summary Get a single draft
// @Description Get a single draft by its ID
// @Tags drafts
// @Produce  json
// @Param id path int true "Draft ID"
// @Success 200 {object} models.Draft
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /drafts/{id} [get]
func (c *DraftController) GetDraft(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	draft, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Draft not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, draft)
}

// UpdateDraftRequest 定义更新草稿的请求结构
type UpdateDraftRequest struct {
	Title       string `json:"title"`
	Content     string `json:"content"`
	Description string `json:"description"`
	Status      string `json:"status"`
	WordCount   int    `json:"word_count"`
}

// UpdateDraft godoc
// @Summary Update a draft
// @Description Update a draft with the given details
// @Tags drafts
// @Accept  json
// @Produce  json
// @Param id path int true "Draft ID"
// @Param draft body UpdateDraftRequest true "Update Draft Request"
// @Success 200 {object} models.Draft
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /drafts/{id} [put]
func (c *DraftController) UpdateDraft(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateDraftRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	draft, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Draft not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新可更新的字段
	if req.Title != "" {
		draft.Title = req.Title
	}
	if req.Content != "" {
		draft.Content = req.Content
		draft.WordCount = len([]rune(req.Content)) // 更新字数
	}
	if req.Description != "" {
		draft.Description = req.Description
	}
	if req.Status != "" {
		draft.Status = req.Status
	}
	if req.WordCount > 0 {
		draft.WordCount = req.WordCount
	}

	if err := c.service.Update(*context.New(ctx), uint(id), draft); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, draft)
}

// DeleteDraft godoc
// @Summary Delete a draft
// @Description Delete a draft by its ID
// @Tags drafts
// @Param id path int true "Draft ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /drafts/{id} [delete]
func (c *DraftController) DeleteDraft(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Draft not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// ListDrafts godoc
// @Summary List all drafts
// @Description Get a list of all drafts with pagination
// @Tags drafts
// @Produce  json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /drafts [get]
func (c *DraftController) ListDrafts(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	drafts, total, err := c.service.List(*context.New(ctx), page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  drafts,
		"total": total,
	})
}