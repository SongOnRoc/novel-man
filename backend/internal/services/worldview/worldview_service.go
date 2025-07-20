package worldview

import (
	"novel-man/backend/internal/contracts/worldview"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// WorldviewCategoryService 通过嵌入 GenericService 来复用代码
type WorldviewCategoryService struct {
	*services.GenericService[models.WorldviewCategory, uint, worldview.WorldviewCategoryRepository]
	repo worldview.WorldviewCategoryRepository
	itemService worldview.WorldviewItemService
}

// NewWorldviewCategoryService 创建一个新的 WorldviewCategoryService 实例
func NewWorldviewCategoryService(repo worldview.WorldviewCategoryRepository, itemService worldview.WorldviewItemService) worldview.WorldviewCategoryService {
	return &WorldviewCategoryService{
		GenericService: services.NewGenericService[models.WorldviewCategory, uint, worldview.WorldviewCategoryRepository](repo),
		repo: repo,
		itemService: itemService,
	}
}

// GetCategoriesByUserID 根据用户ID获取分类列表
func (s *WorldviewCategoryService) GetCategoriesByUserID(ctx context.Context, userID uint) ([]models.WorldviewCategory, error) {
	return s.repo.GetCategoriesByUserID(ctx, userID)
}

// Delete 删除一个分类及其下的所有条目
func (s *WorldviewCategoryService) Delete(ctx context.Context, id uint) error {
	// 首先删除该分类下的所有条目
	items, err := s.itemService.GetItemsByCategoryID(ctx, id)
	if err != nil {
		return err
	}
	
	for _, item := range items {
		if err := s.itemService.Delete(ctx, item.ID); err != nil {
			return err
		}
	}
	
	// 然后删除分类本身
	return s.GenericService.Delete(ctx, id)
}

// 可以在这里添加 WorldviewCategory 特有的服务方法

// WorldviewItemService 通过嵌入 GenericService 来复用代码
type WorldviewItemService struct {
	*services.GenericService[models.WorldviewItem, uint, worldview.WorldviewItemRepository]
	repo worldview.WorldviewItemRepository
}

// NewWorldviewItemService 创建一个新的 WorldviewItemService 实例
func NewWorldviewItemService(repo worldview.WorldviewItemRepository) worldview.WorldviewItemService {
	return &WorldviewItemService{
		GenericService: services.NewGenericService[models.WorldviewItem, uint, worldview.WorldviewItemRepository](repo),
		repo: repo,
	}
}

// GetItemsByCategoryID 根据分类ID获取条目列表
func (s *WorldviewItemService) GetItemsByCategoryID(ctx context.Context, categoryID uint) ([]models.WorldviewItem, error) {
	return s.repo.GetItemsByCategoryID(ctx, categoryID)
}

// 可以在这里添加 WorldviewItem 特有的服务方法