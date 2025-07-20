package relationships

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/relationships"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

type RelationshipController struct {
	service relationships.RelationshipService
}

func NewRelationshipController(service relationships.RelationshipService) *RelationshipController {
	return &RelationshipController{service: service}
}

type CreateRelationshipRequest struct {
	SourceEntityType string `json:"source_entity_type" binding:"required"`
	SourceEntityID   uint   `json:"source_entity_id" binding:"required"`
	TargetEntityType string `json:"target_entity_type" binding:"required"`
	TargetEntityID   uint   `json:"target_entity_id" binding:"required"`
	RelationshipType string `json:"relationship_type" binding:"required"`
	Description      string `json:"description"`
	WorkID           *uint  `json:"work_id,omitempty"`
}

// CreateRelationship godoc
// @Summary Create a new relationship
// @Description Create a new relationship between entities
// @Tags relationships
// @Accept  json
// @Produce  json
// @Param   relationship  body      CreateRelationshipRequest  true  "Relationship info"
// @Success 201   {object}  map[string]interface{}
// @Failure 400   {object}  map[string]interface{}
// @Failure 500   {object}  map[string]interface{}
// @Router /relationships [post]
func (c *RelationshipController) CreateRelationship(ctx *gin.Context) {
	var req CreateRelationshipRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	relationship := &models.EntityRelationship{
		SourceEntityType: req.SourceEntityType,
		SourceEntityID:   req.SourceEntityID,
		TargetEntityType: req.TargetEntityType,
		TargetEntityID:   req.TargetEntityID,
		RelationshipType: req.RelationshipType,
		Description:      req.Description,
		WorkID:           req.WorkID,
	}

	if err := c.service.Create(*context.New(ctx), relationship); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Relationship created", "data": relationship})
}

// GetRelationship godoc
// @Summary Get a relationship by ID
// @Description Get a relationship by its ID
// @Tags relationships
// @Accept  json
// @Produce  json
// @Param   id  path      int  true  "Relationship ID"
// @Success 200   {object}  map[string]interface{}
// @Failure 400   {object}  map[string]interface{}
// @Failure 404   {object}  map[string]interface{}
// @Failure 500   {object}  map[string]interface{}
// @Router /relationships/{id} [get]
func (c *RelationshipController) GetRelationship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	relationship, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Relationship not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": relationship})
}

type UpdateRelationshipRequest struct {
	SourceEntityType string `json:"source_entity_type"`
	SourceEntityID   uint   `json:"source_entity_id"`
	TargetEntityType string `json:"target_entity_type"`
	TargetEntityID   uint   `json:"target_entity_id"`
	RelationshipType string `json:"relationship_type"`
	Description      string `json:"description"`
	WorkID           *uint  `json:"work_id,omitempty"`
}

// UpdateRelationship godoc
// @Summary Update a relationship
// @Description Update a relationship by its ID
// @Tags relationships
// @Accept  json
// @Produce  json
// @Param   id  path      int  true  "Relationship ID"
// @Param   relationship  body      UpdateRelationshipRequest  true  "Relationship info"
// @Success 200   {object}  map[string]interface{}
// @Failure 400   {object}  map[string]interface{}
// @Failure 404   {object}  map[string]interface{}
// @Failure 500   {object}  map[string]interface{}
// @Router /relationships/{id} [put]
func (c *RelationshipController) UpdateRelationship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateRelationshipRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	relationship, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Relationship not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if req.SourceEntityType != "" {
		relationship.SourceEntityType = req.SourceEntityType
	}
	if req.SourceEntityID != 0 {
		relationship.SourceEntityID = req.SourceEntityID
	}
	if req.TargetEntityType != "" {
		relationship.TargetEntityType = req.TargetEntityType
	}
	if req.TargetEntityID != 0 {
		relationship.TargetEntityID = req.TargetEntityID
	}
	if req.RelationshipType != "" {
		relationship.RelationshipType = req.RelationshipType
	}
	if req.Description != "" {
		relationship.Description = req.Description
	}
	if req.WorkID != nil {
		relationship.WorkID = req.WorkID
	}

	if err := c.service.Update(*context.New(ctx), uint(id), relationship); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": relationship})
}

// DeleteRelationship godoc
// @Summary Delete a relationship
// @Description Delete a relationship by its ID
// @Tags relationships
// @Accept  json
// @Produce  json
// @Param   id  path      int  true  "Relationship ID"
// @Success 204   {object}  map[string]interface{}
// @Failure 400   {object}  map[string]interface{}
// @Failure 404   {object}  map[string]interface{}
// @Failure 500   {object}  map[string]interface{}
// @Router /relationships/{id} [delete]
func (c *RelationshipController) DeleteRelationship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Relationship not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// ListRelationships godoc
// @Summary List relationships
// @Description List relationships with pagination
// @Tags relationships
// @Accept  json
// @Produce  json
// @Param   page  query  int  false  "Page number (default: 1)"
// @Param   limit query  int  false  "Number of items per page (default: 10)"
// @Success 200   {object}  map[string]interface{}
// @Failure 500   {object}  map[string]interface{}
// @Router /relationships [get]
func (c *RelationshipController) ListRelationships(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	relationships, total, err := c.service.List(*context.New(ctx), page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  relationships,
		"total": total,
	})
}