package gorm

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/utils/context"

	"gorm.io/gorm"
)

// GenericGormRepository 提供了一个通用的 GORM 仓储实现
type GenericGormRepository[T any, ID comparable] struct {
	db *gorm.DB
}

func NewGenericGormRepository[T any, ID comparable](db *gorm.DB) *GenericGormRepository[T, ID] {
	return &GenericGormRepository[T, ID]{db: db}
}

func (r *GenericGormRepository[T, ID]) Create(ctx context.Context, entity *T) error {
	return r.db.WithContext(ctx).Create(entity).Error
}

func (r *GenericGormRepository[T, ID]) GetByID(ctx context.Context, id ID) (*T, error) {
	var entity T
	if err := r.db.WithContext(ctx).First(&entity, id).Error; err != nil {
		return nil, err
	}
	return &entity, nil
}

func (r *GenericGormRepository[T, ID]) Update(ctx context.Context, id ID, entity *T) error {
	return r.db.WithContext(ctx).Model(entity).Where("id = ?", id).Updates(entity).Error
}

func (r *GenericGormRepository[T, ID]) Delete(ctx context.Context, id ID) error {
	var entity T
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity).Error
}

func (r *GenericGormRepository[T, ID]) List(ctx context.Context, page, limit int, filters contracts.Filters) ([]T, int64, error) {
	var entities []T
	var total int64

	db := r.db.WithContext(ctx).Model(new(T))

	// 应用所有过滤器
	for key, value := range filters {
		db = db.Where(key+" = ?", value)
	}

	// 计算总数
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 应用分页并获取数据
	offset := (page - 1) * limit
	if err := db.Offset(offset).Limit(limit).Find(&entities).Error; err != nil {
		return nil, 0, err
	}

	return entities, total, nil
}
