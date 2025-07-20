package auth

import (
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// UserRepository defines the interface for user data persistence.
// It includes methods for creating and finding users.
type UserRepository interface {
	// CreateUser creates a new user in the database.
	CreateUser(ctx context.Context, user *models.User) error
	// FindUserByUsername finds a user by their username.
	FindUserByUsername(ctx context.Context, username string) (*models.User, error)
	// FindUserByEmail finds a user by their email address.
	FindUserByEmail(ctx context.Context, email string) (*models.User, error)
	// FindUserByID finds a user by their ID.
	FindUserByID(ctx context.Context, id uint) (*models.User, error)
}