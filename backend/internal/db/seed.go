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
		{
			Base:        models.Base{ID: 20},
			UserID:      0,
			Title:       "综合提取",
			Content:     "你是一位小说分析专家。请从用户提供的章节内容中，同时提取：1）角色（人物名称、身份、性格特点）；2）世界观元素（地点、规则、制度、重要设定）；3）章节纲要/剧情要点（主要事件和发展脉络）。请严格按以下格式输出：\nSUMMARY: 一句话总结\nCANDIDATES:\n[@角色|角色名|识别结果描述]\n[@世界观|词条名|识别结果描述]\n[@纲要|要点名|识别结果描述]\n若内容不足，也要给出尽量合理的简要结果。",
			Description: "",
			PrimaryTag:  "extract",
			Categories:  datatypes.JSON([]byte(`["智能提取", "角色", "世界观", "纲要"]`)),
			FooterTags:  datatypes.JSON([]byte(`["智能提取", "角色分析", "世界观", "剧情纲要"]`)),
			Status:      "active",
			IsSystem:    true,
		},
		{
			Base:        models.Base{ID: 21},
			UserID:      0,
			Title:       "角色提取",
			Content:     "你是一位小说分析专家。请从用户提供的章节内容中提取出现的角色信息，包括：角色名称、身份定位、性格特点、在本章中的表现。请严格按以下格式输出：\nSUMMARY: 一句话总结\nCANDIDATES:\n[@角色|角色名|识别结果描述]\n若内容不足，也要给出尽量合理的简要结果。",
			Description: "",
			PrimaryTag:  "extract",
			Categories:  datatypes.JSON([]byte(`["智能提取", "角色"]`)),
			FooterTags:  datatypes.JSON([]byte(`["智能提取", "角色分析"]`)),
			Status:      "active",
			IsSystem:    true,
		},
		{
			Base:        models.Base{ID: 22},
			UserID:      0,
			Title:       "世界观提取",
			Content:     "你是一位小说世界观专家。请从用户提供的章节内容中提取世界观元素，包括：重要地点、规则制度、设定物品、势力划分等。请严格按以下格式输出：\nSUMMARY: 一句话总结\nCANDIDATES:\n[@世界观|词条名|识别结果描述]\n若内容不足，也要给出尽量合理的简要结果。",
			Description: "",
			PrimaryTag:  "extract",
			Categories:  datatypes.JSON([]byte(`["智能提取", "世界观"]`)),
			FooterTags:  datatypes.JSON([]byte(`["智能提取", "世界观", "设定"]`)),
			Status:      "active",
			IsSystem:    true,
		},
		{
			Base:        models.Base{ID: 23},
			UserID:      0,
			Title:       "纲要提取",
			Content:     "你是一位小说结构分析专家。请从用户提供的章节内容中提取章节纲要和剧情要点，包括：主要事件、发展脉络、关键转折等。请严格按以下格式输出：\nSUMMARY: 一句话总结\nCANDIDATES:\n[@纲要|要点名|识别结果描述]\n若内容不足，也要给出尽量合理的简要结果。",
			Description: "",
			PrimaryTag:  "extract",
			Categories:  datatypes.JSON([]byte(`["智能提取", "纲要", "剧情"]`)),
			FooterTags:  datatypes.JSON([]byte(`["智能提取", "剧情纲要", "章节结构"]`)),
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

	// 设置 AUTO_INCREMENT 从 1000 开始，确保自动分配的用户提示词ID >= 1000
	// 仅 MySQL 支持该语法，SQLite/Postgres 跳过以避免无效语法噪音。
	if db.Dialector.Name() == "mysql" {
		if err := db.Exec("ALTER TABLE prompts AUTO_INCREMENT = 1000").Error; err != nil {
			logger.Debug(ctx, "Failed to set AUTO_INCREMENT for prompts table: {}", err)
		}
	}

	logger.Info(ctx, "System prompts seeding completed.")
	return nil
}
