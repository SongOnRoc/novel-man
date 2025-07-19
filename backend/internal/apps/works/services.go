package works

import (
	"context"
	"errors"
	"novel-man/backend/internal/logger"
	Ctx "novel-man/backend/utils/context"
	"time"

	"gorm.io/gorm"
)

// WorkService handles business logic for works.
type WorkService struct {
	DB *gorm.DB
}

// NewWorkService creates a new instance of WorkService.
func NewWorkService(db *gorm.DB) *WorkService {
	return &WorkService{DB: db}
}

// generateUniqueID generates a unique, timestamp-based ID.
// It checks for collisions and retries until a unique ID is found.
func (s *WorkService) generateUniqueID(ctx context.Context) (int64, error) {
	for {
		id := time.Now().UnixMilli()
		var count int64
		if err := s.DB.WithContext(ctx).Model(&Work{}).Where("id = ?", id).Count(&count).Error; err != nil {
			return 0, err
		}
		if count == 0 {
			return id, nil
		}
		time.Sleep(time.Millisecond * 5)
		// If ID exists, loop again to get a new timestamp.
	}
}

// CreateWork creates a new work for a user.
func (s *WorkService) CreateWork(ctx context.Context, userID uint, input *CreateWorkDTO) (*Work, error) {
	customCtx := Ctx.New(ctx)
	logger.Info(customCtx, "Attempting to create work for user {}", userID)

	uniqueID, err := s.generateUniqueID(ctx)
	if err != nil {
		logger.Error(customCtx, "Failed to generate unique ID for new work: {}", err)
		return nil, err
	}

	work := &Work{
		ID:            uniqueID,
		UserID:        userID,
		Title:         input.Title,
		Description:   input.Description,
		CoverImageURL: input.CoverImageURL,
		Category:      input.Category,
		Status:        input.Status,
	}

	if work.Status == "" {
		work.Status = "连载中"
	}

	if err := s.DB.WithContext(ctx).Create(work).Error; err != nil {
		logger.Error(customCtx, "Failed to create work for user {}: {}", userID, err)
		return nil, err
	}
	logger.Info(customCtx, "Successfully created work {} for user {}", work.ID, userID)
	return work, nil
}

// GetWorks retrieves a paginated list of works for a user.
func (s *WorkService) GetWorks(ctx context.Context, userID uint, page, limit int, status string) ([]Work, int64, error) {
	customCtx := Ctx.New(ctx)
	logger.Info(customCtx, "Fetching works for user {} with page={}, limit={}, status='{}'", userID, page, limit, status)
	var works []Work
	var total int64

	query := s.DB.WithContext(ctx).Model(&Work{}).Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		logger.Error(customCtx, "Failed to count works for user {}: {}", userID, err)
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&works).Error; err != nil {
		logger.Error(customCtx, "Failed to retrieve works for user {}: {}", userID, err)
		return nil, 0, err
	}

	logger.Info(customCtx, "Successfully retrieved {} works for user {}", len(works), userID)
	return works, total, nil
}

// GetWorkByID retrieves a single work by its ID for a specific user.
func (s *WorkService) GetWorkByID(ctx context.Context, workID int64, userID uint) (*Work, error) {
	customCtx := Ctx.New(ctx)
	logger.Info(customCtx, "Fetching work {} for user {}", workID, userID)
	var work Work
	if err := s.DB.WithContext(ctx).Where("id = ? AND user_id = ?", workID, userID).First(&work).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			logger.Error(customCtx, "Failed to find work {} for user {}: {}", workID, userID, err)
		}
		return nil, err
	}
	logger.Info(customCtx, "Successfully fetched work {}", workID)
	return &work, nil
}

// UpdateWork updates an existing work.
func (s *WorkService) UpdateWork(ctx context.Context, workID int64, userID uint, input *UpdateWorkDTO) (*Work, error) {
	customCtx := Ctx.New(ctx)
	logger.Info(customCtx, "Attempting to update work {} for user {}", workID, userID)
	work, err := s.GetWorkByID(ctx, workID, userID)
	if err != nil {
		return nil, err // GetWorkByID already logs the error
	}

	if err := s.DB.WithContext(ctx).Model(work).Updates(input).Error; err != nil {
		logger.Error(customCtx, "Failed to update work {}: {}", workID, err)
		return nil, err
	}

	// Re-query to get the updated timestamp
	updatedWork, err := s.GetWorkByID(ctx, workID, userID)
	if err != nil {
		return nil, err
	}
	logger.Info(customCtx, "Successfully updated work {}", workID)
	return updatedWork, nil
}

// DeleteWork deletes a work.
func (s *WorkService) DeleteWork(ctx context.Context, workID int64, userID uint) error {
	customCtx := Ctx.New(ctx)
	logger.Info(customCtx, "Attempting to delete work {} for user {}", workID, userID)
	
	// We only need to ensure the work exists and belongs to the user.
	// GORM's .Delete works with a primary key.
	result := s.DB.WithContext(ctx).Where("id = ? AND user_id = ?", workID, userID).Delete(&Work{})
	
	if result.Error != nil {
		logger.Error(customCtx, "Failed to delete work {}: {}", workID, result.Error)
		return result.Error
	}

	if result.RowsAffected == 0 {
		err := gorm.ErrRecordNotFound
		logger.Warn(customCtx, "Attempted to delete non-existent or unauthorized work {}: {}", workID, err)
		return err
	}

	logger.Info(customCtx, "Successfully deleted work {}", workID)
	return nil
}

// DTOs for input binding
type CreateWorkDTO struct {
	Title         string `json:"title" binding:"required"`
	Description   string `json:"description"`
	CoverImageURL string `json:"cover_image_url"`
	Category      string `json:"category"`
	Status        string `json:"status"`
}

type UpdateWorkDTO struct {
	Title         string `json:"title"`
	Description   string `json:"description"`
	CoverImageURL string `json:"cover_image_url"`
	Category      string `json:"category"`
	Status        string `json:"status"`
}
