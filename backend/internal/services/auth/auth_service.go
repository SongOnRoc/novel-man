package auth

import (
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"novel-man/backend/internal/config"
	"novel-man/backend/internal/contracts/auth"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

type authService struct {
	userRepo  auth.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo auth.UserRepository) auth.AuthService {
	// In a real application, the JWT secret should be loaded from a secure configuration.
	return &authService{userRepo: userRepo, jwtSecret: config.GetJWTSecret()}
}

func (s *authService) Register(ctx context.Context, username, email, password string) (*models.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hashedPassword),
	}

	if err := s.userRepo.CreateUser(ctx, user); err != nil {
		// Generic check for duplicate entry error string.
		// This is not ideal but avoids driver-specific dependencies.
		logger.Warn(&ctx, "Error creating user: {}", err)
		if strings.Contains(strings.ToLower(err.Error()), "unique constraint failed") {
			return nil, auth.ErrUserAlreadyExists
		}
		return nil, err
	}

	return user, nil
}

func (s *authService) Login(ctx context.Context, identifier, password string) (string, error) {
	user, err := s.userRepo.FindUserByUsername(ctx, identifier)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// If not found by username, try by email
			user, err = s.userRepo.FindUserByEmail(ctx, identifier)
			if err != nil {
				return "", errors.New("invalid credentials")
			}
		} else {
			return "", err
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", errors.New("invalid credentials")
	}

	token, err := s.generateJWT(user)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *authService) Logout(ctx context.Context, token string) error {
	// 在JWT模式下，通常不需要在服务端存储token，登出操作可以简单地在客户端删除token
	// TODO:如果需要实现服务端的token黑名单，可以在这里添加逻辑
	return nil
}

func (s *authService) GetCurrentUser(ctx context.Context, userID uint) (*models.User, error) {
	return s.userRepo.FindUserByID(ctx, userID)
}

func (s *authService) generateJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
