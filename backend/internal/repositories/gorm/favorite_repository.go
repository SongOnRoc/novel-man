package gorm

import (
	"novel-man/backend/internal/contracts/favorites"
	"novel-man/backend/internal/models"

	"gorm.io/gorm"
)

// FavoriteGormRepository 通过嵌入 GenericGormRepository 来复用代码
type FavoriteGormRepository struct {
	*GenericGormRepository[models.UserFavorite, uint]
	db *gorm.DB
}

// NewFavoriteGormRepository 创建一个新的 FavoriteRepository 实例
func NewFavoriteGormRepository(db *gorm.DB) favorites.FavoriteRepository {
	return &FavoriteGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.UserFavorite, uint](db),
		db:                    db,
	}
}
