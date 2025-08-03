package gorm

import (
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/relationships"
	"novel-man/backend/internal/models"
)

// RelationshipGormRepository 通过嵌入 GenericGormRepository 来复用代码
type RelationshipGormRepository struct {
	*GenericGormRepository[models.EntityRelationship, uint]
	db *gorm.DB
}

func NewRelationshipGormRepository(db *gorm.DB) relationships.RelationshipRepository {
	return &RelationshipGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.EntityRelationship, uint](db),
		db:                    db,
	}
}
