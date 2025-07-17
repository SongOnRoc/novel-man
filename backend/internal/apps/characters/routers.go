package characters

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"novel-man/backend/internal/db"
)

// RegisterRoutes registers the character routes.
func RegisterRoutes(r *gin.RouterGroup) {
	r.POST("", createCharacter)
	r.GET("", getCharacters)
	r.GET("/:id", getCharacter)
	r.PUT("/:id", updateCharacter)
	r.DELETE("/:id", deleteCharacter)
}

// createCharacter handles the creation of a new character.
func createCharacter(c *gin.Context) {
	var input struct {
		Name            string `json:"name" binding:"required"`
		Alias           string `json:"alias"`
		AvatarURL       string `json:"avatar_url"`
		AppearanceDesc  string `json:"appearance_desc"`
		PersonalityDesc string `json:"personality_desc"`
		AbilityDesc     string `json:"ability_desc"`
		BackgroundStory string `json:"background_story"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("userID").(uint)

	character := Character{
		UserID:          userID,
		Name:            input.Name,
		Alias:           input.Alias,
		AvatarURL:       input.AvatarURL,
		AppearanceDesc:  input.AppearanceDesc,
		PersonalityDesc: input.PersonalityDesc,
		AbilityDesc:     input.AbilityDesc,
		BackgroundStory: input.BackgroundStory,
	}

	if err := db.DB.Create(&character).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create character"})
		return
	}

	c.JSON(http.StatusCreated, character)
}

// getCharacters handles fetching all characters for the current user.
func getCharacters(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var characters []Character
	if err := db.DB.Where("user_id = ?", userID).Find(&characters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch characters"})
		return
	}

	c.JSON(http.StatusOK, characters)
}

// getCharacter handles fetching a single character.
func getCharacter(c *gin.Context) {
	var character Character
	characterID := c.Param("id")
	userID := c.MustGet("userID").(uint)

	if err := db.DB.Where("id = ? AND user_id = ?", characterID, userID).First(&character).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch character"})
		return
	}

	c.JSON(http.StatusOK, character)
}

// updateCharacter handles updating a character.
func updateCharacter(c *gin.Context) {
	characterID := c.Param("id")
	userID := c.MustGet("userID").(uint)

	var character Character
	if err := db.DB.Where("id = ? AND user_id = ?", characterID, userID).First(&character).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found or you don't have permission to update it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	var input struct {
		Name            string `json:"name"`
		Alias           string `json:"alias"`
		AvatarURL       string `json:"avatar_url"`
		AppearanceDesc  string `json:"appearance_desc"`
		PersonalityDesc string `json:"personality_desc"`
		AbilityDesc     string `json:"ability_desc"`
		BackgroundStory string `json:"background_story"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if input.Name != "" {
		updates["name"] = input.Name
	}
	if input.Alias != "" {
		updates["alias"] = input.Alias
	}
	if input.AvatarURL != "" {
		updates["avatar_url"] = input.AvatarURL
	}
	if input.AppearanceDesc != "" {
		updates["appearance_desc"] = input.AppearanceDesc
	}
	if input.PersonalityDesc != "" {
		updates["personality_desc"] = input.PersonalityDesc
	}
	if input.AbilityDesc != "" {
		updates["ability_desc"] = input.AbilityDesc
	}
	if input.BackgroundStory != "" {
		updates["background_story"] = input.BackgroundStory
	}

	if err := db.DB.Model(&character).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update character"})
		return
	}

	c.JSON(http.StatusOK, character)
}

// deleteCharacter handles deleting a character.
func deleteCharacter(c *gin.Context) {
	characterID := c.Param("id")
	userID := c.MustGet("userID").(uint)

	var character Character
	if err := db.DB.Where("id = ? AND user_id = ?", characterID, userID).First(&character).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Character not found or you don't have permission to delete it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if err := db.DB.Delete(&character).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete character"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}
