package prompts

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/auth"
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
)

type Detail struct {
	Icon string `json:"icon,omitempty"`
	Text string `json:"text,omitempty"`
}

// DTOs for Prompts
type PromptResponse struct {
	ID              uint      `json:"id"`
	Title           string    `json:"title"`
	Content         string    `json:"content,omitempty"`
	Description     string    `json:"description,omitempty"`
	Summary         []Detail  `json:"summary,omitempty"`
	Author          string    `json:"author,omitempty"`
	AuthorSpecialty string    `json:"author_specialty,omitempty"`
	AuthorAvatar    string    `json:"author_avatar,omitempty"`
	UsageCount      uint      `json:"usage_count"`
	PrimaryTag      string    `json:"primary_tag,omitempty"`
	Categories      []string  `json:"categories,omitempty"`
	FooterTags      []string  `json:"footer_tags,omitempty"`
	UpdatedAt       time.Time `json:"updated_at"`
	UserID          uint      `json:"user_id"`
	Status          string    `json:"status"`
	IsSystem        bool      `json:"is_system"`
}

type PromptListResponse struct {
	Items      []PromptResponse    `json:"items"`
	Pagination response.Pagination `json:"pagination"`
}

type CreatePromptRequest struct {
	Title       string          `json:"title" binding:"required"`
	Content     string          `json:"content" binding:"required"`
	Description string          `json:"description,omitempty"`
	Summary     json.RawMessage `json:"summary,omitempty" swaggertype:"object"`
	PrimaryTag  string          `json:"primary_tag,omitempty"`
	Categories  []string        `json:"categories,omitempty"`
	FooterTags  []string        `json:"footer_tags,omitempty"`
}

type UpdatePromptRequest struct {
	Title           *string         `json:"title,omitempty"`
	Content         *string         `json:"content,omitempty"`
	Description     *string         `json:"description,omitempty"`
	Summary         json.RawMessage `json:"summary,omitempty" swaggertype:"object"`
	Author          *string         `json:"author,omitempty"`
	AuthorSpecialty *string         `json:"author_specialty,omitempty"`
	AuthorAvatar    *string         `json:"author_avatar,omitempty"`
	PrimaryTag      *string         `json:"primary_tag,omitempty"`
	Categories      []string        `json:"categories,omitempty"`
	FooterTags      []string        `json:"footer_tags,omitempty"`
	Status          *string         `json:"status,omitempty"`
}

// ImportResult 导入结果
type ImportResult struct {
	Success int      `json:"success"`
	Failed  int      `json:"failed"`
	Total   int      `json:"total"`
	Errors  []string `json:"errors,omitempty"`
}

// PromptController handles HTTP requests for prompts.
type PromptController struct {
	service  prompts.PromptService
	userRepo auth.UserRepository
}

// NewPromptController creates a new instance of PromptController.
func NewPromptController(service prompts.PromptService, userRepo auth.UserRepository) *PromptController {
	return &PromptController{
		service:  service,
		userRepo: userRepo,
	}
}

// toPromptResponse converts a Prompt model to a PromptResponse DTO.
func toPromptResponse(p *models.Prompt) PromptResponse {
	var summary []Detail
	var categories, footerTags []string

	// Ignore unmarshal errors, if data is invalid, frontend will get empty or nil slices.
	_ = json.Unmarshal(p.Summary, &summary)
	_ = json.Unmarshal(p.Categories, &categories)
	_ = json.Unmarshal(p.FooterTags, &footerTags)

	return PromptResponse{
		ID:              p.ID,
		Title:           p.Title,
		Content:         p.Content,
		Description:     p.Description,
		Summary:         summary,
		Author:          p.Author,
		AuthorSpecialty: p.AuthorSpecialty,
		AuthorAvatar:    p.AuthorAvatar,
		UsageCount:      p.UsageCount,
		PrimaryTag:      p.PrimaryTag,
		Categories:      categories,
		FooterTags:      footerTags,
		UpdatedAt:       p.UpdatedAt,
		UserID:          p.UserID,
		Status:          p.Status,
		IsSystem:        p.IsSystem,
	}
}

// ListPrompts godoc
// @Summary List user's prompts
// @Description Get a paginated list of prompts for the current user, with optional filters.
// @Tags prompts
// @Security BearerAuth
// @Accept  json
// @Produce  json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param category query string false "Filter by category"
// @Success 200 {object} response.StandardResponse{data=PromptListResponse}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Internal Server Error"
// @Router /prompts [get]
func (c *PromptController) ListPrompts(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	filters := make(contracts.Filters)
	baseQuery := "user_id = ? OR is_system = ?"
	queryParams := []interface{}{userID.(uint), true}

	if category := ctx.Query("category"); category != "" {
		baseQuery += " AND (categories LIKE ? OR primary_tag = ?)"
		queryParams = append(queryParams, "%"+category+"%", category)
	}
	filters[contracts.FilterKeyQuery] = baseQuery
	filters[contracts.FilterKeyParams] = queryParams

	prompts, total, err := c.service.List(*context.New(ctx), page, limit, filters)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to list prompts", err)
		return
	}

	var respItems []PromptResponse
	for _, p := range prompts {
		respItems = append(respItems, toPromptResponse(&p))
	}

	resp := PromptListResponse{
		Items: respItems,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	}
	response.Success(ctx, http.StatusOK, resp)
}

// CreatePrompt godoc
// @Summary Create a new prompt
// @Description Create a new prompt for the current user.
// @Tags prompts
// @Security BearerAuth
// @Accept  json
// @Produce  json
// @Param   prompt  body      CreatePromptRequest  true  "Prompt creation info"
// @Success 201 {object} response.StandardResponse{data=PromptResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to create prompt"
// @Router /prompts [post]
func (c *PromptController) CreatePrompt(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	var req CreatePromptRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	user, err := c.userRepo.FindUserByID(*context.New(ctx), userID.(uint))
	if err != nil {
		logger.Warn(context.New(ctx),
			"Failed to fetch user info for prompt creation, userID: {}. Prompt will be created without author info. Error: {}",
			userID, err)
	}

	categoriesJSON, err := json.Marshal(req.Categories)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid categories format", err)
		return
	}
	footerTagsJSON, err := json.Marshal(req.FooterTags)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid footer_tags format", err)
		return
	}

	prompt := &models.Prompt{
		UserID:      userID.(uint),
		Title:       req.Title,
		Content:     req.Content,
		Description: req.Description,
		Summary:     datatypes.JSON(req.Summary),
		PrimaryTag:  req.PrimaryTag,
		Categories:  categoriesJSON,
		FooterTags:  footerTagsJSON,
	}

	if user != nil {
		prompt.Author = user.Username
		prompt.AuthorAvatar = user.Avatar
		prompt.AuthorSpecialty = user.Description
	}

	if err := c.service.Create(*context.New(ctx), prompt); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create prompt", err)
		return
	}

	response.Success(ctx, http.StatusCreated, toPromptResponse(prompt))
}

// GetPrompt godoc
// @Summary Get a single prompt
// @Description Get a single prompt by its ID, including its content.
// @Tags prompts
// @Security BearerAuth
// @Accept  json
// @Produce  json
// @Param id path int true "Prompt ID"
// @Success 200 {object} response.StandardResponse{data=PromptResponse}
// @Failure 400 {object} response.StandardResponse "Invalid prompt ID"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Forbidden"
// @Failure 404 {object} response.StandardResponse "Prompt not found"
// @Failure 500 {object} response.StandardResponse "Failed to retrieve prompt"
// @Router /prompts/{id} [get]
func (c *PromptController) GetPrompt(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid prompt ID", err)
		return
	}

	prompt, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Prompt not found", err)
		return
	}

	if !prompt.IsSystem && prompt.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "You do not have permission to view this prompt", nil)
		return
	}

	response.Success(ctx, http.StatusOK, toPromptResponse(prompt))
}

// UpdatePrompt godoc
// @Summary Update an existing prompt
// @Description Update an existing prompt for the current user.
// @Tags prompts
// @Security BearerAuth
// @Accept  json
// @Produce  json
// @Param id path int true "Prompt ID"
// @Param prompt body UpdatePromptRequest true "Prompt update info"
// @Success 200 {object} response.StandardResponse{data=PromptResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body or ID"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Forbidden"
// @Failure 404 {object} response.StandardResponse "Prompt not found"
// @Failure 500 {object} response.StandardResponse "Failed to update prompt"
// @Router /prompts/{id} [put]
func (c *PromptController) UpdatePrompt(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid prompt ID", err)
		return
	}

	var req UpdatePromptRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	prompt, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Prompt not found", err)
		return
	}

	if prompt.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "You do not have permission to update this prompt", nil)
		return
	}

	if req.Title != nil {
		prompt.Title = *req.Title
	}
	if req.Content != nil {
		prompt.Content = *req.Content
	}
	if req.Description != nil {
		prompt.Description = *req.Description
	}
	if req.Summary != nil {
		prompt.Summary = datatypes.JSON(req.Summary)
	}
	if req.Author != nil {
		prompt.Author = *req.Author
	}
	if req.AuthorSpecialty != nil {
		prompt.AuthorSpecialty = *req.AuthorSpecialty
	}
	if req.AuthorAvatar != nil {
		prompt.AuthorAvatar = *req.AuthorAvatar
	}
	if req.PrimaryTag != nil {
		prompt.PrimaryTag = *req.PrimaryTag
	}
	if req.Categories != nil {
		categoriesJSON, err := json.Marshal(req.Categories)
		if err != nil {
			response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid categories format", err)
			return
		}
		prompt.Categories = categoriesJSON
	}
	if req.FooterTags != nil {
		footerTagsJSON, err := json.Marshal(req.FooterTags)
		if err != nil {
			response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid footer_tags format", err)
			return
		}
		prompt.FooterTags = footerTagsJSON
	}
	if req.Status != nil {
		prompt.Status = *req.Status
	}

	if err := c.service.Update(*context.New(ctx), uint(id), prompt); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update prompt", err)
		return
	}

	response.Success(ctx, http.StatusOK, toPromptResponse(prompt))
}

// DeletePrompt godoc
// @Summary Delete a prompt
// @Description Delete a prompt for the current user.
// @Tags prompts
// @Security BearerAuth
// @Accept  json
// @Produce  json
// @Param id path int true "Prompt ID"
// @Success 204 "No Content"
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Forbidden"
// @Failure 404 {object} response.StandardResponse "Prompt not found"
// @Failure 500 {object} response.StandardResponse "Failed to delete prompt"
// @Router /prompts/{id} [delete]
func (c *PromptController) DeletePrompt(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid prompt ID", err)
		return
	}

	prompt, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Prompt not found", err)
		return
	}

	if prompt.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "You do not have permission to delete this prompt", nil)
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete prompt", err)
		return
	}

	response.Success(ctx, http.StatusNoContent, nil)
}

// Import godoc
// @Summary Import prompts from file
// @Description Import prompts from uploaded file (supports .txt, .md, .json, .zip formats)
// @Tags prompts
// @Security BearerAuth
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "File to import"
// @Success 200 {object} response.StandardResponse{data=ImportResult}
// @Failure 400 {object} response.StandardResponse "Invalid file format or size"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 413 {object} response.StandardResponse "File too large"
// @Failure 415 {object} response.StandardResponse "Unsupported file type"
// @Failure 500 {object} response.StandardResponse "Failed to import prompts"
// @Router /prompts/import [post]
func (c *PromptController) Import(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	ct := context.New(ctx)
	// 获取上传的文件
	// Generated frontend client uses "data" key, so we check that first, fallback to "file"
	file, err := ctx.FormFile("data")
	if err != nil {
		file, err = ctx.FormFile("file")
	}
	if err != nil {
		logger.Warn(ct, "Import: Failed to get file from form: %v", err)
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "No file uploaded", err)
		return
	}

	logger.Info(ct, "Import: File received - Name: %s, Size: %d, ContentType: %s",
		file.Filename, file.Size, file.Header.Get("Content-Type"))

	// 调用导入服务
	result, err := c.service.Import(*ct, file, userID.(uint))
	if err != nil {
		logger.Error(ct, "Import: Failed to import prompts: %v", err)
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to import prompts", err)
		return
	}

	logger.Info(ct, "Import: Import successful - Success: %d, Failed: %d, Total: %d",
		result.Success, result.Failed, result.Total)

	response.Success(ctx, http.StatusOK, result)
}
