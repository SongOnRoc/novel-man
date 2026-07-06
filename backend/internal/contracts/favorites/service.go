package favorites

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// FavoriteOperations 定义收藏特有的业务操作
type FavoriteOperations interface {
	// AddFavorite 添加收藏（根据用户、资源类型和资源ID）
	AddFavorite(ctx context.Context, userID uint, resourceType models.ResourceType, resourceID uint) error

	// RemoveFavorite 移除收藏
	RemoveFavorite(ctx context.Context, userID uint, resourceType models.ResourceType, resourceID uint) error

	// ListFavoriteIDs 获取用户指定类型的所有收藏资源ID列表
	ListFavoriteIDs(ctx context.Context, userID uint, resourceType models.ResourceType) ([]uint, error)

	// IsFavorite 检查是否已收藏
	IsFavorite(ctx context.Context, userID uint, resourceType models.ResourceType, resourceID uint) (bool, error)
}

// FavoriteService 通过组合基础 CRUD 接口和收藏特有操作接口形成
type FavoriteService interface {
	contracts.GenericCRUD[models.UserFavorite, uint]
	FavoriteOperations
}
