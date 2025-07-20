package chapters

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

type ChapterController struct {
	service chapters.ChapterService
}

func NewChapterController(service chapters.ChapterService) *ChapterController {
	return &ChapterController{service: service}
}

type CreateChapterRequest struct {
	WorkID       uint   `json:"work_id" binding:"required"`
	VolumeID     *uint  `json:"volume_id"`
	Title        string `json:"title" binding:"required"`
	Content      string `json:"content"`
	DisplayOrder int    `json:"display_order"`
	Status       string `json:"status"`
}

// CreateChapter godoc
// @Summary Create a new chapter
// @Description Create a new chapter for a work
// @Tags chapters
// @Accept  json
// @Produce  json
// @Param chapter body CreateChapterRequest true "Create Chapter Request"
// @Success 201 {object} models.Chapter
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /chapters [post]
func (c *ChapterController) CreateChapter(ctx *gin.Context) {
	var req CreateChapterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	chapter := &models.Chapter{
		WorkID:       req.WorkID,
		VolumeID:     req.VolumeID,
		Title:        req.Title,
		Content:      req.Content,
		DisplayOrder: req.DisplayOrder,
		Status:       req.Status,
	}

	if err := c.service.Create(*context.New(ctx), chapter); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, chapter)
}

// GetChapter godoc
// @Summary Get a single chapter
// @Description Get a single chapter by its ID
// @Tags chapters
// @Produce  json
// @Param id path int true "Chapter ID"
// @Success 200 {object} models.Chapter
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /chapters/{id} [get]
func (c *ChapterController) GetChapter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	chapter, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, chapter)
}

type UpdateChapterRequest struct {
	VolumeID     *uint  `json:"volume_id"`
	Title        string `json:"title"`
	Content      string `json:"content"`
	DisplayOrder int    `json:"display_order"`
	Status       string `json:"status"`
}

// UpdateChapter godoc
// @Summary Update a chapter
// @Description Update a chapter with the given details
// @Tags chapters
// @Accept  json
// @Produce  json
// @Param id path int true "Chapter ID"
// @Param chapter body UpdateChapterRequest true "Update Chapter Request"
// @Success 200 {object} models.Chapter
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /chapters/{id} [put]
func (c *ChapterController) UpdateChapter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateChapterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	chapter, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新可更新的字段
	if req.VolumeID != nil {
		chapter.VolumeID = req.VolumeID
	}
	if req.Title != "" {
		chapter.Title = req.Title
	}
	if req.Content != "" {
		chapter.Content = req.Content
	}
	chapter.DisplayOrder = req.DisplayOrder
	if req.Status != "" {
		chapter.Status = req.Status
	}

	if err := c.service.Update(*context.New(ctx), uint(id), chapter); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, chapter)
}

// DeleteChapter godoc
// @Summary Delete a chapter
// @Description Delete a chapter by its ID
// @Tags chapters
// @Param id path int true "Chapter ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /chapters/{id} [delete]
func (c *ChapterController) DeleteChapter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// ListChapters godoc
// @Summary List all chapters
// @Description Get a list of all chapters with pagination
// @Tags chapters
// @Produce  json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /chapters [get]
func (c *ChapterController) ListChapters(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	chapters, total, err := c.service.List(*context.New(ctx), page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  chapters,
		"total": total,
	})
}