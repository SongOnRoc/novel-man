package ai

import (
	"net/http"
	"novel-man/backend/internal/contracts/ai"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

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
// @Success 200 {object} response.StandardResponse{data=models.CompletionResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 500 {object} response.StandardResponse "Failed to get completion"
// @Security BearerAuth
// @Router /ai/completion [post]
func (c *AIController) Completion(ctx *gin.Context) {
	var req models.CompletionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	result, err := c.service.Completion(*context.New(ctx), req.Text, req.Context)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to get completion", err)
		return
	}

	response.Success(ctx, http.StatusOK, models.CompletionResponse{Completion: result})
}

// Polish handles text polishing requests.
// @Summary Text Polishing
// @Description Polishes the provided text based on context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.PolishRequest true "Polish request"
// @Success 200 {object} response.StandardResponse{data=models.PolishResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 500 {object} response.StandardResponse "Failed to polish text"
// @Security BearerAuth
// @Router /ai/polish [post]
func (c *AIController) Polish(ctx *gin.Context) {
	var req models.PolishRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	result, err := c.service.Polish(*context.New(ctx), req.Text, req.Context)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to polish text", err)
		return
	}

	response.Success(ctx, http.StatusOK, models.PolishResponse{PolishedText: result})
}

// GenerateIdea handles idea generation requests.
// @Summary Generate Idea
// @Description Generates an idea based on the provided text and context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.GenerateIdeaRequest true "Generate idea request"
// @Success 200 {object} response.StandardResponse{data=models.GenerateIdeaResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 500 {object} response.StandardResponse "Failed to generate idea"
// @Security BearerAuth
// @Router /ai/generate-idea [post]
func (c *AIController) GenerateIdea(ctx *gin.Context) {
	var req models.GenerateIdeaRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	result, err := c.service.GenerateIdea(*context.New(ctx), req.Text, req.Context)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to generate idea", err)
		return
	}

	response.Success(ctx, http.StatusOK, models.GenerateIdeaResponse{Idea: result})
}

// GenerateOutline handles outline generation requests.
// @Summary Generate Outline
// @Description Generates an outline based on the provided text and context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.GenerateOutlineRequest true "Generate outline request"
// @Success 200 {object} response.StandardResponse{data=models.GenerateOutlineResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 500 {object} response.StandardResponse "Failed to generate outline"
// @Security BearerAuth
// @Router /ai/generate-outline [post]
func (c *AIController) GenerateOutline(ctx *gin.Context) {
	var req models.GenerateOutlineRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	result, err := c.service.GenerateOutline(*context.New(ctx), req.Text, req.Context)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to generate outline", err)
		return
	}

	response.Success(ctx, http.StatusOK, models.GenerateOutlineResponse{Outline: result})
}

// CreateCharacter handles character creation requests.
// @Summary Create Character
// @Description Creates a character based on the provided description and context.
// @Tags AI
// @Accept json
// @Produce json
// @Param request body models.CreateCharacterRequest true "Create character request"
// @Success 200 {object} response.StandardResponse{data=models.CreateCharacterResponse}
// @Failure 400 {object} response.StandardResponse "Invalid request body"
// @Failure 500 {object} response.StandardResponse "Failed to create character"
// @Security BearerAuth
// @Router /ai/create-character [post]
func (c *AIController) CreateCharacter(ctx *gin.Context) {
	var req models.CreateCharacterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	result, err := c.service.CreateCharacter(*context.New(ctx), req.Description, req.Context)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create character", err)
		return
	}

	response.Success(ctx, http.StatusOK, result)
}
