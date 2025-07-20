package services

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/utils/context"
)

// GenericService 提供了一个通用的服务实现
type GenericService[T any, ID comparable, R contracts.GenericRepository[T, ID]] struct {
	repo R
}

func NewGenericService[T any, ID comparable, R contracts.GenericRepository[T, ID]](repo R) *GenericService[T, ID, R] {
	return &GenericService[T, ID, R]{repo: repo}
}

func (s *GenericService[T, ID, R]) Create(ctx context.Context, entity *T) error {
	return s.repo.Create(ctx, entity)
}

func (s *GenericService[T, ID, R]) GetByID(ctx context.Context, id ID) (*T, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *GenericService[T, ID, R]) Update(ctx context.Context, id ID, entity *T) error {
	return s.repo.Update(ctx, id, entity)
}

func (s *GenericService[T, ID, R]) Delete(ctx context.Context, id ID) error {
	return s.repo.Delete(ctx, id)
}

func (s *GenericService[T, ID, R]) List(ctx context.Context, page, limit int) ([]T, int64, error) {
	return s.repo.List(ctx, page, limit)
}