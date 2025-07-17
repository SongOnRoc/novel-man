package settings

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"novel-man/backend/internal/apps/auth"
	"novel-man/backend/internal/db"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// RegisterRoutes 注册 settings 模块的路由
func RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/settings", getSettingsHandler)
	r.PUT("/settings", upsertSettingsHandler)
}

// getSettingsHandler 获取用户偏好设置
func getSettingsHandler(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}
	currentUser := user.(auth.User)

	var userSetting UserSetting
	result := db.DB.Where("user_id = ?", currentUser.ID).First(&userSetting)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// 返回默认设置
			c.JSON(http.StatusOK, gin.H{
				"ai_model":              "default-gpt-3.5",
				"custom_api_endpoint":   "",
				"editor_theme":          "default-light",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ai_model":              userSetting.AIModel,
		"custom_api_endpoint":   userSetting.CustomAPIEndpoint,
		"editor_theme":          userSetting.EditorTheme,
	})
}

// upsertSettingsHandler 更新或创建用户偏好设置
func upsertSettingsHandler(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}
	currentUser := user.(auth.User)

	var input struct {
		AIModel           string `json:"ai_model"`
		CustomAPIEndpoint string `json:"custom_api_endpoint"`
		EditorTheme       string `json:"editor_theme"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userSetting := UserSetting{
		UserID:            currentUser.ID,
		AIModel:           input.AIModel,
		CustomAPIEndpoint: input.CustomAPIEndpoint,
		EditorTheme:       input.EditorTheme,
	}

	// 使用 OnConflict 执行 Upsert 操作
	result := db.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"ai_model", "custom_api_endpoint", "editor_theme"}),
	}).Create(&userSetting)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ai_model":              userSetting.AIModel,
		"custom_api_endpoint":   userSetting.CustomAPIEndpoint,
		"editor_theme":          userSetting.EditorTheme,
	})
}