package works

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

type WorkController struct {
	service works.WorkService
}

func NewWorkController(service works.WorkService) *WorkController {
	return &WorkController{service: service}
}

type CreateWorkRequest struct {
	UserID        uint   `json:"user_id" binding:"required"`
	Title         string `json:"title" binding:"required"`
	Description   string `json:"description"`
	CoverImageURL string `json:"cover_image_url"`
	Category      string `json:"category"`
	Outline       string `json:"outline"`
}

// CreateWork godoc
// @Summary Create a new work
// @Description Create a new work with the given details
// @Tags works
// @Accept  json
// @Produce  json
// @Param work body CreateWorkRequest true "Create Work Request"
// @Success 201 {object} models.Work
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /works [post]
func (c *WorkController) CreateWork(ctx *gin.Context) {
	var req CreateWorkRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	work := &models.Work{
		UserID:        req.UserID,
		Title:         req.Title,
		Description:   req.Description,
		CoverImageURL: req.CoverImageURL,
		Category:      req.Category,
		Outline:       req.Outline,
		Status:        "draft", // 默认状态为草稿
	}

	if err := c.service.Create(*context.New(ctx), work); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, work)
}

// GetWork godoc
// @Summary Get a single work
// @Description Get a single work by its ID
// @Tags works
// @Produce  json
// @Param id path int true "Work ID"
// @Success 200 {object} models.Work
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /works/{id} [get]
func (c *WorkController) GetWork(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	work, err := c.service.GetByID(*context.New(ctx), id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, work)
}

type UpdateWorkRequest struct {
	Title         string `json:"title"`
	Description   string `json:"description"`
	CoverImageURL string `json:"cover_image_url"`
	Category      string `json:"category"`
	Outline       string `json:"outline"`
}

// UpdateWork godoc
// @Summary Update a work
// @Description Update a work with the given details
// @Tags works
// @Accept  json
// @Produce  json
// @Param id path int true "Work ID"
// @Param work body UpdateWorkRequest true "Update Work Request"
// @Success 200 {object} models.Work
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /works/{id} [put]
func (c *WorkController) UpdateWork(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateWorkRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	work, err := c.service.GetByID(*context.New(ctx), id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新可更新的字段
	if req.Title != "" {
		work.Title = req.Title
	}
	if req.Description != "" {
		work.Description = req.Description
	}
	if req.CoverImageURL != "" {
		work.CoverImageURL = req.CoverImageURL
	}
	if req.Category != "" {
		work.Category = req.Category
	}
	if req.Outline != "" {
		work.Outline = req.Outline
	}

	if err := c.service.Update(*context.New(ctx), id, work); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, work)
}

// DeleteWork godoc
// @Summary Delete a work
// @Description Delete a work by its ID
// @Tags works
// @Param id path int true "Work ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /works/{id} [delete]
func (c *WorkController) DeleteWork(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := c.service.Delete(*context.New(ctx), id); err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// ListWorks godoc
// @Summary List all works
// @Description Get a list of all works with pagination
// @Tags works
// @Produce  json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /works [get]
func (c *WorkController) ListWorks(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	works, total, err := c.service.List(*context.New(ctx), page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  works,
		"total": total,
	})
}

// PublishWork godoc
// @Summary Publish a work
// @Description Publish a work by its ID
// @Tags works
// @Param id path int true "Work ID"
// @Success 200 "OK"
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /works/{id}/publish [post]
func (c *WorkController) PublishWork(ctx *gin.Context) {
	id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := c.service.Publish(*context.New(ctx), id); err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusOK)
}