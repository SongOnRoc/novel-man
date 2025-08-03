package relationships

import (
	"novel-man/backend/internal/contracts/relationships"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
)

// RelationshipService 通过嵌入 GenericService 来复用代码
type RelationshipService struct {
	*services.GenericService[models.EntityRelationship, uint, relationships.RelationshipRepository]
	repo relationships.RelationshipRepository
}

func NewRelationshipService(repo relationships.RelationshipRepository) relationships.RelationshipService {
	return &RelationshipService{
		GenericService: services.NewGenericService[models.EntityRelationship, uint, relationships.RelationshipRepository](repo),
		repo:           repo,
	}
}
