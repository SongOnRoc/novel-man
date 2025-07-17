package drafts

import (
	"net/http"
	"novel-man/backend/internal/apps/chapters"
	"novel-man/backend/internal/apps/works"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes registers the draft routes under a work-specific group.
func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	draftsGroup := router.Group("/drafts")
	{
		draftsGroup.POST("", createDraft)
		draftsGroup.GET("", getDrafts)
		draftsGroup.GET("/:draft_id", getDraft)
		draftsGroup.PUT("/:draft_id", updateDraft)
		draftsGroup.DELETE("/:draft_id", deleteDraft)
		draftsGroup.POST("/:draft_id/publish", publishDraft)
	}
}

// createDraft handles creating a new draft.
func createDraft(c *gin.Context) {
	var input struct {
		Title   string `json:"title" binding:"required"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)

	draft := Draft{
		WorkID:  work.ID,
		Title:   input.Title,
		Content: input.Content,
	}

	if err := db.Create(&draft).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create draft"})
		return
	}

	c.JSON(http.StatusCreated, draft)
}

// getDrafts handles fetching all drafts for a work.
func getDrafts(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)

	var drafts []Draft
	if err := db.Where("work_id = ?", work.ID).Find(&drafts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve drafts"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": drafts})
}

// getDraft handles fetching a single draft.
func getDraft(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	draftID := c.Param("draft_id")

	var draft Draft
	if err := db.Where("id = ? AND work_id = ?", draftID, work.ID).First(&draft).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Draft not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve draft"})
		return
	}

	c.JSON(http.StatusOK, draft)
}

// updateDraft handles updating a draft.
func updateDraft(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	draftID := c.Param("draft_id")

	var draft Draft
	if err := db.Where("id = ? AND work_id = ?", draftID, work.ID).First(&draft).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Draft not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve draft"})
		return
	}

	var input struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := Draft{
		Title:   input.Title,
		Content: input.Content,
	}

	db.Model(&draft).Updates(updates)

	c.JSON(http.StatusOK, draft)
}

// deleteDraft handles deleting a draft.
func deleteDraft(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	draftID := c.Param("draft_id")

	var draft Draft
	if err := db.Where("id = ? AND work_id = ?", draftID, work.ID).First(&draft).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Draft not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve draft"})
		return
	}

	if err := db.Delete(&draft).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete draft"})
		return
	}

	c.Status(http.StatusNoContent)
}

// publishDraft handles publishing a draft to a new chapter.
func publishDraft(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	draftID := c.Param("draft_id")

	var draft Draft
	if err := db.Where("id = ? AND work_id = ?", draftID, work.ID).First(&draft).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Draft not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve draft"})
		return
	}

	// Use a transaction to ensure atomicity
	err := db.Transaction(func(tx *gorm.DB) error {
		// Create a new chapter from the draft
		now := time.Now()
		newChapter := chapters.Chapter{
			WorkID:      draft.WorkID,
			Title:       draft.Title,
			Content:     draft.Content,
			WordCount:   len([]rune(draft.Content)),
			Status:      "已发布",
			PublishedAt: &now,
		}

		if err := tx.Create(&newChapter).Error; err != nil {
			return err
		}

		// Delete the draft
		if err := tx.Delete(&draft).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish draft: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Draft published successfully"})
}
