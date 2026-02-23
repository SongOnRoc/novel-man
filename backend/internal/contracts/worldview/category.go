package worldview

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// WorldviewCategoryService 定义了世界观分类的业务逻辑接口
type WorldviewCategoryService interface {
	contracts.GenericCRUD[models.WorldviewCategory, uint]
	// GetCategoriesByUserID 根据用户ID获取分类列表
	GetCategoriesByUserID(ctx context.Context, userID uint) ([]models.WorldviewCategory, error)
	HandleWorldviewCategoryTask(ctx context.Context, task events.QueueTask) error
	// 可以在这里添加分类特有的业务方法
}

// WorldviewCategoryRepository 定义了世界观分类的数据访问接口
type WorldviewCategoryRepository interface {
	contracts.GenericRepository[models.WorldviewCategory, uint]
	// GetCategoriesByUserID 根据用户ID获取分类列表
	GetCategoriesByUserID(ctx context.Context, userID uint) ([]models.WorldviewCategory, error)
	// 可以在这里添加分类特有的数据访问方法
}
