package characters

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/characters"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CharacterController struct {
	service characters.CharacterService
}

func NewCharacterController(service characters.CharacterService) *CharacterController {
	return &CharacterController{service: service}
}

// DTOs
type CreateCharacterRequest struct {
	Name            string `json:"name" binding:"required"`
	Alias           string `json:"alias"`
	AvatarURL       string `json:"avatar_url"`
	Gender          string `json:"gender"`
	Age             int    `json:"age"`
	Occupation      string `json:"occupation"`
	Appearance      string `json:"appearance"`
	Personality     string `json:"personality"`
	Abilities       string `json:"abilities"`
	BackgroundStory string `json:"background_story"`
	Notes           string `json:"notes"`
}

type UpdateCharacterRequest struct {
	Name            string `json:"name"`
	Alias           string `json:"alias"`
	AvatarURL       string `json:"avatar_url"`
	Gender          string `json:"gender"`
	Age             int    `json:"age"`
	Occupation      string `json:"occupation"`
	Appearance      string `json:"appearance"`
	Personality     string `json:"personality"`
	Abilities       string `json:"abilities"`
	BackgroundStory string `json:"background_story"`
	Notes           string `json:"notes"`
}

type CharacterResponse struct {
	ID              uint      `json:"id"`
	UserID          uint      `json:"user_id"`
	Name            string    `json:"name"`
	Alias           string    `json:"alias"`
	AvatarURL       string    `json:"avatar_url"`
	Gender          string    `json:"gender"`
	Age             int       `json:"age"`
	Occupation      string    `json:"occupation"`
	Appearance      string    `json:"appearance"`
	Personality     string    `json:"personality"`
	Abilities       string    `json:"abilities"`
	BackgroundStory string    `json:"background_story"`
	Notes           string    `json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type ListCharactersResponse struct {
	Data       []CharacterResponse `json:"data"`
	Pagination response.Pagination `json:"pagination"`
}

func toCharacterResponse(character *models.Character) CharacterResponse {
	return CharacterResponse{
		ID:              character.ID,
		UserID:          character.UserID,
		Name:            character.Name,
		Alias:           character.Alias,
		AvatarURL:       character.AvatarURL,
		Gender:          character.Gender,
		Age:             character.Age,
		Occupation:      character.Occupation,
		Appearance:      character.Appearance,
		Personality:     character.Personality,
		Abilities:       character.Abilities,
		BackgroundStory: character.BackgroundStory,
		Notes:           character.Notes,
		CreatedAt:       character.CreatedAt,
		UpdatedAt:       character.UpdatedAt,
	}
}

// CreateCharacter godoc
// @Summary Create a new character
// @Description Create a new character with the given details
// @Tags characters
// @Accept  json
// @Produce  json
// @Param character body CreateCharacterRequest true "Create Character Request"
// @Success 201 {object} response.StandardResponse{data=CharacterResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to create character"
// @Security BearerAuth
// @Router /characters [post]
func (c *CharacterController) CreateCharacter(ctx *gin.Context) {
	var req CreateCharacterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	character := &models.Character{
		UserID:          userID.(uint),
		Name:            req.Name,
		Alias:           req.Alias,
		AvatarURL:       req.AvatarURL,
		Gender:          req.Gender,
		Age:             req.Age,
		Occupation:      req.Occupation,
		Appearance:      req.Appearance,
		Personality:     req.Personality,
		Abilities:       req.Abilities,
		BackgroundStory: req.BackgroundStory,
		Notes:           req.Notes,
	}

	if err := c.service.Create(*context.New(ctx), character); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create character", err)
		return
	}

	response.Success(ctx, http.StatusCreated, toCharacterResponse(character))
}

// GetCharacter godoc
// @Summary Get a single character
// @Description Get a single character by its ID
// @Tags characters
// @Produce  json
// @Param id path int true "Character ID"
// @Success 200 {object} response.StandardResponse{data=CharacterResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Character not found"
// @Failure 500 {object} response.StandardResponse "Failed to get character"
// @Security BearerAuth
// @Router /characters/{id} [get]
func (c *CharacterController) GetCharacter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	character, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Character not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get character", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, toCharacterResponse(character))
}

// UpdateCharacter godoc
// @Summary Update a character
// @Description Update a character with the given details
// @Tags characters
// @Accept  json
// @Produce  json
// @Param id path int true "Character ID"
// @Param character body UpdateCharacterRequest true "Update Character Request"
// @Success 200 {object} response.StandardResponse{data=CharacterResponse}
// @Failure 400 {object} response.StandardResponse "Invalid ID or request body"
// @Failure 404 {object} response.StandardResponse "Character not found"
// @Failure 500 {object} response.StandardResponse "Failed to update character"
// @Security BearerAuth
// @Router /characters/{id} [put]
func (c *CharacterController) UpdateCharacter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	var req UpdateCharacterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	character, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Character not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get character for update", err)
		}
		return
	}

	// Update fields
	character.Name = req.Name
	character.Alias = req.Alias
	character.AvatarURL = req.AvatarURL
	character.Gender = req.Gender
	character.Age = req.Age
	character.Occupation = req.Occupation
	character.Appearance = req.Appearance
	character.Personality = req.Personality
	character.Abilities = req.Abilities
	character.BackgroundStory = req.BackgroundStory
	character.Notes = req.Notes

	if err := c.service.Update(*context.New(ctx), uint(id), character); err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to update character", err)
		return
	}

	response.Success(ctx, http.StatusOK, toCharacterResponse(character))
}

// DeleteCharacter godoc
// @Summary Delete a character
// @Description Delete a character by its ID
// @Tags characters
// @Param id path int true "Character ID"
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 400 {object} response.StandardResponse "Invalid ID"
// @Failure 404 {object} response.StandardResponse "Character not found"
// @Failure 500 {object} response.StandardResponse "Failed to delete character"
// @Security BearerAuth
// @Router /characters/{id} [delete]
func (c *CharacterController) DeleteCharacter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid ID", err)
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Character not found", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to delete character", err)
		}
		return
	}

	response.Success(ctx, http.StatusOK, gin.H{"message": "Character deleted successfully"})
}

// ListCharacters godoc
// @Summary List user's characters
// @Description Get a list of the current user's characters with pagination
// @Tags characters
// @Produce  json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} response.StandardResponse{data=ListCharactersResponse}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 500 {object} response.StandardResponse "Failed to retrieve characters"
// @Security BearerAuth
// @Router /characters [get]
func (c *CharacterController) ListCharacters(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	filters := make(contracts.Filters)
	filters["user_id"] = userID.(uint)

	characters, total, err := c.service.List(*context.New(ctx), page, limit, filters)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to retrieve characters", err)
		return
	}

	characterResponses := make([]CharacterResponse, len(characters))
	for i, character := range characters {
		characterResponses[i] = toCharacterResponse(&character)
	}

	response.Success(ctx, http.StatusOK, ListCharactersResponse{
		Data: characterResponses,
		Pagination: response.Pagination{
			Total: total,
			Page:  page,
			Limit: limit,
		},
	})
}
