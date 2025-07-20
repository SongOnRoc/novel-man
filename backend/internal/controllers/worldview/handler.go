package worldview

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/worldview"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
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

// --- Category Handlers ---

// CreateCategory godoc
// @Summary Create a new worldview category
// @Description Create a new worldview category for the current user
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param category body models.WorldviewCategory true "Create Category Request"
// @Success 201 {object} models.WorldviewCategory
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/categories [post]
func (c *WorldviewController) CreateCategory(ctx *gin.Context) {
	var category models.WorldviewCategory
	if err := ctx.ShouldBindJSON(&category); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := ctx.Get("userID")
	category.UserID = userID.(uint)

	if err := c.categoryService.Create(*context.New(ctx), &category); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create worldview category"})
		return
	}
	ctx.JSON(http.StatusCreated, category)
}

// GetCategories godoc
// @Summary Get all worldview categories
// @Description Get all worldview categories for the current user
// @Tags worldview
// @Produce  json
// @Success 200 {array} models.WorldviewCategory
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/categories [get]
func (c *WorldviewController) GetCategories(ctx *gin.Context) {
	userID, _ := ctx.Get("userID")
	categories, err := c.categoryService.GetCategoriesByUserID(*context.New(ctx), userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch worldview categories"})
		return
	}
	ctx.JSON(http.StatusOK, categories)
}

// GetCategory godoc
// @Summary Get a single worldview category
// @Description Get a single worldview category by its ID
// @Tags worldview
// @Produce  json
// @Param id path int true "Category ID"
// @Success 200 {object} models.WorldviewCategory
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/categories/{id} [get]
func (c *WorldviewController) GetCategory(ctx *gin.Context) {
	categoryID, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}
	userID, _ := ctx.Get("userID")

	category, err := c.categoryService.GetByID(*context.New(ctx), uint(categoryID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Worldview category not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 验证用户权限
	if category.UserID != userID.(uint) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, category)
}

// UpdateCategory godoc
// @Summary Update a worldview category
// @Description Update a worldview category with the given details
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param id path int true "Category ID"
// @Param category body map[string]interface{} true "Update Category Request"
// @Success 200 {object} models.WorldviewCategory
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/categories/{id} [put]
func (c *WorldviewController) UpdateCategory(ctx *gin.Context) {
	categoryID, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}
	userID, _ := ctx.Get("userID")

	var input map[string]interface{}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取现有的分类，以验证用户权限
	existingCategory, err := c.categoryService.GetByID(*context.New(ctx), uint(categoryID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Worldview category not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existingCategory.UserID != userID.(uint) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// 更新分类
	if name, ok := input["name"].(string); ok {
		existingCategory.Name = name
	}

	if err := c.categoryService.Update(*context.New(ctx), uint(categoryID), existingCategory); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update worldview category"})
		return
	}

	ctx.JSON(http.StatusOK, existingCategory)
}

// DeleteCategory godoc
// @Summary Delete a worldview category
// @Description Delete a worldview category by its ID
// @Tags worldview
// @Param id path int true "Category ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/categories/{id} [delete]
func (c *WorldviewController) DeleteCategory(ctx *gin.Context) {
	categoryID, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}
	userID, _ := ctx.Get("userID")

	// 获取现有的分类，以验证用户权限
	existingCategory, err := c.categoryService.GetByID(*context.New(ctx), uint(categoryID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Worldview category not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existingCategory.UserID != userID.(uint) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := c.categoryService.Delete(*context.New(ctx), uint(categoryID)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete worldview category"})
		return
	}
	ctx.Status(http.StatusNoContent)
}

// --- Item Handlers ---

// CreateItem godoc
// @Summary Create a new worldview item
// @Description Create a new worldview item for the current user
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param item body models.WorldviewItem true "Create Item Request"
// @Success 201 {object} models.WorldviewItem
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/items [post]
func (c *WorldviewController) CreateItem(ctx *gin.Context) {
	var item models.WorldviewItem
	if err := ctx.ShouldBindJSON(&item); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := ctx.Get("userID")
	item.UserID = userID.(uint)

	if err := c.itemService.Create(*context.New(ctx), &item); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create worldview item"})
		return
	}
	ctx.JSON(http.StatusCreated, item)
}

// GetItems godoc
// @Summary Get all worldview items for a category
// @Description Get all worldview items for a given category
// @Tags worldview
// @Produce  json
// @Param category_id query int true "Category ID"
// @Success 200 {array} models.WorldviewItem
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/items [get]
func (c *WorldviewController) GetItems(ctx *gin.Context) {
	categoryID, err := strconv.ParseUint(ctx.Query("category_id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or missing category_id"})
		return
	}
	userID, _ := ctx.Get("userID")
	_ = userID // 暂时忽略 userID，但在实际实现中可能需要使用

	items, err := c.itemService.GetItemsByCategoryID(*context.New(ctx), uint(categoryID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch worldview items"})
		return
	}
	ctx.JSON(http.StatusOK, items)
}

// GetItem godoc
// @Summary Get a single worldview item
// @Description Get a single worldview item by its ID
// @Tags worldview
// @Produce  json
// @Param id path int true "Item ID"
// @Success 200 {object} models.WorldviewItem
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/items/{id} [get]
func (c *WorldviewController) GetItem(ctx *gin.Context) {
	itemID, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}
	userID, _ := ctx.Get("userID")

	item, err := c.itemService.GetByID(*context.New(ctx), uint(itemID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Worldview item not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 验证用户权限
	if item.UserID != userID.(uint) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	ctx.JSON(http.StatusOK, item)
}

// UpdateItem godoc
// @Summary Update a worldview item
// @Description Update a worldview item with the given details
// @Tags worldview
// @Accept  json
// @Produce  json
// @Param id path int true "Item ID"
// @Param item body map[string]interface{} true "Update Item Request"
// @Success 200 {object} models.WorldviewItem
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/items/{id} [put]
func (c *WorldviewController) UpdateItem(ctx *gin.Context) {
	itemID, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}
	userID, _ := ctx.Get("userID")

	var input map[string]interface{}
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取现有的条目，以验证用户权限
	existingItem, err := c.itemService.GetByID(*context.New(ctx), uint(itemID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Worldview item not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existingItem.UserID != userID.(uint) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// 更新条目
	if categoryID, ok := input["category_id"].(float64); ok {
		existingItem.CategoryID = uint(categoryID)
	}
	if name, ok := input["name"].(string); ok {
		existingItem.Name = name
	}
	if description, ok := input["description"].(string); ok {
		existingItem.Description = description
	}
	if coverImageURL, ok := input["cover_image_url"].(string); ok {
		existingItem.CoverImageURL = coverImageURL
	}

	if err := c.itemService.Update(*context.New(ctx), uint(itemID), existingItem); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update worldview item"})
		return
	}

	ctx.JSON(http.StatusOK, existingItem)
}

// DeleteItem godoc
// @Summary Delete a worldview item
// @Description Delete a worldview item by its ID
// @Tags worldview
// @Param id path int true "Item ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /worldview/items/{id} [delete]
func (c *WorldviewController) DeleteItem(ctx *gin.Context) {
	itemID, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
		return
	}
	userID, _ := ctx.Get("userID")

	// 获取现有的条目，以验证用户权限
	existingItem, err := c.itemService.GetByID(*context.New(ctx), uint(itemID))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Worldview item not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existingItem.UserID != userID.(uint) {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	if err := c.itemService.Delete(*context.New(ctx), uint(itemID)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete worldview item"})
		return
	}
	ctx.Status(http.StatusNoContent)
}