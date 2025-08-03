package relationships

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// RelationshipRepository 通过组合基础仓储接口形成
type RelationshipRepository interface {
	contracts.GenericRepository[models.EntityRelationship, uint]
}
