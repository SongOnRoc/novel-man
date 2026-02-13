package db

import (
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	Ctx "novel-man/backend/utils/context"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// SeedSystemPrompts 创建内置系统提示词
// 系统提示词 ID 范围: 10~100
func SeedSystemPrompts(ctx *Ctx.Context, db *gorm.DB) error {
	logger.Info(ctx, "Seeding system prompts...")

	systemPrompts := []models.Prompt{
		{
			Base:        models.Base{ID: 10},
			UserID:      0, // 系统用户
			Title:       "润色",
			Content:     "你是一位专业的文字润色专家。请帮助用户优化和润色他们的文字，使其更加流畅、优雅、富有表现力。保持原文的核心含义，但改进语法、词汇选择和句子结构。",
			Description: "",
			PrimaryTag:  "polish",
			Categories:  datatypes.JSON([]byte(`["写作辅助", "润色"]`)),
			FooterTags:  datatypes.JSON([]byte(`["润色", "优化", "文字"]`)),
			Status:      "active",
			IsSystem:    true,
		},
		{
			Base:        models.Base{ID: 11},
			UserID:      0,
			Title:       "续写",
			Content:     "你是一位创意写作助手。请根据用户提供的文字内容，以相同的风格、语调和情节方向继续续写。保持故事的连贯性和人物性格的一致性。",
			Description: "",
			PrimaryTag:  "continue",
			Categories:  datatypes.JSON([]byte(`["写作辅助", "续写"]`)),
			FooterTags:  datatypes.JSON([]byte(`["续写", "创作", "故事"]`)),
			Status:      "active",
			IsSystem:    true,
		},
		{
			Base:        models.Base{ID: 12},
			UserID:      0,
			Title:       "分析",
			Content:     "你是一位文学分析专家。请从叙事结构、人物塑造、主题思想、写作手法等多个维度分析用户提供的文本内容，给出专业、深入的分析和建议。",
			Description: "",
			PrimaryTag:  "analyze",
			Categories:  datatypes.JSON([]byte(`["写作辅助", "分析"]`)),
			FooterTags:  datatypes.JSON([]byte(`["分析", "评价", "建议"]`)),
			Status:      "active",
			IsSystem:    true,
		},
		{
			Base:        models.Base{ID: 13},
			UserID:      0,
			Title:       "扩写",
			Content:     "你是一位内容扩展专家。请根据用户提供的简短文字，通过添加细节描写、环境描述、人物心理活动、对话等方式，将内容扩展得更加丰富和生动。",
			Description: "",
			PrimaryTag:  "expand",
			Categories:  datatypes.JSON([]byte(`["写作辅助", "扩写"]`)),
			FooterTags:  datatypes.JSON([]byte(`["扩写", "扩展", "丰富"]`)),
			Status:      "active",
			IsSystem:    true,
		},
	}

	for _, prompt := range systemPrompts {
		// 使用 FirstOrCreate 避免重复创建
		result := db.Where("id = ?", prompt.ID).FirstOrCreate(&prompt)
		if result.Error != nil {
			logger.Error(ctx, "Failed to seed system prompt {}: {}", prompt.Title, result.Error)
			return result.Error
		}
		if result.RowsAffected > 0 {
			logger.Info(ctx, "Created system prompt: {} (ID: {})", prompt.Title, prompt.ID)
		}
	}

	//设置 AUTO_INCREMENT 从 1000 开始，确保自动分配的用户提示词ID >= 1000
	if err := db.Exec("ALTER TABLE prompts AUTO_INCREMENT = 1000").Error; err != nil {
		logger.Debug(ctx, "Failed to set AUTO_INCREMENT for prompts table: {}", err)
		// 不返回错误，SQLite 等数据库不支持此语法
	}

	logger.Info(ctx, "System prompts seeding completed.")
	return nil
}
