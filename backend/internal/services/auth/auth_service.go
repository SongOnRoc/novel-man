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
	opsc "novel-man/backend/internal/contracts/ops"
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
		Role:         "user",
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
	user, err := s.authenticateUser(ctx, identifier, password)
	if err != nil {
		return "", err
	}

	token, err := s.generateUserJWT(user)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (s *authService) AdminLogin(ctx context.Context, identifier, password string) (string, error) {
	user, err := s.authenticateUser(ctx, identifier, password)
	if err != nil {
		return "", err
	}

	if !isAdminRole(user.Role) {
		return "", auth.ErrAdminAccessDenied
	}

	token, err := s.generateAdminJWT(user)
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

func (s *authService) GetCurrentAdmin(ctx context.Context, adminID uint) (*models.User, error) {
	user, err := s.userRepo.FindUserByID(ctx, adminID)
	if err != nil {
		return nil, err
	}

	if !isAdminRole(user.Role) {
		return nil, auth.ErrAdminAccessDenied
	}

	return user, nil
}

func (s *authService) authenticateUser(ctx context.Context, identifier, password string) (*models.User, error) {
	user, err := s.userRepo.FindUserByUsername(ctx, identifier)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// If not found by username, try by email
			user, err = s.userRepo.FindUserByEmail(ctx, identifier)
			if err != nil {
				return nil, errors.New("invalid credentials")
			}
		} else {
			return nil, err
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

func (s *authService) generateUserJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":    user.ID,
		"username":   user.Username,
		"role":       normalizeRole(user.Role),
		"token_kind": auth.TokenKindUser,
		"exp":        time.Now().Add(time.Hour * 72).Unix(),
	}

	return s.signClaims(claims)
}

func (s *authService) generateAdminJWT(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"admin_id":   user.ID,
		"username":   user.Username,
		"admin_role": normalizeRole(user.Role),
		"token_kind": auth.TokenKindAdmin,
		"exp":        time.Now().Add(time.Hour * 72).Unix(),
	}

	return s.signClaims(claims)
}

func (s *authService) signClaims(claims jwt.MapClaims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func normalizeRole(role string) string {
	if role == "" {
		return "user"
	}

	return role
}

func isAdminRole(role string) bool {
	normalized := normalizeRole(role)
	return normalized == opsc.OpsRoleAdmin || normalized == opsc.OpsRoleOperator
}
