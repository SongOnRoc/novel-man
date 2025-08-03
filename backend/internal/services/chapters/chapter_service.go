package chapters

import (
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
)

// ChapterService 通过嵌入 GenericService 来复用代码
type ChapterService struct {
	*services.GenericService[models.Chapter, uint, chapters.ChapterRepository]
	repo chapters.ChapterRepository
}

func NewChapterService(repo chapters.ChapterRepository) chapters.ChapterService {
	return &ChapterService{
		GenericService: services.NewGenericService[models.Chapter, uint, chapters.ChapterRepository](repo),
		repo:           repo,
	}
}

// TODO:可以在这里添加 Chapter 特有的服务方法
