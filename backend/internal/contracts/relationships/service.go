package relationships

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// RelationshipService 通过组合基础 CRUD 接口形成
type RelationshipService interface {
	contracts.GenericCRUD[models.EntityRelationship, uint]
}
