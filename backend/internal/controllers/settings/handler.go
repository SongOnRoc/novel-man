package settings

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/settings"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SettingController struct {
	service settings.SettingService
}

func NewSettingController(service settings.SettingService) *SettingController {
	return &SettingController{service: service}
}

// DTOs
type SettingRequest struct {
	AIModel           string  `json:"ai_model"`
	CustomAPIEndpoint string  `json:"custom_api_endpoint"`
	EditorTheme       string  `json:"editor_theme"`
	FontSize          int     `json:"font_size"`
	LineHeight        float64 `json:"line_height"`
}

type UpdateAIModelRequest struct {
	AIModel string `json:"ai_model" binding:"required"`
}

type SettingResponse struct {
	ID                uint      `json:"id"`
	UserID            uint      `json:"user_id"`
	AIModel           string    `json:"ai_model"`
	CustomAPIEndpoint string    `json:"custom_api_endpoint"`
	EditorTheme       string    `json:"editor_theme"`
	FontSize          int       `json:"font_size"`
	LineHeight        float64   `json:"line_height"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type ListSettingsResponse struct {
	Data       []SettingResponse   `json:"data"`
	Pagination response.Pagination `json:"pagination"`
}

func toSettingResponse(setting *models.UserSetting) SettingResponse {
	return SettingResponse{
		ID:                setting.ID,
		UserID:            setting.UserID,
		AIModel:           setting.AIModel,
		CustomAPIEndpoint: setting.CustomAPIEndpoint,
		EditorTheme:       setting.EditorTheme,
		FontSize:          setting.FontSize,
		LineHeight:        setting.LineHeight,
		CreatedAt:         setting.CreatedAt,
		UpdatedAt:         setting.UpdatedAt,
	}
}

// CreateSetting godoc
// @Summary Create a new setting
// @Description Create a new setting for the logged-in user.
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   setting  body      SettingRequest  true  "Setting creation info"
// @Success 201   {object}  response.StandardResponse{data=SettingResponse}
// @Failure 400   {object}  response.StandardResponse "Invalid request body"
// @Failure 401   {object}  response.StandardResponse "Unauthorized"
// @Failure 500   {object}  response.StandardResponse "Failed to create setting"
// @Security BearerAuth
// @Router /settings [post]
func (c *SettingController) CreateSetting(ctx *gin.Context) {
	var req SettingRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	setting := &models.UserSetting{
		UserID:            userID.(uint),
		AIModel:           req.AIModel,
		CustomAPIEndpoint: req.CustomAPIEndpoint,
		EditorTheme:       req.EditorTheme,
		FontSize:          req.FontSize,
		LineHeight:        req.LineHeight,
	}

	if err := c.service.Create(*context.New(ctx), setting); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create setting", err)
		return
	}

	response.Success(ctx, http.StatusCreated, toSettingResponse(setting))
}

// GetSetting godoc
// @Summary Get a setting by ID
// @Description Get a setting by its ID
// @Tags settings
// @Produce  json
// @Param   id  path  int  true  "Setting ID"
// @Success 200 {object} response.StandardResponse{data=SettingResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Setting not found"
// @Failure 500 {object} response.StandardResponse "Failed to get setting"
// @Security BearerAuth
// @Router /settings/{id} [get]
func (c *SettingController) GetSetting(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	setting, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Setting not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get setting", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, toSettingResponse(setting))
}

// UpdateSetting godoc
// @Summary Update a setting by ID
// @Description Update a setting by its ID
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   id  path  int  true  "Setting ID"
// @Param   setting  body  SettingRequest  true  "Setting update info"
// @Success 200 {object} response.StandardResponse{data=SettingResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID or request body"
// @Failure 404 {object} response.StandardResponse "Setting not found"
// @Failure 500 {object} response.StandardResponse "Failed to update setting"
// @Security BearerAuth
// @Router /settings/{id} [put]
func (c *SettingController) UpdateSetting(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req SettingRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	setting, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Setting not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get setting for update", err)
		}
		return
	}

	setting.AIModel = req.AIModel
	setting.CustomAPIEndpoint = req.CustomAPIEndpoint
	setting.EditorTheme = req.EditorTheme
	setting.FontSize = req.FontSize
	setting.LineHeight = req.LineHeight

	if err := c.service.Update(*context.New(ctx), uint(id), setting); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update setting", err)
		return
	}

	response.Success(ctx, http.StatusOK, toSettingResponse(setting))
}

// DeleteSetting godoc
// @Summary Delete a setting by ID
// @Description Delete a setting by its ID
// @Tags settings
// @Param   id  path  int  true  "Setting ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Setting not found"
// @Failure 500 {object} response.StandardResponse "Failed to delete setting"
// @Security BearerAuth
// @Router /settings/{id} [delete]
func (c *SettingController) DeleteSetting(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Setting not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete setting", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"message": "Setting deleted successfully"})
}

// ListSettings godoc
// @Summary List settings (Admin only)
// @Description List all settings with pagination. Requires admin privileges.
// @Tags settings
// @Produce  json
// @Param   page  query  int  false  "Page number (default: 1)"
// @Param   limit query  int  false  "Number of items per page (default: 10)"
// @Success 200 {object} response.StandardResponse{data=ListSettingsResponse}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 500 {object} response.StandardResponse "Failed to retrieve settings"
// @Security BearerAuth
// @Router /settings [get]
func (c *SettingController) ListSettings(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	roleAny, exists := ctx.Get("role")
	if !exists {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
		return
	}

	role, ok := roleAny.(string)
	if !ok {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
		return
	}

	if role != "admin" && role != "operator" {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
		return
	}

	settings, total, err := c.service.List(*context.New(ctx), page, limit, make(contracts.Filters))
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to retrieve settings", err)
		return
	}

	settingResponses := make([]SettingResponse, len(settings))
	for i, setting := range settings {
		settingResponses[i] = toSettingResponse(&setting)
	}

	response.Success(ctx, http.StatusOK, ListSettingsResponse{
		Data: settingResponses,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}

// GetSettingByUserID godoc
// @Summary Get a setting by user ID
// @Description Get a setting by user ID. User can only access their own settings.
// @Tags settings
// @Produce  json
// @Param   user_id  path  int  true  "User ID"
// @Success 200 {object} response.StandardResponse{data=SettingResponse}
// @Failure 400 {object} response.StandardResponse "Invalid user ID"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 404 {object} response.StandardResponse "Setting not found"
// @Failure 500 {object} response.StandardResponse "Failed to get setting"
// @Security BearerAuth
// @Router /settings/user/{user_id} [get]
func (c *SettingController) GetSettingByUserID(ctx *gin.Context) {
	targetUserID, err := strconv.ParseUint(ctx.Param("user_id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	currentUserID, exists := ctx.Get("userID")
	if !exists || currentUserID.(uint) != uint(targetUserID) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
		return
	}

	setting, err := c.service.GetByUserID(*context.New(ctx), uint(targetUserID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Setting not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get setting", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, toSettingResponse(setting))
}

// UpdateSettingByUserID godoc
// @Summary Update a setting by user ID
// @Description Update a setting by user ID. User can only update their own settings.
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   user_id  path  int  true  "User ID"
// @Param   setting  body  SettingRequest  true  "Setting update info"
// @Success 200 {object} response.StandardResponse{data=SettingResponse}
// @Failure 400 {object} response.StandardResponse "Invalid user ID or request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 404 {object} response.StandardResponse "Setting not found"
// @Failure 500 {object} response.StandardResponse "Failed to update setting"
// @Security BearerAuth
// @Router /settings/user/{user_id} [put]
func (c *SettingController) UpdateSettingByUserID(ctx *gin.Context) {
	targetUserID, err := strconv.ParseUint(ctx.Param("user_id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	currentUserID, exists := ctx.Get("userID")
	if !exists || currentUserID.(uint) != uint(targetUserID) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
		return
	}

	var req SettingRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	setting, err := c.service.GetByUserID(*context.New(ctx), uint(targetUserID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Setting not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get setting for update", err)
		}
		return
	}

	setting.AIModel = req.AIModel
	setting.CustomAPIEndpoint = req.CustomAPIEndpoint
	setting.EditorTheme = req.EditorTheme
	setting.FontSize = req.FontSize
	setting.LineHeight = req.LineHeight

	if err := c.service.UpdateByUserID(*context.New(ctx), uint(targetUserID), setting); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update setting", err)
		return
	}

	response.Success(ctx, http.StatusOK, toSettingResponse(setting))
}

// UpdateAIModel godoc
// @Summary Update AI model setting for a user
// @Description Update the AI model setting for a specific user. User can only update their own settings.
// @Tags settings
// @Accept  json
// @Produce  json
// @Param   user_id  path  int  true  "User ID"
// @Param   ai_model  body  UpdateAIModelRequest  true  "AI Model"
// @Success 200 {object} response.StandardResponse{data=SettingResponse}
// @Failure 400 {object} response.StandardResponse "Invalid user ID or request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Permission denied"
// @Failure 404 {object} response.StandardResponse "Setting not found"
// @Failure 500 {object} response.StandardResponse "Failed to update AI model"
// @Security BearerAuth
// @Router /settings/{user_id}/ai-model [put]
func (c *SettingController) UpdateAIModel(ctx *gin.Context) {
	targetUserID, err := strconv.ParseUint(ctx.Param("user_id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid user ID", err)
		return
	}

	currentUserID, exists := ctx.Get("userID")
	if !exists || currentUserID.(uint) != uint(targetUserID) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Permission denied", nil)
		return
	}

	var req UpdateAIModelRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	setting, err := c.service.GetByUserID(*context.New(ctx), uint(targetUserID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Setting not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get setting for update", err)
		}
		return
	}

	setting.AIModel = req.AIModel

	if err := c.service.UpdateByUserID(*context.New(ctx), uint(targetUserID), setting); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update AI model", err)
		return
	}

	response.Success(ctx, http.StatusOK, toSettingResponse(setting))
}
