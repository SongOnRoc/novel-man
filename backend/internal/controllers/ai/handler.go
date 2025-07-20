package ai

import (
	"net/http"
	"novel-man/backend/internal/contracts/ai"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"

	"github.com/gin-gonic/gin"
)

// AIController handles AI related HTTP requests.
type AIController struct {
	service ai.AIService
}

// NewAIController creates a new instance of AIController.
func NewAIController(service ai.AIService) *AIController {
	return &AIController{service: service}
}

// Completion handles text completion requests.
// @Summary Text Completion
// @Description Completes text based on the provided prompt and context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.CompletionRequest true "Completion request"
// @Success 200 {object} models.CompletionResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ai/completion [post]
func (c *AIController) Completion(ctx *gin.Context) {
	var req models.CompletionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := c.service.Completion(*context.New(ctx), req.Text, req.Context)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, models.CompletionResponse{Completion: result})
}

// Polish handles text polishing requests.
// @Summary Text Polishing
// @Description Polishes the provided text based on context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.PolishRequest true "Polish request"
// @Success 200 {object} models.PolishResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ai/polish [post]
func (c *AIController) Polish(ctx *gin.Context) {
	var req models.PolishRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := c.service.Polish(*context.New(ctx), req.Text, req.Context)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, models.PolishResponse{PolishedText: result})
}

// GenerateIdea handles idea generation requests.
// @Summary Generate Idea
// @Description Generates an idea based on the provided text and context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.GenerateIdeaRequest true "Generate idea request"
// @Success 200 {object} models.GenerateIdeaResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ai/generate-idea [post]
func (c *AIController) GenerateIdea(ctx *gin.Context) {
	var req models.GenerateIdeaRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := c.service.GenerateIdea(*context.New(ctx), req.Text, req.Context)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, models.GenerateIdeaResponse{Idea: result})
}

// GenerateOutline handles outline generation requests.
// @Summary Generate Outline
// @Description Generates an outline based on the provided text and context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.GenerateOutlineRequest true "Generate outline request"
// @Success 200 {object} models.GenerateOutlineResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ai/generate-outline [post]
func (c *AIController) GenerateOutline(ctx *gin.Context) {
	var req models.GenerateOutlineRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := c.service.GenerateOutline(*context.New(ctx), req.Text, req.Context)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, models.GenerateOutlineResponse{Outline: result})
}

// CreateCharacter handles character creation requests.
// @Summary Create Character
// @Description Creates a character based on the provided description and context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.CreateCharacterRequest true "Create character request"
// @Success 200 {object} models.CreateCharacterResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /ai/create-character [post]
func (c *AIController) CreateCharacter(ctx *gin.Context) {
	var req models.CreateCharacterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := c.service.CreateCharacter(*context.New(ctx), req.Description, req.Context)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}
