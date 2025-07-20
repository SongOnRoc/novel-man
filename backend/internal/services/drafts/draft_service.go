package drafts

import (
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
)

// DraftService 通过嵌入 GenericService 来复用代码
type DraftService struct {
	*services.GenericService[models.Draft, uint, drafts.DraftRepository]
	repo drafts.DraftRepository
}

func NewDraftService(repo drafts.DraftRepository) drafts.DraftService {
	return &DraftService{
		GenericService: services.NewGenericService[models.Draft, uint, drafts.DraftRepository](repo),
		repo:           repo,
	}
}