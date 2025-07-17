package works

import (
	"gorm.io/gorm"
)

type WorkService struct {
	DB *gorm.DB
}

func (s *WorkService) FindWorkForUser(workID uint, userID uint) (interface{}, error) {
	var work Work
	err := s.DB.Where("id = ? AND user_id = ?", workID, userID).First(&work).Error
	return work, err
}