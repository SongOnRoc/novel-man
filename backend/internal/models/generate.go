package models

// AssistantTypeResponse is the response for assistant type list.
type AssistantTypeResponse struct {
	Name  string `json:"name"`
	Label string `json:"label"`
}

// GenerateRequest is the unified generation interface request body.
type GenerateRequest struct {
	Text          string     `json:"text" binding:"required"`
	AssistantType string     `json:"assistant_type"` // Corresponds to a model name or a system prompt category
	PromptID      *uint      `json:"prompt_id,omitempty"`
	Context       *AIContext `json:"context,omitempty"`
}

// AIContext contains additional context for the AI generation.
type AIContext struct {
	WorkID          uint   `json:"work_id"`
	StylePreference string `json:"style_preference"`
}

// GenerateResponse is the unified generation interface response body.
type GenerateResponse struct {
	GeneratedText string `json:"generated_text"`
}