package ai

// Context a struct for ai
type Context struct {
	WorkID              *uint   `json:"work_id,omitempty"`
	ChapterID           *uint   `json:"chapter_id,omitempty"`
	CharacterIDs        []uint  `json:"character_ids,omitempty"`
	WorldviewSettingIDs []uint  `json:"worldview_setting_ids,omitempty"`
	StylePreference     *string `json:"style_preference,omitempty"`
}

// CompletionRequest is the request for text completion.
type CompletionRequest struct {
	Text    string   `json:"text" binding:"required"`
	Context *Context `json:"context,omitempty"`
}

// CompletionResponse is the response for text completion.
type CompletionResponse struct {
	Completion string `json:"completion"`
}

// PolishRequest is the request for text polishing.
type PolishRequest struct {
	Text    string   `json:"text" binding:"required"`
	Context *Context `json:"context,omitempty"`
}

// PolishResponse is the response for text polishing.
type PolishResponse struct {
	PolishedText string `json:"polished_text"`
}

// GenerateIdeaRequest is the request for generating ideas.
type GenerateIdeaRequest struct {
	Text    string   `json:"text" binding:"required"`
	Context *Context `json:"context,omitempty"`
}

// GenerateIdeaResponse is the response for generating ideas.
type GenerateIdeaResponse struct {
	Idea string `json:"idea"`
}