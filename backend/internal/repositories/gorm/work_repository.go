package gorm

import (
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/models"
)

// WorkGormRepository 通过嵌入 GenericGormRepository 来复用代码
type WorkGormRepository struct {
	*GenericGormRepository[models.Work, int64]
	db *gorm.DB
}

func NewWorkGormRepository(db *gorm.DB) works.WorkRepository {
	return &WorkGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.Work, int64](db),
		db:                    db,
	}
}

// TODO:可以在这里添加 Work 特有的仓储方法
// func (r *WorkGormRepository) GetWorksByUserID(ctx context.Context, userID uint, page, limit int) ([]models.Work, int64, error) {
//     // 实现特有方法
// }
