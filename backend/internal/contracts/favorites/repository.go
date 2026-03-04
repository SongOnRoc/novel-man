package favorites

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// FavoriteRepository 通过组合基础仓储接口形成
type FavoriteRepository interface {
	contracts.GenericRepository[models.UserFavorite, uint]
}
