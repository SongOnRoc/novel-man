package characters

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// CharacterRepository 通过组合基础仓储接口形成
type CharacterRepository interface {
	contracts.GenericRepository[models.Character, uint]
}