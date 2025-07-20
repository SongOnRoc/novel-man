package gorm

import (
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/characters"
	"novel-man/backend/internal/models"
)

// CharacterGormRepository 通过嵌入 GenericGormRepository 来复用代码
type CharacterGormRepository struct {
	*GenericGormRepository[models.Character, uint]
	db *gorm.DB
}

func NewCharacterGormRepository(db *gorm.DB) characters.CharacterRepository {
	return &CharacterGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.Character, uint](db),
		db: db,
	}
}

// TODO:可以在这里添加 Character 特有的仓储方法
// func (r *CharacterGormRepository) GetCharactersByUserID(ctx context.Context, userID uint, page, limit int) ([]models.Character, int64, error) {
//     // 实现特有方法
// }