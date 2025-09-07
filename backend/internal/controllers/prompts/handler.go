package prompts

import (
	"net/http"
	"strconv"
	"time"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
)

// DTOs for Prompts

type PromptResponse struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	Type      string    `json:"type"`
	Tags      *string   `json:"tags,omitempty"`
	UpdatedAt time.Time `json:"updated_at"`
	UserID    uint      `json:"user_id"`
	Status    string    `json:"status"`
	IsSystem  bool      `json:"is_system"`
}

type PromptListResponse struct {
	Items      []PromptResponse    `json:"items"`
	Pagination response.Pagination `json:"pagination"`
}

type CreatePromptRequest struct {
	Title   string  `json:"title" binding:"required"`
	Content string  `json:"content" binding:"required"`
	Type    string  `json:"type"`
	Tags    *string `json:"tags,omitempty"`
}

type UpdatePromptRequest struct {
	Title   *string `json:"title,omitempty"`
	Content *string `json:"content,omitempty"`
	Tags    *string `json:"tags,omitempty"`
	Status  *string `json:"status,omitempty"`
}

// PromptController handles HTTP requests for prompts.
type PromptController struct {
	service prompts.PromptService
}

// NewPromptController creates a new instance of PromptController.
func NewPromptController(service prompts.PromptService) *PromptController {
	return &PromptController{service: service}
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
// @Param type query string false "Filter by type (e.g., 'user', 'system')"
// @Param tag query string false "Filter by tag"
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
	// Build a query that fetches prompts belonging to the user OR system prompts.
	baseQuery := "user_id = ? OR is_system = ?"
	queryParams := []interface{}{userID.(uint), true}

	if pType := ctx.Query("type"); pType != "" {
		baseQuery += " AND type = ?"
		queryParams = append(queryParams, pType)
	}
	if tag := ctx.Query("tag"); tag != "" {
		baseQuery += " AND tags LIKE ?"
		queryParams = append(queryParams, "%"+tag+"%")
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
		respItems = append(respItems, PromptResponse{
			ID:        p.ID,
			Title:     p.Title,
			Type:      p.Type,
			Tags:      p.Tags,
			UpdatedAt: p.UpdatedAt,
			UserID:    p.UserID,
			Status:    p.Status,
			IsSystem:  p.IsSystem,
		})
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

	pType := "user"
	if req.Type != "" {
		pType = req.Type
	}

	prompt := &models.Prompt{
		UserID:  userID.(uint),
		Title:   req.Title,
		Content: req.Content,
		Type:    pType,
		Tags:    req.Tags,
	}

	if err := c.service.Create(*context.New(ctx), prompt); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create prompt", err)
		return
	}

	resp := PromptResponse{
		ID:        prompt.ID,
		Title:     prompt.Title,
		Type:      prompt.Type,
		Tags:      prompt.Tags,
		UpdatedAt: prompt.UpdatedAt,
		UserID:    prompt.UserID,
		Status:    prompt.Status,
		IsSystem:  prompt.IsSystem,
	}

	response.Success(ctx, http.StatusCreated, resp)
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
	if req.Tags != nil {
		prompt.Tags = req.Tags
	}
	if req.Status != nil {
		prompt.Status = *req.Status
	}

	if err := c.service.Update(*context.New(ctx), uint(id), prompt); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update prompt", err)
		return
	}

	resp := PromptResponse{
		ID:        prompt.ID,
		Title:     prompt.Title,
		Type:      prompt.Type,
		Tags:      prompt.Tags,
		UpdatedAt: prompt.UpdatedAt,
		UserID:    prompt.UserID,
		Status:    prompt.Status,
		IsSystem:  prompt.IsSystem,
	}

	response.Success(ctx, http.StatusOK, resp)
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
