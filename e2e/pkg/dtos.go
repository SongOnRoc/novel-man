package pkg

import "time"

// StandardResponse represents the standard API response structure.
type StandardResponse struct {
	Code     int         `json:"code"`
	Message  string      `json:"message"`
	Data     interface{} `json:"data,omitempty"`
	TraceID  string      `json:"traceId,omitempty"`
	SourceID string      `json:"sourceId,omitempty"`
}

// Auth DTOs

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

type RegisterResponse struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}

type LoginResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}
type UserProfileResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
}

// Work DTOs

type CreateWorkRequest struct {
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	CoverImageURL string `json:"cover_image_url,omitempty"`
	Category    string `json:"category,omitempty"`
	Status      string `json:"status,omitempty"`
	Outline     string `json:"outline,omitempty"`
}

type WorkResponse struct {
	ID          uint      `json:"id"`
	UserID      uint      `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CoverImageURL string    `json:"cover_image_url"`
	Category    string    `json:"category"`
	Status      string    `json:"status"`
	Outline     string    `json:"outline"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UpdateWorkRequest struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	CoverImageURL string `json:"cover_image_url,omitempty"`
	Category    string `json:"category,omitempty"`
	Status      string `json:"status,omitempty"`
	Outline     string `json:"outline,omitempty"`
}

// Chapter DTOs

type CreateChapterRequest struct {
	WorkID      uint   `json:"work_id"`
	VolumeID    uint   `json:"volume_id,omitempty"`
	Title       string `json:"title"`
	Content     string `json:"content,omitempty"`
	Status      string `json:"status,omitempty"`
	DisplayOrder int    `json:"display_order,omitempty"`
}

type ChapterResponse struct {
	ID           uint       `json:"id"`
	WorkID       uint       `json:"work_id"`
	VolumeID     uint       `json:"volume_id"`
	Title        string     `json:"title"`
	Content      string     `json:"content"`
	WordCount    int        `json:"word_count"`
	Status       string     `json:"status"`
	DisplayOrder int        `json:"display_order"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	PublishedAt  *time.Time `json:"published_at"`
}

type UpdateChapterRequest struct {
	Title       string `json:"title,omitempty"`
	Content     string `json:"content,omitempty"`
	Status      string `json:"status,omitempty"`
	DisplayOrder int    `json:"display_order,omitempty"`
	VolumeID    uint   `json:"volume_id,omitempty"`
}

// Pagination DTO
type Pagination struct {
	Page  int   `json:"page"`
	Limit int   `json:"limit"`
	Total int64 `json:"total"`
}

// List Responses
type ListWorksResponse struct {
	Data       []WorkResponse `json:"data"`
	Pagination Pagination     `json:"pagination"`
}

type ListChaptersResponse struct {
	Data       []ChapterResponse `json:"data"`
	Pagination Pagination        `json:"pagination"`
}
// Character DTOs
type CreateCharacterRequest struct {
	Name           string `json:"name"`
	Alias          string `json:"alias,omitempty"`
	Gender         string `json:"gender,omitempty"`
	Age            int    `json:"age,omitempty"`
	Appearance     string `json:"appearance,omitempty"`
	Personality    string `json:"personality,omitempty"`
	BackgroundStory string `json:"background_story,omitempty"`
	Abilities      string `json:"abilities,omitempty"`
	Occupation     string `json:"occupation,omitempty"`
	AvatarURL      string `json:"avatar_url,omitempty"`
	Notes          string `json:"notes,omitempty"`
}

type CharacterResponse struct {
	ID             uint      `json:"id"`
	UserID         uint      `json:"user_id"`
	Name           string    `json:"name"`
	Alias          string    `json:"alias"`
	Gender         string    `json:"gender"`
	Age            int       `json:"age"`
	Appearance     string    `json:"appearance"`
	Personality    string    `json:"personality"`
	BackgroundStory string    `json:"background_story"`
	Abilities      string    `json:"abilities"`
	Occupation     string    `json:"occupation"`
	AvatarURL      string    `json:"avatar_url"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type UpdateCharacterRequest struct {
	Name           string `json:"name,omitempty"`
	Alias          string `json:"alias,omitempty"`
	Gender         string `json:"gender,omitempty"`
	Age            int    `json:"age,omitempty"`
	Appearance     string `json:"appearance,omitempty"`
	Personality    string `json:"personality,omitempty"`
	BackgroundStory string `json:"background_story,omitempty"`
	Abilities      string `json:"abilities,omitempty"`
	Occupation     string `json:"occupation,omitempty"`
	AvatarURL      string `json:"avatar_url,omitempty"`
	Notes          string `json:"notes,omitempty"`
}

// Draft DTOs
type CreateDraftRequest struct {
	WorkID      uint   `json:"work_id,omitempty"`
	Title       string `json:"title"`
	Content     string `json:"content,omitempty"`
	Description string `json:"description,omitempty"`
	Status      string `json:"status,omitempty"`
}

type DraftResponse struct {
	ID          uint      `json:"id"`
	UserID      uint      `json:"user_id"`
	WorkID      uint      `json:"work_id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Description string    `json:"description"`
	WordCount   int       `json:"word_count"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UpdateDraftRequest struct {
	Title       string `json:"title,omitempty"`
	Content     string `json:"content,omitempty"`
	Description string `json:"description,omitempty"`
	Status      string `json:"status,omitempty"`
}

// Relationship DTOs
type RelationshipRequest struct {
	WorkID           uint   `json:"work_id,omitempty"`
	SourceEntityType string `json:"source_entity_type"`
	SourceEntityID   uint   `json:"source_entity_id"`
	TargetEntityType string `json:"target_entity_type"`
	TargetEntityID   uint   `json:"target_entity_id"`
	RelationshipType string `json:"relationship_type"`
	Description      string `json:"description,omitempty"`
}

type RelationshipResponse struct {
	ID               uint      `json:"id"`
	WorkID           uint      `json:"work_id"`
	SourceEntityType string    `json:"source_entity_type"`
	SourceEntityID   uint      `json:"source_entity_id"`
	TargetEntityType string    `json:"target_entity_type"`
	TargetEntityID   uint      `json:"target_entity_id"`
	RelationshipType string    `json:"relationship_type"`
	Description      string    `json:"description"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// Setting DTOs
type SettingRequest struct {
	EditorTheme      string  `json:"editor_theme,omitempty"`
	FontSize         int     `json:"font_size,omitempty"`
	LineHeight       float32 `json:"line_height,omitempty"`
	AIModel          string  `json:"ai_model,omitempty"`
	CustomAPIEndpoint string  `json:"custom_api_endpoint,omitempty"`
}

type SettingResponse struct {
	ID               uint      `json:"id"`
	UserID           uint      `json:"user_id"`
	EditorTheme      string    `json:"editor_theme"`
	FontSize         int       `json:"font_size"`
	LineHeight       float32   `json:"line_height"`
	AIModel          string    `json:"ai_model"`
	CustomAPIEndpoint string    `json:"custom_api_endpoint"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// Worldview DTOs
type CreateCategoryRequest struct {
	Name string `json:"name"`
}

type CategoryResponse struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name"`
}

type CreateItemRequest struct {
	CategoryID    uint   `json:"category_id"`
	Name          string `json:"name"`
	Description   string `json:"description,omitempty"`
	CoverImageURL string `json:"cover_image_url,omitempty"`
}

type ItemResponse struct {
	ID            uint      `json:"id"`
	UserID        uint      `json:"user_id"`
	CategoryID    uint      `json:"category_id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	CoverImageURL string    `json:"cover_image_url"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type UpdateItemRequest struct {
	CategoryID    uint   `json:"category_id,omitempty"`
	Name          string `json:"name,omitempty"`
	Description   string `json:"description,omitempty"`
	CoverImageURL string `json:"cover_image_url,omitempty"`
}
// AI DTOs
type AIContext struct {
	WorkID             uint   `json:"work_id,omitempty"`
	ChapterID          uint   `json:"chapter_id,omitempty"`
	CharacterIDs       []uint `json:"character_ids,omitempty"`
	WorldviewSettingIDs []uint `json:"worldview_setting_ids,omitempty"`
	StylePreference    string `json:"style_preference,omitempty"`
}

type CompletionRequest struct {
	Text    string    `json:"text"`
	Context AIContext `json:"context,omitempty"`
}

type CompletionResponse struct {
	Completion string `json:"completion"`
}

type CreateCharacterAIRequest struct {
	Description string    `json:"description"`
	Context     AIContext `json:"context,omitempty"`
}

type CreateCharacterAIResponse struct {
	Name            string `json:"name"`
	PersonalityDesc string `json:"personality_desc"`
	BackgroundStory string `json:"background_story"`
}

type GenerateIdeaRequest struct {
	Text    string    `json:"text"`
	Context AIContext `json:"context,omitempty"`
}

type GenerateIdeaResponse struct {
	Idea string `json:"idea"`
}

type GenerateOutlineRequest struct {
	Text    string    `json:"text"`
	Context AIContext `json:"context,omitempty"`
}

type GenerateOutlineResponse struct {
	Outline string `json:"outline"`
}

type PolishRequest struct {
	Text    string    `json:"text"`
	Context AIContext `json:"context,omitempty"`
}

type PolishResponse struct {
	PolishedText string `json:"polished_text"`
}