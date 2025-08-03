package relationships

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/relationships"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"
)

type RelationshipController struct {
	service relationships.RelationshipService
}

func NewRelationshipController(service relationships.RelationshipService) *RelationshipController {
	return &RelationshipController{service: service}
}

// DTOs
type RelationshipRequest struct {
	SourceEntityType string `json:"source_entity_type" binding:"required"`
	SourceEntityID   uint   `json:"source_entity_id" binding:"required"`
	TargetEntityType string `json:"target_entity_type" binding:"required"`
	TargetEntityID   uint   `json:"target_entity_id" binding:"required"`
	RelationshipType string `json:"relationship_type" binding:"required"`
	Description      string `json:"description"`
	WorkID           *int64 `json:"work_id,omitempty"`
}

type RelationshipResponse struct {
	ID               uint      `json:"id"`
	SourceEntityType string    `json:"source_entity_type"`
	SourceEntityID   uint      `json:"source_entity_id"`
	TargetEntityType string    `json:"target_entity_type"`
	TargetEntityID   uint      `json:"target_entity_id"`
	RelationshipType string    `json:"relationship_type"`
	Description      string    `json:"description"`
	WorkID           *int64    `json:"work_id,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type ListRelationshipsResponse struct {
	Data       []RelationshipResponse `json:"data"`
	Pagination response.Pagination    `json:"pagination"`
}

func toRelationshipResponse(relationship *models.EntityRelationship) RelationshipResponse {
	return RelationshipResponse{
		ID:               relationship.ID,
		SourceEntityType: relationship.SourceEntityType,
		SourceEntityID:   relationship.SourceEntityID,
		TargetEntityType: relationship.TargetEntityType,
		TargetEntityID:   relationship.TargetEntityID,
		RelationshipType: relationship.RelationshipType,
		Description:      relationship.Description,
		WorkID:           relationship.WorkID,
		CreatedAt:        relationship.CreatedAt,
		UpdatedAt:        relationship.UpdatedAt,
	}
}

// CreateRelationship godoc
// @Summary Create a new relationship
// @Description Create a new relationship between entities
// @Tags relationships
// @Accept  json
// @Produce  json
// @Param   relationship  body      RelationshipRequest  true  "Relationship info"
// @Success 201   {object}  response.StandardResponse{data=RelationshipResponse}
// @Failure 400   {object}  response.StandardResponse "Invalid request body"
// @Failure 500   {object}  response.StandardResponse "Failed to create relationship"
// @Security BearerAuth
// @Router /relationships [post]
func (c *RelationshipController) CreateRelationship(ctx *gin.Context) {
	var req RelationshipRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
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
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create relationship", err)
		return
	}

	response.Success(ctx, http.StatusCreated, toRelationshipResponse(relationship))
}

// GetRelationship godoc
// @Summary Get a relationship by ID
// @Description Get a relationship by its ID
// @Tags relationships
// @Produce  json
// @Param   id  path      int  true  "Relationship ID"
// @Success 200   {object}  response.StandardResponse{data=RelationshipResponse}
// @Failure 400   {object}  response.StandardResponse "Invalid ID"
// @Failure 404   {object}  response.StandardResponse "Relationship not found"
// @Failure 500   {object}  response.StandardResponse "Failed to get relationship"
// @Security BearerAuth
// @Router /relationships/{id} [get]
func (c *RelationshipController) GetRelationship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	relationship, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Relationship not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get relationship", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, toRelationshipResponse(relationship))
}

// UpdateRelationship godoc
// @Summary Update a relationship
// @Description Update a relationship by its ID
// @Tags relationships
// @Accept  json
// @Produce  json
// @Param   id  path      int  true  "Relationship ID"
// @Param   relationship  body      RelationshipRequest  true  "Relationship info"
// @Success 200   {object}  response.StandardResponse{data=RelationshipResponse}
// @Failure 400   {object}  response.StandardResponse "Invalid ID or request body"
// @Failure 404   {object}  response.StandardResponse "Relationship not found"
// @Failure 500   {object}  response.StandardResponse "Failed to update relationship"
// @Security BearerAuth
// @Router /relationships/{id} [put]
func (c *RelationshipController) UpdateRelationship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req RelationshipRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	relationship, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Relationship not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get relationship for update", err)
		}
		return
	}

	relationship.SourceEntityType = req.SourceEntityType
	relationship.SourceEntityID = req.SourceEntityID
	relationship.TargetEntityType = req.TargetEntityType
	relationship.TargetEntityID = req.TargetEntityID
	relationship.RelationshipType = req.RelationshipType
	relationship.Description = req.Description
	relationship.WorkID = req.WorkID

	if err := c.service.Update(*context.New(ctx), uint(id), relationship); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update relationship", err)
		return
	}

	response.Success(ctx, http.StatusOK, toRelationshipResponse(relationship))
}

// DeleteRelationship godoc
// @Summary Delete a relationship
// @Description Delete a relationship by its ID
// @Tags relationships
// @Param   id  path      int  true  "Relationship ID"
// @Success 200   {object}  response.StandardResponse{data=object{message=string}}
// @Failure 400   {object}  response.StandardResponse "Invalid ID"
// @Failure 404   {object}  response.StandardResponse "Relationship not found"
// @Failure 500   {object}  response.StandardResponse "Failed to delete relationship"
// @Security BearerAuth
// @Router /relationships/{id} [delete]
func (c *RelationshipController) DeleteRelationship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Relationship not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete relationship", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"message": "Relationship deleted successfully"})
}

// ListRelationships godoc
// @Summary List relationships
// @Description List relationships with pagination and filters
// @Tags relationships
// @Produce  json
// @Param   page  query  int  false  "Page number (default: 1)"
// @Param   limit query  int  false  "Number of items per page (default: 10)"
// @Param   sourceEntityId query int false "Filter by Source Entity ID"
// @Param   sourceEntityType query string false "Filter by Source Entity Type"
// @Success 200   {object}  response.StandardResponse{data=ListRelationshipsResponse}
// @Failure 400   {object}  response.StandardResponse "Invalid filter parameters"
// @Failure 500   {object}  response.StandardResponse "Failed to retrieve relationships"
// @Security BearerAuth
// @Router /relationships [get]
func (c *RelationshipController) ListRelationships(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	sourceEntityIDStr := ctx.Query("sourceEntityId")
	sourceEntityType := ctx.Query("sourceEntityType")

	filters := make(contracts.Filters)
	if sourceEntityIDStr != "" {
		sourceEntityID, err := strconv.ParseUint(sourceEntityIDStr, 10, 32)
		if err != nil {
			response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid sourceEntityId", err)
			return
		}
		filters["source_entity_id"] = uint(sourceEntityID)
	}
	if sourceEntityType != "" {
		filters["source_entity_type"] = sourceEntityType
	}

	relationships, total, err := c.service.List(*context.New(ctx), page, limit, filters)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to retrieve relationships", err)
		return
	}

	relationshipResponses := make([]RelationshipResponse, len(relationships))
	for i, relationship := range relationships {
		relationshipResponses[i] = toRelationshipResponse(&relationship)
	}

	response.Success(ctx, http.StatusOK, ListRelationshipsResponse{
		Data: relationshipResponses,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}
