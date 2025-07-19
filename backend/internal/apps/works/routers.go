package works

import (
	"encoding/json"
	"errors"
	"net/http"
	"novel-man/backend/internal/logger"
	Ctx "novel-man/backend/utils/context"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

var validate = validator.New()

func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	service := NewWorkService(db)
	handler := NewWorkHandler(service)

	worksGroup := router.Group("/works")
	{
		worksGroup.POST("", handler.createWork)
		worksGroup.GET("", handler.getWorks)
		worksGroup.GET("/:id", handler.getWork)
		worksGroup.PUT("/:id", handler.updateWork)
		worksGroup.DELETE("/:id", handler.deleteWork)
	}
}

// WorkHandler handles the HTTP requests for works.
type WorkHandler struct {
	service *WorkService
}

// NewWorkHandler creates a new instance of WorkHandler.
func NewWorkHandler(service *WorkService) *WorkHandler {
	return &WorkHandler{service: service}
}

func (h *WorkHandler) createWork(c *gin.Context) {
	customCtx := Ctx.New(c.Request.Context())
	logger.Info(customCtx, "Handling create work request")
	var input CreateWorkDTO

	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&input); err != nil {
		logger.Warn(customCtx, "Failed to decode request body: {}", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	if err := validate.Struct(input); err != nil {
		logger.Warn(customCtx, "Request body validation failed: {}", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		logger.Warn(customCtx, "Unauthorized attempt to create work: missing userID")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	work, err := h.service.CreateWork(customCtx.Context, userID.(uint), &input)
	if err != nil {
		// Service layer already logs the error
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create work"})
		return
	}

	c.JSON(http.StatusCreated, work)
}

func (h *WorkHandler) getWorks(c *gin.Context) {
	customCtx := Ctx.New(c.Request.Context())
	logger.Info(customCtx, "Handling get works request")
	userID, exists := c.Get("userID")
	if !exists {
		logger.Warn(customCtx, "Unauthorized attempt to get works: missing userID")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")

	works, total, err := h.service.GetWorks(customCtx.Context, userID.(uint), page, limit, status)
	if err != nil {
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

func (h *WorkHandler) getWork(c *gin.Context) {
	customCtx := Ctx.New(c.Request.Context())
	logger.Info(customCtx, "Handling get work by ID request")
	userID, exists := c.Get("userID")
	if !exists {
		logger.Warn(customCtx, "Unauthorized attempt to get work: missing userID")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	workID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		logger.Warn(customCtx, "Invalid work ID provided: {}", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid work ID"})
		return
	}

	work, err := h.service.GetWorkByID(customCtx.Context, uint(workID), userID.(uint))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve work"})
		return
	}

	c.JSON(http.StatusOK, work)
}

func (h *WorkHandler) updateWork(c *gin.Context) {
	customCtx := Ctx.New(c.Request.Context())
	logger.Info(customCtx, "Handling update work request")
	userID, exists := c.Get("userID")
	if !exists {
		logger.Warn(customCtx, "Unauthorized attempt to update work: missing userID")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	workID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		logger.Warn(customCtx, "Invalid work ID for update: {}", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid work ID"})
		return
	}

	var input UpdateWorkDTO

	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&input); err != nil {
		logger.Warn(customCtx, "Failed to decode request body for update: {}", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	work, err := h.service.UpdateWork(customCtx.Context, uint(workID), userID.(uint), &input)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update work"})
		return
	}

	c.JSON(http.StatusOK, work)
}

func (h *WorkHandler) deleteWork(c *gin.Context) {
	customCtx := Ctx.New(c.Request.Context())
	logger.Info(customCtx, "Handling delete work request")
	userID, exists := c.Get("userID")
	if !exists {
		logger.Warn(customCtx, "Unauthorized attempt to delete work: missing userID")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	workID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		logger.Warn(customCtx, "Invalid work ID for delete: {}", c.Param("id"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid work ID"})
		return
	}

	err = h.service.DeleteWork(customCtx.Context, uint(workID), userID.(uint))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete work"})
		return
	}

	c.Status(http.StatusNoContent)
}
