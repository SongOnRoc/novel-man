package characters

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// CharacterService 通过组合基础 CRUD 接口形成
type CharacterService interface {
	contracts.GenericCRUD[models.Character, uint]
}
