package ai

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes registers the AI routes.
func RegisterRoutes(rg *gin.RouterGroup) {
	rg.POST("/completion", handleCompletion)
	rg.POST("/polish", handlePolish)
	rg.POST("/generate/idea", handleGenerateIdea)
}

// handleCompletion handles the text completion request.
func handleCompletion(c *gin.Context) {
	var req CompletionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Integrate with a real AI service SDK or API.
	// The following is a mock response.
	resp := CompletionResponse{
		Completion: "这是一个由AI生成的续写内容。",
	}

	c.JSON(http.StatusOK, resp)
}

// handlePolish handles the text polishing request.
func handlePolish(c *gin.Context) {
	var req PolishRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Integrate with a real AI service SDK or API.
	// The following is a mock response.
	resp := PolishResponse{
		PolishedText: "这是由AI润色后的文本，它变得更加优美和流畅。",
	}

	c.JSON(http.StatusOK, resp)
}

// handleGenerateIdea handles the idea generation request.
func handleGenerateIdea(c *gin.Context) {
	var req GenerateIdeaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Integrate with a real AI service SDK or API.
	// The following is a mock response.
	resp := GenerateIdeaResponse{
		Idea: "这是一个由AI生成的绝妙点子：一个关于时间旅行的侦探故事。",
	}

	c.JSON(http.StatusOK, resp)
}