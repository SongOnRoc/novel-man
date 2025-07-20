package settings

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/settings"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

type SettingController struct {
	service settings.SettingService
}

func NewSettingController(service settings.SettingService) *SettingController {
	return &SettingController{service: service}
}

type CreateSettingRequest struct {
	UserID            uint   `json:"user_id" binding:"required"`
	AIModel           string `json:"ai_model" binding:"required"`
	CustomAPIEndpoint string `json:"custom_api_endpoint"`
	EditorTheme       string `json:"editor_theme" binding:"required"`
	FontSize          int    `json:"font_size" binding:"required"`
	LineHeight        float64 `json:"line_height" binding:"required"`
}

// CreateSetting godoc
// @Summary Create a new setting
// @Description Create a new setting with user ID, AI model, custom API endpoint, editor theme, font size, and line height
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   setting  body      CreateSettingRequest  true  "Setting creation info"
// @Success 201   {object}  models.UserSetting
// @Failure 400   {object}  map[string]interface{}
// @Failure 500   {object}  map[string]interface{}
// @Router /settings [post]
func (c *SettingController) CreateSetting(ctx *gin.Context) {
	var req CreateSettingRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting := &models.UserSetting{
		UserID:            req.UserID,
		AIModel:           req.AIModel,
		CustomAPIEndpoint: req.CustomAPIEndpoint,
		EditorTheme:       req.EditorTheme,
		FontSize:          req.FontSize,
		LineHeight:        req.LineHeight,
	}

	if err := c.service.Create(*context.New(ctx), setting); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, setting)
}

// GetSetting godoc
// @Summary Get a setting by ID
// @Description Get a setting by its ID
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   id  path  int  true  "Setting ID"
// @Success 200 {object} models.UserSetting
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/{id} [get]
func (c *SettingController) GetSetting(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	setting, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, setting)
}

type UpdateSettingRequest struct {
	AIModel           string `json:"ai_model"`
	CustomAPIEndpoint string `json:"custom_api_endpoint"`
	EditorTheme       string `json:"editor_theme"`
	FontSize          int    `json:"font_size"`
	LineHeight        float64 `json:"line_height"`
}

// UpdateSetting godoc
// @Summary Update a setting by ID
// @Description Update a setting by its ID
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   id  path  int  true  "Setting ID"
// @Param   setting  body  UpdateSettingRequest  true  "Setting update info"
// @Success 200 {object} models.UserSetting
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/{id} [put]
func (c *SettingController) UpdateSetting(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateSettingRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新可更新的字段
	if req.AIModel != "" {
		setting.AIModel = req.AIModel
	}
	if req.CustomAPIEndpoint != "" {
		setting.CustomAPIEndpoint = req.CustomAPIEndpoint
	}
	if req.EditorTheme != "" {
		setting.EditorTheme = req.EditorTheme
	}
	if req.FontSize != 0 {
		setting.FontSize = req.FontSize
	}
	if req.LineHeight != 0 {
		setting.LineHeight = req.LineHeight
	}

	if err := c.service.Update(*context.New(ctx), uint(id), setting); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, setting)
}

// DeleteSetting godoc
// @Summary Delete a setting by ID
// @Description Delete a setting by its ID
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   id  path  int  true  "Setting ID"
// @Success 204 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/{id} [delete]
func (c *SettingController) DeleteSetting(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// ListSettings godoc
// @Summary List settings
// @Description List all settings with pagination
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   page  query  int  false  "Page number (default: 1)"
// @Param   limit query  int  false  "Number of items per page (default: 10)"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings [get]
func (c *SettingController) ListSettings(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	settings, total, err := c.service.List(*context.New(ctx), page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  settings,
		"total": total,
	})
}

// GetSettingByUserID godoc
// @Summary Get a setting by user ID
// @Description Get a setting by user ID
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   user_id  path  int  true  "User ID"
// @Success 200 {object} models.UserSetting
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/user/{user_id} [get]
func (c *SettingController) GetSettingByUserID(ctx *gin.Context) {
	userID, err := strconv.ParseUint(ctx.Param("user_id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	setting, err := c.service.GetByUserID(*context.New(ctx), uint(userID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, setting)
}

// UpdateSettingByUserID godoc
// @Summary Update a setting by user ID
// @Description Update a setting by user ID
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   user_id  path  int  true  "User ID"
// @Param   setting  body  UpdateSettingRequest  true  "Setting update info"
// @Success 200 {object} models.UserSetting
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /settings/user/{user_id} [put]
func (c *SettingController) UpdateSettingByUserID(ctx *gin.Context) {
	userID, err := strconv.ParseUint(ctx.Param("user_id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req UpdateSettingRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting, err := c.service.GetByUserID(*context.New(ctx), uint(userID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新可更新的字段
	if req.AIModel != "" {
		setting.AIModel = req.AIModel
	}
	if req.CustomAPIEndpoint != "" {
		setting.CustomAPIEndpoint = req.CustomAPIEndpoint
	}
	if req.EditorTheme != "" {
		setting.EditorTheme = req.EditorTheme
	}
	if req.FontSize != 0 {
		setting.FontSize = req.FontSize
	}
	if req.LineHeight != 0 {
		setting.LineHeight = req.LineHeight
	}

	if err := c.service.UpdateByUserID(*context.New(ctx), uint(userID), setting); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, setting)
}