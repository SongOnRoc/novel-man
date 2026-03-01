package favorites

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/favorites"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// favoriteService 实现了 favorites.FavoriteService 接口
type favoriteService struct {
	*services.GenericService[models.UserFavorite, uint, favorites.FavoriteRepository]
	repo favorites.FavoriteRepository
}

// NewFavoriteService 创建一个新的 FavoriteService 实例
func NewFavoriteService(repo favorites.FavoriteRepository) favorites.FavoriteService {
	return &favoriteService{
		GenericService: services.NewGenericService[models.UserFavorite, uint, favorites.FavoriteRepository](repo),
		repo:           repo,
	}
}

// AddFavorite 添加收藏
func (s *favoriteService) AddFavorite(ctx context.Context, userID uint, resourceType models.ResourceType, resourceID uint) error {
	// 检查是否已收藏
	isFav, err := s.IsFavorite(ctx, userID, resourceType, resourceID)
	if err != nil {
		return err
	}
	if isFav {
		return nil // 已收藏，无需重复添加
	}

	favorite := &models.UserFavorite{
		UserID:       userID,
		ResourceType: resourceType,
		ResourceID:   resourceID,
	}
	return s.Create(ctx, favorite)
}

// RemoveFavorite 移除收藏
func (s *favoriteService) RemoveFavorite(ctx context.Context, userID uint, resourceType models.ResourceType, resourceID uint) error {
	// 使用 List 查询找到收藏记录
	filters := make(contracts.Filters)
	filters["query"] = contracts.NewCondition("user_id", userID).
		And(contracts.NewCondition("resource_type", string(resourceType))).
		And(contracts.NewCondition("resource_id", resourceID))

	favs, _, err := s.List(ctx, 1, 1, filters)
	if err != nil {
		return err
	}
	if len(favs) == 0 {
		return nil // 未收藏，无需删除
	}

	return s.Delete(ctx, favs[0].ID)
}

// ListFavoriteIDs 获取用户指定类型的所有收藏资源ID列表
func (s *favoriteService) ListFavoriteIDs(ctx context.Context, userID uint, resourceType models.ResourceType) ([]uint, error) {
	filters := make(contracts.Filters)
	filters["query"] = contracts.NewCondition("user_id", userID).
		And(contracts.NewCondition("resource_type", string(resourceType)))

	// 获取所有收藏，假设数量不会太大
	favs, _, err := s.List(ctx, 1, 1000, filters)
	if err != nil {
		return nil, err
	}

	ids := make([]uint, len(favs))
	for i, fav := range favs {
		ids[i] = fav.ResourceID
	}
	return ids, nil
}

// IsFavorite 检查是否已收藏
func (s *favoriteService) IsFavorite(ctx context.Context, userID uint, resourceType models.ResourceType, resourceID uint) (bool, error) {
	filters := make(contracts.Filters)
	filters["query"] = contracts.NewCondition("user_id", userID).
		And(contracts.NewCondition("resource_type", string(resourceType))).
		And(contracts.NewCondition("resource_id", resourceID))

	_, total, err := s.List(ctx, 1, 1, filters)
	if err != nil {
		return false, err
	}

	return total > 0, nil
}
