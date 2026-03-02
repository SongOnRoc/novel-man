package gorm

import (
	"fmt"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/utils/context"

	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

// GenericGormRepository 提供了一个通用的 GORM 仓储实现
type GenericGormRepository[T any, ID comparable] struct {
	db *gorm.DB
}

func NewGenericGormRepository[T any, ID comparable](db *gorm.DB) *GenericGormRepository[T, ID] {
	return &GenericGormRepository[T, ID]{db: db}
}

func (r *GenericGormRepository[T, ID]) Create(ctx context.Context, entity *T) error {
	return r.db.WithContext(ctx).Create(entity).Error
}

func (r *GenericGormRepository[T, ID]) GetByID(ctx context.Context, id ID) (*T, error) {
	var entity T
	if err := r.db.WithContext(ctx).First(&entity, id).Error; err != nil {
		return nil, err
	}
	return &entity, nil
}

func (r *GenericGormRepository[T, ID]) Update(ctx context.Context, id ID, entity *T) error {
	return r.db.WithContext(ctx).Model(entity).Where("id = ?", id).Updates(entity).Error
}

func (r *GenericGormRepository[T, ID]) Delete(ctx context.Context, id ID) error {
	var entity T
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity).Error
}

func (r *GenericGormRepository[T, ID]) List(ctx context.Context, page, limit int, filters contracts.Filters) ([]T, int64, error) {
	var entities []T
	var total int64

	db := r.db.WithContext(ctx).Model(new(T))

	// 获取 Model Schema 用于字段白名单验证
	stmt := &gorm.Statement{DB: db}
	if err := stmt.Parse(new(T)); err != nil {
		return nil, 0, err
	}

	// 应用所有过滤器
	db = r.applyFilters(db, filters, stmt.Schema)

	// 应用排序
	if order, ok := filters[contracts.FilterKeyOrder].(string); ok {
		db = db.Order(order)
	} else {
		db = db.Order("updated_at desc")
	}

	// 计算总数
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 应用分页并获取数据
	offset := (page - 1) * limit
	if err := db.Offset(offset).Limit(limit).Find(&entities).Error; err != nil {
		return nil, 0, err
	}

	return entities, total, nil
}

// applyFilters 应用过滤条件
// 统一先将 Filters 归一化为 Condition 树，再复用 applyCondition 执行。
func (r *GenericGormRepository[T, ID]) applyFilters(db *gorm.DB, filters contracts.Filters, schema *schema.Schema) *gorm.DB {
	root := r.normalizeFiltersToCondition(filters)
	if root == nil {
		return db
	}
	return r.applyCondition(db, root, schema)
}

// normalizeFiltersToCondition 将 Filters 归一化为 Condition 树。
// - 忽略排序键（order）：排序由 List 中的 Order 分支统一处理，避免被当作字段条件参与 WHERE。
// - 已是 Condition 的值直接复用
// - 标量值转换为等值条件
// - nil 值转换为 IS NULL 条件
func (r *GenericGormRepository[T, ID]) normalizeFiltersToCondition(filters contracts.Filters) *contracts.Condition {
	var root *contracts.Condition

	for key, value := range filters {
		if key == contracts.FilterKeyOrder {
			continue
		}

		var current *contracts.Condition
		if cond, ok := value.(*contracts.Condition); ok {
			current = cond
		} else if value == nil {
			current = contracts.NewCondition(key, nil, contracts.OpIsNull)
		} else {
			current = contracts.NewCondition(key, value)
		}

		if current == nil {
			continue
		}

		if root == nil {
			root = current
		} else {
			root = root.And(current)
		}
	}

	return root
}

// applyCondition 递归应用 Condition
func (r *GenericGormRepository[T, ID]) applyCondition(db *gorm.DB, cond *contracts.Condition, schema *schema.Schema) *gorm.DB {
	if cond == nil {
		return db
	}

	switch cond.Type {
	case contracts.LogicAnd:
		return db.Where(r.applyCondition(db.Session(&gorm.Session{NewDB: true}), cond.Left, schema)).
			Where(r.applyCondition(db.Session(&gorm.Session{NewDB: true}), cond.Right, schema))

	case contracts.LogicOr:
		return db.Where(r.applyCondition(db.Session(&gorm.Session{NewDB: true}), cond.Left, schema)).
			Or(r.applyCondition(db.Session(&gorm.Session{NewDB: true}), cond.Right, schema))

	case contracts.TypeLeaf:
		// 白名单验证
		field := schema.LookUpField(cond.Field)
		if field != nil {
			condition, arg := r.buildCondition(cond.Operator, field.DBName, cond.Value)
			return db.Where(condition, arg)
		}
	}

	return db
}

// buildCondition 根据操作符构建 SQL 条件和参数
func (r *GenericGormRepository[T, ID]) buildCondition(op, colName string, value interface{}) (string, interface{}) {
	switch op {
	case contracts.OpLike:
		return colName + " LIKE ?", "%" + fmt.Sprint(value) + "%"
	case contracts.OpGreaterThan:
		return colName + " > ?", value
	case contracts.OpLessThan:
		return colName + " < ?", value
	case contracts.OpGreaterThanOrEqual:
		return colName + " >= ?", value
	case contracts.OpLessThanOrEqual:
		return colName + " <= ?", value
	case contracts.OpNotEqual:
		return colName + " <> ?", value
	case contracts.OpIsNull:
		return colName + " IS NULL", nil
	default:
		return colName + " = ?", value
	}
}
