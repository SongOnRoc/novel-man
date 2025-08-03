package works

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// WorkPublish 定义了作品发布的接口
type WorkPublish interface {
	Publish(ctx context.Context, id int64) error
}

// WorkService 通过组合基础 CRUD 接口和发布接口形成
type WorkService interface {
	contracts.GenericCRUD[models.Work, int64]
	WorkPublish
}
