package auth

import (
	"errors"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

const (
	TokenKindUser  = "user"
	TokenKindAdmin = "admin"
)

var (
	// ErrUserAlreadyExists is returned when trying to register a user that already exists.
	ErrUserAlreadyExists = errors.New("user with this email or username already exists")
	ErrAdminAccessDenied = errors.New("admin access denied")
)

// AuthService defines the interface for authentication services.
// It includes methods for user registration, login, logout, and user information retrieval.
type AuthService interface {
	// Register handles the creation of a new user.
	Register(ctx context.Context, username, email, password string) (*models.User, error)
	// Login handles user authentication and returns a user token.
	Login(ctx context.Context, identifier, password string) (string, error)
	// AdminLogin handles admin authentication and returns an admin token.
	AdminLogin(ctx context.Context, identifier, password string) (string, error)
	// Logout handles user logout.
	Logout(ctx context.Context, token string) error
	// GetCurrentUser retrieves the current authenticated user's information.
	GetCurrentUser(ctx context.Context, userID uint) (*models.User, error)
	// GetCurrentAdmin retrieves the current authenticated admin's information.
	GetCurrentAdmin(ctx context.Context, adminID uint) (*models.User, error)
}
