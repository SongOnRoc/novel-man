package worldview

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// WorldviewItemService 定义了世界观条目的业务逻辑接口
type WorldviewItemService interface {
	contracts.GenericCRUD[models.WorldviewItem, uint]
	// GetItemsByCategoryID 根据分类ID获取条目列表
	GetItemsByCategoryID(ctx context.Context, categoryID uint) ([]models.WorldviewItem, error)
	// 可以在这里添加条目特有的业务方法
}

// WorldviewItemRepository 定义了世界观条目的数据访问接口
type WorldviewItemRepository interface {
	contracts.GenericRepository[models.WorldviewItem, uint]
	// GetItemsByCategoryID 根据分类ID获取条目列表
	GetItemsByCategoryID(ctx context.Context, categoryID uint) ([]models.WorldviewItem, error)
	// 可以在这里添加条目特有的数据访问方法
}