package contracts

import (
	"novel-man/backend/utils/context"
)

// Filter keys
const (
	FilterKeyOrder = "order"
)

// Query Operators
const (
	OpEqual              = "eq"
	OpLike               = "like"
	OpGreaterThan        = "gt"
	OpLessThan           = "lt"
	OpGreaterThanOrEqual = "gte"
	OpLessThanOrEqual    = "lte"
	OpNotEqual           = "neq"
	OpIsNull             = "null"
)

// Logic Operators
const (
	LogicAnd = "AND"
	LogicOr  = "OR"
	TypeLeaf = "LEAF"
)

// Filters 定义了用于列表查询的通用过滤器类型
type Filters map[string]interface{}

// Condition 定义查询条件结构体
// 采用二叉树结构，支持任意复杂的逻辑组合
type Condition struct {
	// 节点类型: "LEAF", "AND", "OR"
	Type string

	// 叶子节点数据 (Type="LEAF")
	Field    string
	Operator string
	Value    interface{}

	// 组合节点数据 (Type="AND" | "OR")
	Left  *Condition
	Right *Condition
}

// NewCondition 创建一个新的叶子条件
// 默认操作符为 OpEqual
func NewCondition(field string, value interface{}, op ...string) *Condition {
	operator := OpEqual
	if len(op) > 0 {
		operator = op[0]
	}
	return &Condition{
		Type:     TypeLeaf,
		Field:    field,
		Value:    value,
		Operator: operator,
	}
}

// And 将当前条件与新条件用 AND 连接
// 返回一个新的组合节点: (Current) AND (Other)
func (c *Condition) And(other *Condition) *Condition {
	return &Condition{
		Type:  LogicAnd,
		Left:  c,
		Right: other,
	}
}

// Or 将当前条件与新条件用 OR 连接
// 返回一个新的组合节点: (Current) OR (Other)
func (c *Condition) Or(other *Condition) *Condition {
	return &Condition{
		Type:  LogicOr,
		Left:  c,
		Right: other,
	}
}

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
