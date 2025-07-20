package resource

import (
	"errors"
	"net/http"

	"novel-man/backend/utils/context"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// --- Check Function Implementations ---

// checkWorkExistence verifies if a work with the given ID exists.
func checkWorkExistence(c *gin.Context, s *AllServices, id uint64, _ uint) (int, error) {
	_, err := s.WorkService.GetByID(*context.New(c), int64(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

// checkWorkOwnership verifies if the current user owns the work.
func checkWorkOwnership(c *gin.Context, s *AllServices, id uint64, userID uint) (int, error) {
	work, err := s.WorkService.GetByID(*context.New(c), int64(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	if work.UserID != userID {
		return http.StatusForbidden, nil
	}
	return http.StatusOK, nil
}

// checkChapterExistence verifies if a chapter with the given ID exists.
func checkChapterExistence(c *gin.Context, s *AllServices, id uint64, _ uint) (int, error) {
	_, err := s.ChapterService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

// checkChapterOwnership verifies if the current user owns the chapter's parent work.
func checkChapterOwnership(c *gin.Context, s *AllServices, id uint64, userID uint) (int, error) {
	chapter, err := s.ChapterService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	work, err := s.WorkService.GetByID(*context.New(c), int64(chapter.WorkID))
	if err != nil {
		return http.StatusInternalServerError, err
	}
	if work.UserID != userID {
		return http.StatusForbidden, nil
	}
	return http.StatusOK, nil
}

// checkCharacterExistence verifies if a character with the given ID exists.
func checkCharacterExistence(c *gin.Context, s *AllServices, id uint64, _ uint) (int, error) {
	_, err := s.CharacterService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

// checkCharacterOwnership verifies if the current user owns the character.
func checkCharacterOwnership(c *gin.Context, s *AllServices, id uint64, userID uint) (int, error) {
	character, err := s.CharacterService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	if character.UserID != userID {
		return http.StatusForbidden, nil
	}
	return http.StatusOK, nil
}

// checkDraftExistence verifies if a draft with the given ID exists.
func checkDraftExistence(c *gin.Context, s *AllServices, id uint64, _ uint) (int, error) {
	_, err := s.DraftService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

// checkDraftOwnership verifies if the current user owns the draft.
func checkDraftOwnership(c *gin.Context, s *AllServices, id uint64, userID uint) (int, error) {
	draft, err := s.DraftService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	if draft.WorkID != nil {
		work, err := s.WorkService.GetByID(*context.New(c), int64(*draft.WorkID))
		if err != nil {
			return http.StatusInternalServerError, err
		}
		if work.UserID != userID {
			return http.StatusForbidden, nil
		}
		return http.StatusOK, nil
	}
	if draft.UserID != userID {
		return http.StatusForbidden, nil
	}
	return http.StatusOK, nil
}

// checkWorldviewItemExistence verifies if a worldview item with the given ID exists.
func checkWorldviewItemExistence(c *gin.Context, s *AllServices, id uint64, _ uint) (int, error) {
	_, err := s.WorldviewItemService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

// checkWorldviewItemOwnership verifies if the current user owns the worldview item.
func checkWorldviewItemOwnership(c *gin.Context, s *AllServices, id uint64, userID uint) (int, error) {
	item, err := s.WorldviewItemService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	if item.UserID != userID {
		return http.StatusForbidden, nil
	}
	return http.StatusOK, nil
}

// checkRelationshipExistence verifies if a relationship with the given ID exists.
func checkRelationshipExistence(c *gin.Context, s *AllServices, id uint64, _ uint) (int, error) {
	_, err := s.RelationshipService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

// checkRelationshipOwnership verifies if the current user owns the relationship's parent work.
func checkRelationshipOwnership(c *gin.Context, s *AllServices, id uint64, userID uint) (int, error) {
	relationship, err := s.RelationshipService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	if relationship.WorkID != nil {
		work, err := s.WorkService.GetByID(*context.New(c), int64(*relationship.WorkID))
		if err != nil {
			return http.StatusInternalServerError, err
		}
		if work.UserID != userID {
			return http.StatusForbidden, nil
		}
		return http.StatusOK, nil
	}
	// Global relationship, assuming it's accessible.
	return http.StatusOK, nil
}

// checkWorldviewCategoryExistence verifies if a worldview category with the given ID exists.
func checkWorldviewCategoryExistence(c *gin.Context, s *AllServices, id uint64, _ uint) (int, error) {
	_, err := s.WorldviewCategoryService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

// checkWorldviewCategoryOwnership verifies if the current user owns the worldview category.
func checkWorldviewCategoryOwnership(c *gin.Context, s *AllServices, id uint64, userID uint) (int, error) {
	category, err := s.WorldviewCategoryService.GetByID(*context.New(c), uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return http.StatusNotFound, nil
		}
		return http.StatusInternalServerError, err
	}
	if category.UserID != userID {
		return http.StatusForbidden, nil
	}
	return http.StatusOK, nil
}
