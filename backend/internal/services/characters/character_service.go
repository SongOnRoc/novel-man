package characters

import (
	"novel-man/backend/internal/contracts/characters"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
)

// CharacterService 通过嵌入 GenericService 来复用代码
type CharacterService struct {
	*services.GenericService[models.Character, uint, characters.CharacterRepository]
	repo characters.CharacterRepository
}

func NewCharacterService(repo characters.CharacterRepository) characters.CharacterService {
	return &CharacterService{
		GenericService: services.NewGenericService[models.Character, uint, characters.CharacterRepository](repo),
		repo:           repo,
	}
}

// TODO:可以在这里添加 Character 特有的服务方法
