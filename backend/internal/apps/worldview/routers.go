package worldview

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes 注册 worldview 模块的路由
func RegisterRoutes(router *gin.RouterGroup) {
	// Categories
	router.POST("/categories", createCategory)
	router.GET("/categories", getCategories)
	router.PUT("/categories/:id", updateCategory)
	router.DELETE("/categories/:id", deleteCategory)

	// Settings
	router.POST("/settings", createSetting)
	router.GET("/settings", getSettings)
	router.GET("/settings/:id", getSetting)
	router.PUT("/settings/:id", updateSetting)
	router.DELETE("/settings/:id", deleteSetting)
}

// createCategory godoc
// @Summary Create a new worldview category
// @Description Create a new worldview category for the current user
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param   category  body      WorldviewCategory  true  "Category info"
// @Success 201 {object} WorldviewCategory
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Router /worldview/categories [post]
func createCategory(c *gin.Context) {
	var input WorldviewCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("userID").(uint)
	input.UserID = userID

	db := c.MustGet("db").(*gorm.DB)
	if err := db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// getCategories godoc
// @Summary Get all worldview categories
// @Description Get all worldview categories for the current user
// @Tags worldview
// @Produce  json
// @Success 200 {array} WorldviewCategory
// @Failure 401 {object} gin.H
// @Router /worldview/categories [get]
func getCategories(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	db := c.MustGet("db").(*gorm.DB)

	var categories []WorldviewCategory
	if err := db.Where("user_id = ?", userID).Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// updateCategory godoc
// @Summary Update a worldview category
// @Description Update a worldview category by ID
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param   id        path      int                true  "Category ID"
// @Param   category  body      WorldviewCategory  true  "Category info"
// @Success 200 {object} WorldviewCategory
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 404 {object} gin.H
// @Router /worldview/categories/{id} [put]
func updateCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var category WorldviewCategory
	db := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("userID").(uint)

	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	var input WorldviewCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.Name = input.Name
	db.Save(&category)

	c.JSON(http.StatusOK, category)
}

// deleteCategory godoc
// @Summary Delete a worldview category
// @Description Delete a worldview category by ID
// @Tags worldview
// @Param   id   path      int  true  "Category ID"
// @Success 204
// @Failure 401 {object} gin.H
// @Failure 404 {object} gin.H
// @Router /worldview/categories/{id} [delete]
func deleteCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("userID").(uint)

	var category WorldviewCategory
	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	// TODO: Add logic to handle settings associated with this category.
	// For now, we'll just delete the category.
	db.Delete(&category)

	c.Status(http.StatusNoContent)
}

// createSetting godoc
// @Summary Create a new worldview setting
// @Description Create a new worldview setting for the current user
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param   setting  body      WorldviewSetting  true  "Setting info"
// @Success 201 {object} WorldviewSetting
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Router /worldview/settings [post]
func createSetting(c *gin.Context) {
	var input WorldviewSetting
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("userID").(uint)
	input.UserID = userID

	db := c.MustGet("db").(*gorm.DB)

	// Verify category belongs to the user
	var category WorldviewCategory
	if err := db.Where("id = ? AND user_id = ?", input.CategoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	if err := db.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create setting"})
		return
	}

	c.JSON(http.StatusCreated, input)
}

// getSettings godoc
// @Summary Get all worldview settings
// @Description Get all worldview settings for the current user, optionally filtered by category
// @Tags worldview
// @Produce  json
// @Param   category_id query int false "Category ID to filter by"
// @Success 200 {array} WorldviewSetting
// @Failure 401 {object} gin.H
// @Router /worldview/settings [get]
func getSettings(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	db := c.MustGet("db").(*gorm.DB)

	var settings []WorldviewSetting
	query := db.Where("user_id = ?", userID)

	if categoryIDStr := c.Query("category_id"); categoryIDStr != "" {
		categoryID, err := strconv.Atoi(categoryIDStr)
		if err == nil {
			query = query.Where("category_id = ?", categoryID)
		}
	}

	if err := query.Preload("Category").Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve settings"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// getSetting godoc
// @Summary Get a single worldview setting
// @Description Get a single worldview setting by ID
// @Tags worldview
// @Produce  json
// @Param   id   path      int  true  "Setting ID"
// @Success 200 {object} WorldviewSetting
// @Failure 401 {object} gin.H
// @Failure 404 {object} gin.H
// @Router /worldview/settings/{id} [get]
func getSetting(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("userID").(uint)

	var setting WorldviewSetting
	if err := db.Preload("Category").Where("id = ? AND user_id = ?", id, userID).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		return
	}

	c.JSON(http.StatusOK, setting)
}

// updateSetting godoc
// @Summary Update a worldview setting
// @Description Update a worldview setting by ID
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param   id       path      int               true  "Setting ID"
// @Param   setting  body      WorldviewSetting  true  "Setting info"
// @Success 200 {object} WorldviewSetting
// @Failure 400 {object} gin.H
// @Failure 401 {object} gin.H
// @Failure 404 {object} gin.H
// @Router /worldview/settings/{id} [put]
func updateSetting(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("userID").(uint)

	var setting WorldviewSetting
	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		return
	}

	var input WorldviewSetting
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify category belongs to the user
	var category WorldviewCategory
	if err := db.Where("id = ? AND user_id = ?", input.CategoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	setting.Name = input.Name
	setting.Description = input.Description
	setting.CategoryID = input.CategoryID
	db.Save(&setting)

	// Preload the updated category info for the response
	db.Preload("Category").First(&setting, setting.ID)

	c.JSON(http.StatusOK, setting)
}

// deleteSetting godoc
// @Summary Delete a worldview setting
// @Description Delete a worldview setting by ID
// @Tags worldview
// @Param   id   path      int  true  "Setting ID"
// @Success 204
// @Failure 401 {object} gin.H
// @Failure 404 {object} gin.H
// @Router /worldview/settings/{id} [delete]
func deleteSetting(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	db := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("userID").(uint)

	var setting WorldviewSetting
	if err := db.Where("id = ? AND user_id = ?", id, userID).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
		return
	}

	db.Delete(&setting)

	c.Status(http.StatusNoContent)
}
