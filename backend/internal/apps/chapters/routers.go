package chapters

import (
	"fmt"
	"net/http"
	"novel-man/backend/internal/apps/works"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes registers the chapter routes.
// Note that this function is designed to be called on a router group already prefixed with /works/:work_id
func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	chaptersGroup := router.Group("/chapters")
	{
		chaptersGroup.POST("", createChapter)
		chaptersGroup.GET("", getChapters)
		chaptersGroup.GET("/:chapter_id", getChapter)
		chaptersGroup.PUT("/:chapter_id", updateChapter)
		chaptersGroup.DELETE("/:chapter_id", deleteChapter)
	}
}

// createChapter handles the creation of a new chapter for a specific work.
func createChapter(c *gin.Context) {
	var input struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content"`
		Order   int    `json:"order"`
		Status  string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)

	// Simple word count
	wordCount := len([]rune(input.Content))

	chapter := Chapter{
		WorkID:    work.ID,
		Title:     input.Title,
		Content:   input.Content,
		Order:     input.Order,
		WordCount: wordCount,
		Status:    input.Status,
	}

	if chapter.Status == "" {
		chapter.Status = "草稿"
	}

	if err := db.Create(&chapter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chapter"})
		return
	}

	c.JSON(http.StatusCreated, chapter)
}

// getChapters handles fetching all chapters for a specific work.
func getChapters(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)

	var chapters []Chapter

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	// Sorting
	sortBy := c.DefaultQuery("sort_by", "order")
	sortOrder := c.DefaultQuery("sort_order", "asc")

	// Whitelist for sort_by to prevent SQL injection
	allowedSortBy := map[string]bool{
		"order":        true,
		"title":        true,
		"word_count":   true,
		"published_at": true,
		"created_at":   true,
		"updated_at":   true,
	}
	if !allowedSortBy[sortBy] {
		sortBy = "order" // Default to a safe value
	}

	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "asc" // Default to a safe value
	}

	orderClause := fmt.Sprintf("`%s` %s", sortBy, sortOrder)

	query := db.Where("work_id = ?", work.ID)

	var total int64
	query.Model(&Chapter{}).Count(&total)

	if err := query.Order(orderClause).Offset(offset).Limit(limit).Find(&chapters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chapters"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": chapters,
		"pagination": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// getChapter handles fetching a single chapter.
func getChapter(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	chapterID := c.Param("chapter_id")

	var chapter Chapter
	if err := db.Where("id = ? AND work_id = ?", chapterID, work.ID).First(&chapter).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chapter"})
		return
	}

	c.JSON(http.StatusOK, chapter)
}

// updateChapter handles updating a chapter.
func updateChapter(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	chapterID := c.Param("chapter_id")

	var chapter Chapter
	if err := db.Where("id = ? AND work_id = ?", chapterID, work.ID).First(&chapter).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chapter"})
		return
	}

	var input struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		Order   int    `json:"order"`
		Status  string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update word count if content is changed
	if input.Content != "" {
		chapter.WordCount = len([]rune(input.Content))
	}

	updates := Chapter{
		Title:   input.Title,
		Content: input.Content,
		Order:   input.Order,
		Status:  input.Status,
	}

	db.Model(&chapter).Updates(updates)

	c.JSON(http.StatusOK, chapter)
}

// deleteChapter handles deleting a chapter.
func deleteChapter(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	chapterID := c.Param("chapter_id")

	var chapter Chapter
	if err := db.Where("id = ? AND work_id = ?", chapterID, work.ID).First(&chapter).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chapter"})
		return
	}

	if err := db.Delete(&chapter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chapter"})
		return
	}

	c.Status(http.StatusNoContent)
}
