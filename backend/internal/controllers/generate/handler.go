package generate

import (
	"encoding/json"
	"fmt"
	"io"
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
	contentChan, errChan, err := c.generateService.GenerateTextStream(ctx.Request.Context(), req)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, 1, "Failed to start stream", err)
		return
	}

	ctx.Header("Content-Type", "text/event-stream")
	ctx.Header("Cache-Control", "no-cache")
	ctx.Header("Connection", "keep-alive")
	ctx.Header("Transfer-Encoding", "chunked")

	ctx.Stream(func(w io.Writer) bool {
		select {
		case content, ok := <-contentChan:
			if !ok {
				// Stream finished
				c.sendSSE(w, map[string]interface{}{"content": "", "done": true})
				return false
			}
			c.sendSSE(w, map[string]interface{}{"content": content, "done": false})
			return true
		case err := <-errChan:
			if err != nil {
				// Send error event
				c.sendSSE(w, map[string]interface{}{"error": err.Error(), "done": true})
			}
			return false
		case <-ctx.Request.Context().Done():
			return false
		}
	})
}

func (c *GenerateController) sendSSE(w io.Writer, data interface{}) {
	jsonData, _ := json.Marshal(data)
	fmt.Fprintf(w, "data: %s\n\n", jsonData)
}