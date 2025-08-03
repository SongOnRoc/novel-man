package worldview

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/worldview"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"
)

// WorldviewController 只依赖于 contracts 层定义的接口
type WorldviewController struct {
	categoryService worldview.WorldviewCategoryService
	itemService     worldview.WorldviewItemService
}

// NewWorldviewController 创建一个新的 WorldviewController 实例
func NewWorldviewController(
	categoryService worldview.WorldviewCategoryService,
	itemService worldview.WorldviewItemService,
) *WorldviewController {
	return &WorldviewController{
		categoryService: categoryService,
		itemService:     itemService,
	}
}

// --- DTOs ---

// Category DTOs
type CreateCategoryRequest struct {
	Name string `json:"name" binding:"required"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name" binding:"required"`
}

type CategoryResponse struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ListCategoriesResponse struct {
	Data       []CategoryResponse    `json:"data"`
	Pagination response.Pagination `json:"pagination"`
}

// Item DTOs
type CreateItemRequest struct {
	CategoryID    uint   `json:"category_id" binding:"required"`
	Name          string `json:"name" binding:"required"`
	Description   string `json:"description"`
	CoverImageURL string `json:"cover_image_url"`
}

type UpdateItemRequest struct {
	CategoryID    uint   `json:"category_id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	CoverImageURL string `json:"cover_image_url"`
}

type ItemResponse struct {
	ID            uint      `json:"id"`
	UserID        uint      `json:"user_id"`
	CategoryID    uint      `json:"category_id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	CoverImageURL string    `json:"cover_image_url"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type ListItemsResponse struct {
	Data       []ItemResponse        `json:"data"`
	Pagination response.Pagination `json:"pagination"`
}

// --- Converters ---

func toCategoryResponse(category *models.WorldviewCategory) CategoryResponse {
	return CategoryResponse{
		ID:        category.ID,
		UserID:    category.UserID,
		Name:      category.Name,
		CreatedAt: category.CreatedAt,
		UpdatedAt: category.UpdatedAt,
	}
}

func toItemResponse(item *models.WorldviewItem) ItemResponse {
	return ItemResponse{
		ID:            item.ID,
		UserID:        item.UserID,
		CategoryID:    item.CategoryID,
		Name:          item.Name,
		Description:   item.Description,
		CoverImageURL: item.CoverImageURL,
		CreatedAt:     item.CreatedAt,
		UpdatedAt:     item.UpdatedAt,
	}
}

// --- Category Handlers ---

// CreateCategory godoc
// @Summary Create a new worldview category
// @Description Create a new worldview category for the current user
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param category body CreateCategoryRequest true "Create Category Request"
// @Success 201 {object} response.StandardResponse{data=CategoryResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to create category"
// @Security BearerAuth
// @Router /worldview/categories [post]
func (c *WorldviewController) CreateCategory(ctx *gin.Context) {
	var req CreateCategoryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	category := &models.WorldviewCategory{
		UserID: userID.(uint),
		Name:   req.Name,
	}

	if err := c.categoryService.Create(*context.New(ctx), category); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create worldview category", err)
		return
	}
	response.Success(ctx, http.StatusCreated, toCategoryResponse(category))
}

// GetCategories godoc
// @Summary Get all worldview categories
// @Description Get all worldview categories for the current user
// @Tags worldview
// @Produce  json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} response.StandardResponse{data=ListCategoriesResponse}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to fetch categories"
// @Security BearerAuth
// @Router /worldview/categories [get]
func (c *WorldviewController) GetCategories(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	filters := contracts.Filters{"user_id": userID.(uint)}

	categories, total, err := c.categoryService.List(*context.New(ctx), page, limit, filters)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to fetch worldview categories", err)
		return
	}

	categoryResponses := make([]CategoryResponse, len(categories))
	for i, category := range categories {
		categoryResponses[i] = toCategoryResponse(&category)
	}

	response.Success(ctx, http.StatusOK, ListCategoriesResponse{
		Data: categoryResponses,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}

// GetCategory godoc
// @Summary Get a single worldview category
// @Description Get a single worldview category by its ID
// @Tags worldview
// @Produce  json
// @Param id path int true "Category ID"
// @Success 200 {object} response.StandardResponse{data=CategoryResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 403 {object} response.StandardResponse "Access denied"
// @Failure 404 {object} response.StandardResponse "Category not found"
// @Failure 500 {object} response.StandardResponse "Failed to get category"
// @Security BearerAuth
// @Router /worldview/categories/{id} [get]
func (c *WorldviewController) GetCategory(ctx *gin.Context) {
	categoryID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid category ID", err)
		return
	}
	userID, _ := ctx.Get("userID")

	category, err := c.categoryService.GetByID(*context.New(ctx), uint(categoryID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Worldview category not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get category", err)
		}
		return
	}

	if category.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Access denied", nil)
		return
	}

	response.Success(ctx, http.StatusOK, toCategoryResponse(category))
}

// UpdateCategory godoc
// @Summary Update a worldview category
// @Description Update a worldview category with the given details
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param id path int true "Category ID"
// @Param category body UpdateCategoryRequest true "Update Category Request"
// @Success 200 {object} response.StandardResponse{data=CategoryResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID or request body"
// @Failure 403 {object} response.StandardResponse "Access denied"
// @Failure 404 {object} response.StandardResponse "Category not found"
// @Failure 500 {object} response.StandardResponse "Failed to update category"
// @Security BearerAuth
// @Router /worldview/categories/{id} [put]
func (c *WorldviewController) UpdateCategory(ctx *gin.Context) {
	categoryID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid category ID", err)
		return
	}
	userID, _ := ctx.Get("userID")

	var req UpdateCategoryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// 获取现有的分类，以验证用户权限
	existingCategory, err := c.categoryService.GetByID(*context.New(ctx), uint(categoryID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Worldview category not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get category for update", err)
		}
		return
	}

	if existingCategory.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Access denied", nil)
		return
	}

	existingCategory.Name = req.Name

	if err := c.categoryService.Update(*context.New(ctx), uint(categoryID), existingCategory); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update worldview category", err)
		return
	}

	response.Success(ctx, http.StatusOK, toCategoryResponse(existingCategory))
}

// DeleteCategory godoc
// @Summary Delete a worldview category
// @Description Delete a worldview category by its ID
// @Tags worldview
// @Param id path int true "Category ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 403 {object} response.StandardResponse "Access denied"
// @Failure 404 {object} response.StandardResponse "Category not found"
// @Failure 500 {object} response.StandardResponse "Failed to delete category"
// @Security BearerAuth
// @Router /worldview/categories/{id} [delete]
func (c *WorldviewController) DeleteCategory(ctx *gin.Context) {
	categoryID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid category ID", err)
		return
	}
	userID, _ := ctx.Get("userID")

	existingCategory, err := c.categoryService.GetByID(*context.New(ctx), uint(categoryID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Worldview category not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get category for delete", err)
		}
		return
	}

	if existingCategory.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Access denied", nil)
		return
	}

	if err := c.categoryService.Delete(*context.New(ctx), uint(categoryID)); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete worldview category", err)
		return
	}
	response.Success(ctx, http.StatusOK, gin.H{"message": "Category and its items deleted successfully"})
}

// --- Item Handlers ---

// CreateItem godoc
// @Summary Create a new worldview item
// @Description Create a new worldview item for the current user
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param item body CreateItemRequest true "Create Item Request"
// @Success 201 {object} response.StandardResponse{data=ItemResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to create item"
// @Security BearerAuth
// @Router /worldview/items [post]
func (c *WorldviewController) CreateItem(ctx *gin.Context) {
	var req CreateItemRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	item := &models.WorldviewItem{
		UserID:        userID.(uint),
		CategoryID:    req.CategoryID,
		Name:          req.Name,
		Description:   req.Description,
		CoverImageURL: req.CoverImageURL,
	}

	if err := c.itemService.Create(*context.New(ctx), item); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create worldview item", err)
		return
	}
	response.Success(ctx, http.StatusCreated, toItemResponse(item))
}

// GetItems godoc
// @Summary Get all worldview items for a category
// @Description Get all worldview items for a given category
// @Tags worldview
// @Produce  json
// @Param category_id query int true "Category ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} response.StandardResponse{data=ListItemsResponse}
// @Failure 400 {object} response.StandardResponse "category_id is required or invalid"
// @Failure 500 {object} response.StandardResponse "Failed to fetch items"
// @Security BearerAuth
// @Router /worldview/items [get]
func (c *WorldviewController) GetItems(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	categoryIDStr := ctx.Query("category_id")

	if categoryIDStr == "" {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "category_id is required", nil)
		return
	}
	categoryID, err := strconv.ParseUint(categoryIDStr, 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid category_id", err)
		return
	}

	filters := contracts.Filters{"category_id": uint(categoryID)}

	items, total, err := c.itemService.List(*context.New(ctx), page, limit, filters)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to fetch worldview items", err)
		return
	}

	itemResponses := make([]ItemResponse, len(items))
	for i, item := range items {
		itemResponses[i] = toItemResponse(&item)
	}

	response.Success(ctx, http.StatusOK, ListItemsResponse{
		Data: itemResponses,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}

// GetItem godoc
// @Summary Get a single worldview item
// @Description Get a single worldview item by its ID
// @Tags worldview
// @Produce  json
// @Param id path int true "Item ID"
// @Success 200 {object} response.StandardResponse{data=ItemResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 403 {object} response.StandardResponse "Access denied"
// @Failure 404 {object} response.StandardResponse "Item not found"
// @Failure 500 {object} response.StandardResponse "Failed to get item"
// @Security BearerAuth
// @Router /worldview/items/{id} [get]
func (c *WorldviewController) GetItem(ctx *gin.Context) {
	itemID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid item ID", err)
		return
	}
	userID, _ := ctx.Get("userID")

	item, err := c.itemService.GetByID(*context.New(ctx), uint(itemID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Worldview item not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get item", err)
		}
		return
	}

	if item.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Access denied", nil)
		return
	}

	response.Success(ctx, http.StatusOK, toItemResponse(item))
}

// UpdateItem godoc
// @Summary Update a worldview item
// @Description Update a worldview item with the given details
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param id path int true "Item ID"
// @Param item body UpdateItemRequest true "Update Item Request"
// @Success 200 {object} response.StandardResponse{data=ItemResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID or request body"
// @Failure 403 {object} response.StandardResponse "Access denied"
// @Failure 404 {object} response.StandardResponse "Item not found"
// @Failure 500 {object} response.StandardResponse "Failed to update item"
// @Security BearerAuth
// @Router /worldview/items/{id} [put]
func (c *WorldviewController) UpdateItem(ctx *gin.Context) {
	itemID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid item ID", err)
		return
	}
	userID, _ := ctx.Get("userID")

	var req UpdateItemRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	existingItem, err := c.itemService.GetByID(*context.New(ctx), uint(itemID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Worldview item not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get item for update", err)
		}
		return
	}

	if existingItem.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Access denied", nil)
		return
	}

	// Update fields
	existingItem.CategoryID = req.CategoryID
	existingItem.Name = req.Name
	existingItem.Description = req.Description
	existingItem.CoverImageURL = req.CoverImageURL

	if err := c.itemService.Update(*context.New(ctx), uint(itemID), existingItem); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update worldview item", err)
		return
	}

	response.Success(ctx, http.StatusOK, toItemResponse(existingItem))
}

// DeleteItem godoc
// @Summary Delete a worldview item
// @Description Delete a worldview item by its ID
// @Tags worldview
// @Param id path int true "Item ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 403 {object} response.StandardResponse "Access denied"
// @Failure 404 {object} response.StandardResponse "Item not found"
// @Failure 500 {object} response.StandardResponse "Failed to delete item"
// @Security BearerAuth
// @Router /worldview/items/{id} [delete]
func (c *WorldviewController) DeleteItem(ctx *gin.Context) {
	itemID, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid item ID", err)
		return
	}
	userID, _ := ctx.Get("userID")

	existingItem, err := c.itemService.GetByID(*context.New(ctx), uint(itemID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Worldview item not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get item for delete", err)
		}
		return
	}

	if existingItem.UserID != userID.(uint) {
		response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Access denied", nil)
		return
	}

	if err := c.itemService.Delete(*context.New(ctx), uint(itemID)); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete worldview item", err)
		return
	}
	response.Success(ctx, http.StatusOK, gin.H{"message": "Item deleted successfully"})
}
