package characters

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/characters"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

type CharacterController struct {
	service characters.CharacterService
}

func NewCharacterController(service characters.CharacterService) *CharacterController {
	return &CharacterController{service: service}
}

type CreateCharacterRequest struct {
	UserID          uint   `json:"user_id" binding:"required"`
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

// CreateCharacter godoc
// @Summary Create a new character
// @Description Create a new character with the given details
// @Tags characters
// @Accept  json
// @Produce  json
// @Param character body CreateCharacterRequest true "Create Character Request"
// @Success 201 {object} models.Character
// @Failure 400 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /characters [post]
func (c *CharacterController) CreateCharacter(ctx *gin.Context) {
	var req CreateCharacterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	character := &models.Character{
		UserID:          req.UserID,
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
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, character)
}

// GetCharacter godoc
// @Summary Get a single character
// @Description Get a single character by its ID
// @Tags characters
// @Produce  json
// @Param id path int true "Character ID"
// @Success 200 {object} models.Character
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /characters/{id} [get]
func (c *CharacterController) GetCharacter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	character, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, character)
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

// UpdateCharacter godoc
// @Summary Update a character
// @Description Update a character with the given details
// @Tags characters
// @Accept  json
// @Produce  json
// @Param id path int true "Character ID"
// @Param character body UpdateCharacterRequest true "Update Character Request"
// @Success 200 {object} models.Character
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /characters/{id} [put]
func (c *CharacterController) UpdateCharacter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateCharacterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	character, err := c.service.GetByID(*context.New(ctx), uint(id))
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新可更新的字段
	if req.Name != "" {
		character.Name = req.Name
	}
	if req.Alias != "" {
		character.Alias = req.Alias
	}
	if req.AvatarURL != "" {
		character.AvatarURL = req.AvatarURL
	}
	if req.Gender != "" {
		character.Gender = req.Gender
	}
	character.Age = req.Age
	if req.Occupation != "" {
		character.Occupation = req.Occupation
	}
	if req.Appearance != "" {
		character.Appearance = req.Appearance
	}
	if req.Personality != "" {
		character.Personality = req.Personality
	}
	if req.Abilities != "" {
		character.Abilities = req.Abilities
	}
	if req.BackgroundStory != "" {
		character.BackgroundStory = req.BackgroundStory
	}
	if req.Notes != "" {
		character.Notes = req.Notes
	}

	if err := c.service.Update(*context.New(ctx), uint(id), character); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, character)
}

// DeleteCharacter godoc
// @Summary Delete a character
// @Description Delete a character by its ID
// @Tags characters
// @Param id path int true "Character ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /characters/{id} [delete]
func (c *CharacterController) DeleteCharacter(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := c.service.Delete(*context.New(ctx), uint(id)); err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// ListCharacters godoc
// @Summary List all characters
// @Description Get a list of all characters with pagination
// @Tags characters
// @Produce  json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Number of items per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /characters [get]
func (c *CharacterController) ListCharacters(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))

	characters, total, err := c.service.List(*context.New(ctx), page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  characters,
		"total": total,
	})
}