package auth

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"novel-man/backend/internal/config"
	"novel-man/backend/internal/container"
	authcontract "novel-man/backend/internal/contracts/auth"
	"novel-man/backend/internal/contracts/middlewares"
	"novel-man/backend/utils/context"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/dig"
)

const (
	// AuthMiddlewareName 是普通用户认证中间件在注册表中的名称。
	AuthMiddlewareName = "auth"
	// AdminAuthMiddlewareName 是管理后台认证中间件在注册表中的名称。
	AdminAuthMiddlewareName = "admin-auth"
)

// 确保中间件实现了 Middleware 接口。
var (
	_ middlewares.Middleware = (*AuthMiddleware)(nil)
	_ middlewares.Middleware = (*AdminAuthMiddleware)(nil)
)

// UserJWTClaims 定义普通用户 JWT 的自定义声明。
type UserJWTClaims struct {
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	TokenKind string `json:"token_kind"`
	jwt.RegisteredClaims
}

// AdminJWTClaims 定义管理后台 JWT 的自定义声明。
type AdminJWTClaims struct {
	AdminID   uint   `json:"admin_id"`
	Username  string `json:"username"`
	AdminRole string `json:"admin_role"`
	TokenKind string `json:"token_kind"`
	jwt.RegisteredClaims
}

// AuthMiddleware 实现普通用户认证中间件。
type AuthMiddleware struct {
	authService authcontract.AuthService
	jwtSecret   []byte
}

// AdminAuthMiddleware 实现管理后台认证中间件。
type AdminAuthMiddleware struct {
	authService authcontract.AuthService
	jwtSecret   []byte
}

// NewAuthMiddleware 创建一个新的普通用户认证中间件实例。
func NewAuthMiddleware(authService authcontract.AuthService) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		jwtSecret:   []byte(config.GetJWTSecret()),
	}
}

// NewAdminAuthMiddleware 创建一个新的管理后台认证中间件实例。
func NewAdminAuthMiddleware(authService authcontract.AuthService) *AdminAuthMiddleware {
	return &AdminAuthMiddleware{
		authService: authService,
		jwtSecret:   []byte(config.GetJWTSecret()),
	}
}

// Name 返回普通用户认证中间件名称。
func (m *AuthMiddleware) Name() string {
	return AuthMiddlewareName
}

// Name 返回管理后台认证中间件名称。
func (m *AdminAuthMiddleware) Name() string {
	return AdminAuthMiddlewareName
}

// Handler 返回普通用户认证中间件核心处理函数。
func (m *AuthMiddleware) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := extractToken(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		claims, err := parseAndValidateUserToken(tokenString, m.jwtSecret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		user, err := m.authService.GetCurrentUser(*context.New(c), claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not found or inactive"})
			return
		}

		role := user.Role
		if role == "" {
			role = "user"
		}

		c.Set("userID", claims.UserID)
		c.Set("role", role)
		c.Next()
	}
}

// Handler 返回管理后台认证中间件核心处理函数。
func (m *AdminAuthMiddleware) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := extractToken(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		claims, err := parseAndValidateAdminToken(tokenString, m.jwtSecret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		adminUser, err := m.authService.GetCurrentAdmin(*context.New(c), claims.AdminID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Admin not found or inactive"})
			return
		}

		adminRole := adminUser.Role
		if adminRole == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Admin role is missing"})
			return
		}

		c.Set("adminID", claims.AdminID)
		c.Set("adminRole", adminRole)
		c.Next()
	}
}

// extractToken 从 Authorization 头中提取 Bearer Token。
func extractToken(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header is required")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("authorization header format must be Bearer {token}")
	}

	return parts[1], nil
}

func parseAndValidateUserToken(tokenString string, jwtSecret []byte) (*UserJWTClaims, error) {
	claims := &UserJWTClaims{}
	if err := parseTokenClaims(tokenString, claims, jwtSecret); err != nil {
		return nil, err
	}

	if claims.TokenKind != "" && claims.TokenKind != authcontract.TokenKindUser {
		return nil, errors.New("token is not a user token")
	}

	if claims.UserID == 0 {
		return nil, errors.New("user_id is missing in token")
	}

	return claims, nil
}

func parseAndValidateAdminToken(tokenString string, jwtSecret []byte) (*AdminJWTClaims, error) {
	claims := &AdminJWTClaims{}
	if err := parseTokenClaims(tokenString, claims, jwtSecret); err != nil {
		return nil, err
	}

	if claims.TokenKind != authcontract.TokenKindAdmin {
		return nil, errors.New("token is not an admin token")
	}

	if claims.AdminID == 0 {
		return nil, errors.New("admin_id is missing in token")
	}

	return claims, nil
}

func parseTokenClaims(tokenString string, claims jwt.Claims, jwtSecret []byte) error {
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return errors.New("token has expired")
		}
		return fmt.Errorf("invalid token: %w", err)
	}

	if !token.Valid {
		return errors.New("token is invalid")
	}

	return nil
}

// AuthMiddlewareInitializer 实现普通用户中间件初始化器。
type AuthMiddlewareInitializer struct {
	AuthService authcontract.AuthService
}

// AdminAuthMiddlewareInitializer 实现管理后台中间件初始化器。
type AdminAuthMiddlewareInitializer struct {
	AuthService authcontract.AuthService
}

// NewAuthMiddlewareInitializer 创建普通用户中间件初始化器。
func NewAuthMiddlewareInitializer(authService authcontract.AuthService) middlewares.MiddlewareInitializer {
	return &AuthMiddlewareInitializer{AuthService: authService}
}

// NewAdminAuthMiddlewareInitializer 创建管理后台中间件初始化器。
func NewAdminAuthMiddlewareInitializer(authService authcontract.AuthService) middlewares.MiddlewareInitializer {
	return &AdminAuthMiddlewareInitializer{AuthService: authService}
}

// Init 创建并返回普通用户认证中间件实例。
func (i *AuthMiddlewareInitializer) Init() (middlewares.Middleware, error) {
	return NewAuthMiddleware(i.AuthService), nil
}

// Init 创建并返回管理后台认证中间件实例。
func (i *AdminAuthMiddlewareInitializer) Init() (middlewares.Middleware, error) {
	return NewAdminAuthMiddleware(i.AuthService), nil
}

func init() {
	container.Container.Provide(NewAuthMiddlewareInitializer, dig.As(new(middlewares.MiddlewareInitializer)), dig.Group("middleware_initializers"))
	container.Container.Provide(NewAdminAuthMiddlewareInitializer, dig.As(new(middlewares.MiddlewareInitializer)), dig.Group("middleware_initializers"))
}
