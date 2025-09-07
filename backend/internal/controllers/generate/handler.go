package generate

import (
	"net/http"
	"novel-man/backend/internal/contracts/generate"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
)

// GenerateController handles HTTP requests for the generate module.
type GenerateController struct {
	generateService generate.GenerateService
}

// NewGenerateController creates a new instance of GenerateController.
func NewGenerateController(generateService generate.GenerateService) *GenerateController {
	return &GenerateController{
		generateService: generateService,
	}
}

// GetAssistantTypes godoc
// @Summary      Get Assistant Types
// @Description  Retrieves a list of all available assistant types.
// @Tags         Generate
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.StandardResponse{data=[]models.AssistantTypeResponse}
// @Failure      500  {object}  response.StandardResponse
// @Router       /generate [get]
func (c *GenerateController) GetAssistantTypes(ctx *gin.Context) {
	types, err := c.generateService.GetAssistantTypes()
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, 1, "Could not fetch assistant types", err)
		return
	}
	response.Success(ctx, http.StatusOK, types)
}

// GenerateText godoc
// @Summary      Generate Text
// @Description  Generates text based on a given prompt, assistant type, or text.
// @Tags         Generate
// @Accept       json
// @Produce      json
// @Param        request body models.GenerateRequest true "Generation Request"
// @Success      200  {object}  response.StandardResponse{data=models.GenerateResponse}
// @Failure      400  {object}  response.StandardResponse
// @Failure      500  {object}  response.StandardResponse
// @Router       /generate [post]
func (c *GenerateController) GenerateText(ctx *gin.Context) {
	var req models.GenerateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, 1, "Invalid request body", err)
		return
	}

	resp, err := c.generateService.GenerateText(&req)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, 1, "Failed to generate text", err)
		return
	}

	response.Success(ctx, http.StatusOK, resp)
}