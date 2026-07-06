package auth

import (
	"net/http"
	"strings"

	"novel-man/backend/internal/contracts/auth"
	"novel-man/backend/utils/context"
	"novel-man/backend/utils/response"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	authService auth.AuthService
}

func NewAuthController(authService auth.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type RegisterResponse struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
}

type LoginResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}

type UserProfileResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

type AdminProfileResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

// Register godoc
// @Summary Register a new user
// @Description Register a new user with username, email, and password.
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   user  body      RegisterRequest  true  "User registration info"
// @Success 201   {object}  response.StandardResponse{data=RegisterResponse}
// @Failure 400   {object}  response.StandardResponse "Invalid request body"
// @Failure 409   {object}  response.StandardResponse "Username or email already exists"
// @Failure 500   {object}  response.StandardResponse "Failed to create user"
// @Router /auth/register [post]
func (c *AuthController) Register(ctx *gin.Context) {
	var req RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	user, err := c.authService.Register(*context.New(ctx), req.Username, req.Email, req.Password)
	if err != nil {
		if err == auth.ErrUserAlreadyExists {
			response.Error(ctx, http.StatusConflict, http.StatusConflict, "Username or email already exists", err)
		} else {
			response.Error(ctx, http.StatusInternalServerError, http.StatusInternalServerError, "Failed to create user", err)
		}
		return
	}

	resp := RegisterResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.Format("2006-01-02 15:04:05.999"),
	}
	response.Success(ctx, http.StatusCreated, resp)
}

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

// Login godoc
// @Summary Log in a user
// @Description Log in a user with identifier (username or email) and password
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   user  body      LoginRequest  true  "User login info"
// @Success 200   {object}  response.StandardResponse{data=LoginResponse}
// @Failure 400   {object}  response.StandardResponse "Invalid request body"
// @Failure 401   {object}  response.StandardResponse "Invalid identifier or password"
// @Router /auth/login [post]
func (c *AuthController) Login(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	token, err := c.authService.Login(*context.New(ctx), req.Identifier, req.Password)
	if err != nil {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Invalid identifier or password", err)
		return
	}

	response.Success(ctx, http.StatusOK, LoginResponse{AccessToken: token, TokenType: "Bearer"})
}

// AdminLogin godoc
// @Summary Log in an admin user
// @Description Log in an admin user with identifier (username or email) and password
// @Tags auth
// @Accept  json
// @Produce  json
// @Param   user  body      LoginRequest  true  "Admin login info"
// @Success 200   {object}  response.StandardResponse{data=LoginResponse}
// @Failure 400   {object}  response.StandardResponse "Invalid request body"
// @Failure 401   {object}  response.StandardResponse "Invalid identifier or password"
// @Failure 403   {object}  response.StandardResponse "Admin access denied"
// @Router /auth/admin/login [post]
func (c *AuthController) AdminLogin(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	token, err := c.authService.AdminLogin(*context.New(ctx), req.Identifier, req.Password)
	if err != nil {
		if err == auth.ErrAdminAccessDenied {
			response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Admin access denied", err)
			return
		}
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Invalid identifier or password", err)
		return
	}

	response.Success(ctx, http.StatusOK, LoginResponse{AccessToken: token, TokenType: "Bearer"})
}

// GetCurrentUser godoc
// @Summary Get current user info
// @Description Get the current authenticated user's information
// @Tags auth
// @Security BearerAuth
// @Produce  json
// @Success 200 {object} response.StandardResponse{data=UserProfileResponse}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 404 {object} response.StandardResponse "User not found"
// @Router /auth/me [get]
func (c *AuthController) GetCurrentUser(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "User not authenticated", nil)
		return
	}

	user, err := c.authService.GetCurrentUser(*context.New(ctx), userID.(uint))
	if err != nil {
		response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "User not found", err)
		return
	}

	role := user.Role
	if role == "" {
		role = "user"
	}

	resp := UserProfileResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     role,
	}
	response.Success(ctx, http.StatusOK, resp)
}

// GetCurrentAdmin godoc
// @Summary Get current admin info
// @Description Get the current authenticated admin's information
// @Tags auth
// @Security BearerAuth
// @Produce  json
// @Success 200 {object} response.StandardResponse{data=AdminProfileResponse}
// @Failure 401 {object} response.StandardResponse "Unauthorized"
// @Failure 403 {object} response.StandardResponse "Admin access denied"
// @Failure 404 {object} response.StandardResponse "Admin not found"
// @Router /auth/admin/me [get]
func (c *AuthController) GetCurrentAdmin(ctx *gin.Context) {
	adminID, exists := ctx.Get("adminID")
	if !exists {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Admin not authenticated", nil)
		return
	}

	adminUser, err := c.authService.GetCurrentAdmin(*context.New(ctx), adminID.(uint))
	if err != nil {
		if err == auth.ErrAdminAccessDenied {
			response.Error(ctx, http.StatusForbidden, http.StatusForbidden, "Admin access denied", err)
			return
		}
		response.Error(ctx, http.StatusNotFound, http.StatusNotFound, "Admin not found", err)
		return
	}

	resp := AdminProfileResponse{
		ID:       adminUser.ID,
		Username: adminUser.Username,
		Email:    adminUser.Email,
		Role:     adminUser.Role,
	}
	response.Success(ctx, http.StatusOK, resp)
}

// Logout godoc
// @Summary Log out a user
// @Description Log out the current authenticated user. In a stateless JWT implementation, this is a client-side action.
// @Tags auth
// @Security BearerAuth
// @Produce  json
// @Success 200 {object} response.StandardResponse{data=object{message=string}}
// @Failure 401 {object} response.StandardResponse "Authorization token not provided"
// @Router /auth/logout [post]
func (c *AuthController) Logout(ctx *gin.Context) {
	tokenString := ctx.GetHeader("Authorization")
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")

	if tokenString == "" {
		response.Error(ctx, http.StatusUnauthorized, http.StatusUnauthorized, "Authorization token not provided", nil)
		return
	}

	// In a stateless JWT setup, logout is mainly a client-side task.
	// If a token blacklist is implemented, the service call would be here.
	_ = c.authService.Logout(*context.New(ctx), tokenString)
	// We ignore the error from logout for now as it's a no-op.

	response.Success(ctx, http.StatusOK, gin.H{"message": "Successfully logged out"})
}
