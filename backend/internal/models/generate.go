package models

// AssistantTypeResponse is the response for assistant type list.
type AssistantTypeResponse struct {
	Name  string `json:"name"`
	Label string `json:"label"`
}

// ModelResponse is the response for model list.
type ModelResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Label string `json:"label"`
}

// ModelListRequest contains parameters for listing available models.
type ModelListRequest struct {
	APIKey  string `form:"api_key"`
	BaseURL string `form:"base_url"`
}

// Message represents a chat message.
type Message struct {
	Role    string `json:"role"` // "user", "assistant", "system"
	Content string `json:"content"`
}

// GenerateRequest is the unified generation interface request body.
type GenerateRequest struct {
	Text          string     `json:"text"` // Optional if Messages is provided
	Messages      []Message  `json:"messages,omitempty"`
	SystemPrompt  string     `json:"system_prompt,omitempty"`
	AssistantType string     `json:"assistant_type"` // Corresponds to a model name or a system prompt category
	PromptID      *uint      `json:"prompt_id,omitempty"`
	Context       *AIContext `json:"context,omitempty"`
	Stream        bool       `json:"stream,omitempty"`
	// Configuration overrides
	Model   string `json:"model,omitempty"`
	APIKey  string `json:"api_key,omitempty"`
	BaseURL string `json:"base_url,omitempty"`
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

// StreamResult represents a chunk of streamed data or an error.
type StreamResult struct {
	Content string
	Error   error
}
