package contracts

import (
	"novel-man/backend/utils/context"
)

// Filters 定义了用于列表查询的通用过滤器类型
type Filters map[string]interface{}

// GenericCRUD 定义了基础的 CRUD 操作接口
type GenericCRUD[T any, ID comparable] interface {
	Create(ctx context.Context, entity *T) error
	GetByID(ctx context.Context, id ID) (*T, error)
	Update(ctx context.Context, id ID, entity *T) error
	Delete(ctx context.Context, id ID) error
	List(ctx context.Context, page, limit int, filters Filters) ([]T, int64, error)
}

// GenericRepository 定义了基础的仓储操作接口
type GenericRepository[T any, ID comparable] interface {
	Create(ctx context.Context, entity *T) error
	GetByID(ctx context.Context, id ID) (*T, error)
	Update(ctx context.Context, id ID, entity *T) error
	Delete(ctx context.Context, id ID) error
	List(ctx context.Context, page, limit int, filters Filters) ([]T, int64, error)
}
