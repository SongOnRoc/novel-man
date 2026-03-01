package favorites

import (
	"net/http"
	"strconv"

	"novel-man/backend/internal/contracts/favorites"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
)

// FavoriteController handles HTTP requests for favorites.
type FavoriteController struct {
	service favorites.FavoriteService
}

// NewFavoriteController creates a new instance of FavoriteController.
func NewFavoriteController(service favorites.FavoriteService) *FavoriteController {
	return &FavoriteController{service: service}
}

// DTOs
type AddFavoriteRequest struct {
	ResourceType string `json:"resource_type" binding:"required"`
	ResourceID   uint   `json:"resource_id" binding:"required"`
}

type FavoriteIDsResponse struct {
	ResourceType string `json:"resource_type"`
	ResourceIDs  []uint `json:"resource_ids"`
}

type IsFavoriteResponse struct {
	IsFavorite bool `json:"is_favorite"`
}

// ListFavorites godoc
// @Summary Get user's favorites by type
// @Description Get a list of user's favorite resource IDs filtered by resource type
// @Tags favorites
// @Produce json
// @Param type query string true "Resource type (prompt, snippet, sentence)"
// @Success 200 {object} response.StandardResponse{data=FavoriteIDsResponse}
// @Failure 400 {object} response.StandardResponse "Missing type parameter"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to list favorites"
// @Security BearerAuth
// @Router /favorites [get]
func (c *FavoriteController) ListFavorites(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	resourceType := ctx.Query("type")
	if resourceType == "" {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Missing type parameter", nil)
		return
	}

	ids, err := c.service.ListFavoriteIDs(*context.New(ctx), userID.(uint), models.ResourceType(resourceType))
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to list favorites", err)
		return
	}

	response.Success(ctx, http.StatusOK, FavoriteIDsResponse{
		ResourceType: resourceType,
		ResourceIDs:  ids,
	})
}

// AddFavorite godoc
// @Summary Add a favorite
// @Description Add a resource to user's favorites
// @Tags favorites
// @Accept json
// @Produce json
// @Param favorite body AddFavoriteRequest true "Add Favorite Request"
// @Success 201 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to add favorite"
// @Security BearerAuth
// @Router /favorites [post]
func (c *FavoriteController) AddFavorite(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var req AddFavoriteRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	err := c.service.AddFavorite(*context.New(ctx), userID.(uint), models.ResourceType(req.ResourceType), req.ResourceID)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to add favorite", err)
		return
	}

	response.Success(ctx, http.StatusCreated, gin.H{"message": "Favorite added successfully"})
}

// RemoveFavorite godoc
// @Summary Remove a favorite
// @Description Remove a resource from user's favorites
// @Tags favorites
// @Param type path string true "Resource type"
// @Param id path int true "Resource ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to remove favorite"
// @Security BearerAuth
// @Router /favorites/{type}/{id} [delete]
func (c *FavoriteController) RemoveFavorite(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	resourceType := ctx.Param("type")
	resourceID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid resource ID", err)
		return
	}

	err = c.service.RemoveFavorite(*context.New(ctx), userID.(uint), models.ResourceType(resourceType), uint(resourceID))
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to remove favorite", err)
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"message": "Favorite removed successfully"})
}

// CheckFavorite godoc
// @Summary Check if resource is favorited
// @Description Check if a specific resource is in user's favorites
// @Tags favorites
// @Param type path string true "Resource type"
// @Param id path int true "Resource ID"
// @Success 200 {object} response.StandardResponse{data=IsFavoriteResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to check favorite"
// @Security BearerAuth
// @Router /favorites/{type}/{id} [get]
func (c *FavoriteController) CheckFavorite(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	resourceType := ctx.Param("type")
	resourceID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid resource ID", err)
		return
	}

	isFav, err := c.service.IsFavorite(*context.New(ctx), userID.(uint), models.ResourceType(resourceType), uint(resourceID))
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to check favorite", err)
		return
	}

	response.Success(ctx, http.StatusOK, IsFavoriteResponse{IsFavorite: isFav})
}
