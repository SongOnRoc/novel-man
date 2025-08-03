package gorm

import (
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/models"
)

// ChapterGormRepository 通过嵌入 GenericGormRepository 来复用代码
type ChapterGormRepository struct {
	*GenericGormRepository[models.Chapter, uint]
	db *gorm.DB
}

func NewChapterGormRepository(db *gorm.DB) chapters.ChapterRepository {
	return &ChapterGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.Chapter, uint](db),
		db:                    db,
	}
}

// TODO:可以在这里添加 Chapter 特有的仓储方法
// func (r *ChapterGormRepository) GetChaptersByWorkID(ctx context.Context, workID uint, page, limit int) ([]models.Chapter, int64, error) {
//     // 实现特有方法
// }
