package gorm

import (
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/worldview"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// WorldviewCategoryGormRepository 通过嵌入 GenericGormRepository 来复用代码
type WorldviewCategoryGormRepository struct {
	*GenericGormRepository[models.WorldviewCategory, uint]
	db *gorm.DB
}

// NewWorldviewCategoryGormRepository 创建一个新的 WorldviewCategoryGormRepository 实例
func NewWorldviewCategoryGormRepository(db *gorm.DB) worldview.WorldviewCategoryRepository {
	return &WorldviewCategoryGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.WorldviewCategory, uint](db),
		db:                    db,
	}
}

// GetCategoriesByUserID 根据用户ID获取分类列表
func (r *WorldviewCategoryGormRepository) GetCategoriesByUserID(ctx context.Context, userID uint) ([]models.WorldviewCategory, error) {
	var categories []models.WorldviewCategory
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// 可以在这里添加 WorldviewCategory 特有的仓储方法

// WorldviewItemGormRepository 通过嵌入 GenericGormRepository 来复用代码
type WorldviewItemGormRepository struct {
	*GenericGormRepository[models.WorldviewItem, uint]
	db *gorm.DB
}

// NewWorldviewItemGormRepository 创建一个新的 WorldviewItemGormRepository 实例
func NewWorldviewItemGormRepository(db *gorm.DB) worldview.WorldviewItemRepository {
	return &WorldviewItemGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.WorldviewItem, uint](db),
		db:                    db,
	}
}

// GetItemsByCategoryID 根据分类ID获取条目列表
func (r *WorldviewItemGormRepository) GetItemsByCategoryID(ctx context.Context, categoryID uint) ([]models.WorldviewItem, error) {
	var items []models.WorldviewItem
	if err := r.db.WithContext(ctx).Where("category_id = ?", categoryID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

// 可以在这里添加 WorldviewItem 特有的仓储方法
