package works

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	// 使用 AuthRequired 中间件保护所有 /works 路由
	worksGroup := router.Group("/works")
	{
		worksGroup.POST("", createWork)
		worksGroup.GET("", getWorks)
		worksGroup.GET("/:id", getWork)
		worksGroup.PUT("/:id", updateWork)
		worksGroup.DELETE("/:id", deleteWork)
	}
}

// createWork handles the creation of a new work.
func createWork(c *gin.Context) {
	var input struct {
		Title         string `json:"title" binding:"required"`
		Description   string `json:"description"`
		CoverImageURL string `json:"cover_image_url"`
		Category      string `json:"category"`
		Status        string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	work := Work{
		UserID:        userID.(uint),
		Title:         input.Title,
		Description:   input.Description,
		CoverImageURL: input.CoverImageURL,
		Category:      input.Category,
		Status:        input.Status,
	}

	if work.Status == "" {
		work.Status = "连载中"
	}

	db := c.MustGet("db").(*gorm.DB)
	if err := db.Create(&work).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create work"})
		return
	}

	c.JSON(http.StatusCreated, work)
}

// getWorks handles fetching all works for the current user.
func getWorks(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	var works []Work

	// Pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := db.Where("user_id = ?", userID)

	// Filtering by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Model(&Work{}).Count(&total)

	if err := query.Offset(offset).Limit(limit).Find(&works).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve works"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": works,
		"pagination": gin.H{
			"total": total,
			"page":  page,
			"limit": limit,
		},
	})
}

// getWork handles fetching a single work.
func getWork(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	var work Work

	if err := db.Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&work).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve work"})
		return
	}

	c.JSON(http.StatusOK, work)
}

// updateWork handles updating a work.
func updateWork(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	var work Work

	if err := db.Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&work).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve work"})
		return
	}

	var input struct {
		Title         string `json:"title"`
		Description   string `json:"description"`
		CoverImageURL string `json:"cover_image_url"`
		Category      string `json:"category"`
		Status        string `json:"status"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.Model(&work).Updates(input)

	c.JSON(http.StatusOK, work)
}

// deleteWork handles deleting a work.
func deleteWork(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	var work Work

	if err := db.Where("id = ? AND user_id = ?", c.Param("id"), userID).First(&work).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve work"})
		return
	}

	if err := db.Delete(&work).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete work"})
		return
	}

	c.Status(http.StatusNoContent)
}
