package generate

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"novel-man/backend/internal/contracts/generate"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	Ctx "novel-man/backend/utils/context"
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

// GetAvailableModels godoc
// @Summary      Get Available Models
// @Description  Retrieves a list of all available models.
// @Tags         Generate
// @Accept       json
// @Produce      json
// @Param        api_key    query     string  false  "API Key"
// @Param        base_url   query     string  false  "Base URL"
// @Success      200  {object}  response.StandardResponse{data=[]models.ModelResponse}
// @Failure      500  {object}  response.StandardResponse
// @Router       /generate/models [get]
func (c *GenerateController) GetAvailableModels(ctx *gin.Context) {
	var req models.ModelListRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		// Ignore binding error, just use empty values
	}

	models, err := c.generateService.GetAvailableModels(ctx.Request.Context(), &req)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, 1, "Could not fetch models", err)
		return
	}
	response.Success(ctx, http.StatusOK, models)
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

	if req.Stream {
		c.handleStream(ctx, &req)
		return
	}

	resp, err := c.generateService.GenerateText(ctx.Request.Context(), &req)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, 1, "Failed to generate text", err)
		return
	}

	response.Success(ctx, http.StatusOK, resp)
}

func (c *GenerateController) handleStream(ctx *gin.Context, req *models.GenerateRequest) {
	resultChan, err := c.generateService.GenerateTextStream(ctx.Request.Context(), req)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, 1, "Failed to start stream", err)
		return
	}

	ctx.Header("Content-Type", "text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")
	ctx.Header("Transfer-Encoding", "chunked")

	w := ctx.Writer
	var fullContent string
	for {
		select {
		case result, ok := <-resultChan:
			if !ok {
				logger.Debug(Ctx.New(ctx), "Stream finished. Full content:\n{}", fullContent)
				c.sendSSE(ctx, w, map[string]interface{}{"content": "", "done": true})
				return
			}

			if result.Error != nil {
				logger.Warn(Ctx.New(ctx), "Stream error: {}", result.Error)
				c.sendSSE(ctx, w, map[string]interface{}{"error": result.Error.Error(), "done": true})
				return
			}

			fullContent += result.Content
			c.sendSSE(ctx, w, map[string]interface{}{"content": result.Content, "done": false})
		case <-ctx.Request.Context().Done():
			logger.Debug(Ctx.New(ctx), "Client disconnected (ctx.Done). Sent content length: {}", len(fullContent))
			return
		}
	}
}

func (c *GenerateController) sendSSE(ctx *gin.Context, w io.Writer, data interface{}) {
	jsonData, _ := json.Marshal(data)
	_, err := fmt.Fprintf(w, "data: %s\n\n", jsonData)
	if err != nil {
		logger.Error(Ctx.New(ctx), "Failed to write SSE data: {}", err)
	}
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
}
