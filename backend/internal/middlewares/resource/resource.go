package resource

import (
	"fmt"
	"net/http"
	"strconv"

	"novel-man/backend/internal/container"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/contracts/characters"
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/contracts/middlewares"
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/contracts/relationships"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/contracts/worldview"

	"github.com/gin-gonic/gin"
	"go.uber.org/dig"
)

// Resource type constants
const (
	WorkResource              = "work"
	ChapterResource           = "chapter"
	CharacterResource         = "character"
	DraftResource             = "draft"
	WorldviewItemResource     = "worldview_item"
	WorldviewCategoryResource = "worldview_category"
	RelationshipResource      = "relationship"
	PromptResource            = "prompt"
)

// AllServices holds all service dependencies required by resource checks.
type AllServices struct {
	WorkService              works.WorkService
	ChapterService           chapters.ChapterService
	CharacterService         characters.CharacterService
	DraftService             drafts.DraftService
	WorldviewItemService     worldview.WorldviewItemService
	WorldviewCategoryService worldview.WorldviewCategoryService
	RelationshipService      relationships.RelationshipService
	PromptService            prompts.PromptService
}

// CheckFunc defines the signature for all resource check operations.
// It returns an HTTP status code and an optional error.
type CheckFunc func(c *gin.Context, s *AllServices, id uint64, userID uint) (int, error)

// --- Generic Wrapper and Module ---

// 确保 resourceMiddlewareWrapper 实现了 Middleware 接口
var _ middlewares.Middleware = (*resourceMiddlewareWrapper)(nil)

// resourceMiddlewareWrapper is a generic wrapper that adapts a CheckFunc to the standard middleware interface.
type resourceMiddlewareWrapper struct {
	name      string
	services  *AllServices
	checkFunc CheckFunc
}

// Name implements the middlewares.Middleware interface.
func (w *resourceMiddlewareWrapper) Name() string {
	return w.name
}

// Handler implements the middlewares.Middleware interface.
func (w *resourceMiddlewareWrapper) Handler() gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		if idStr == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Resource ID is missing in URL path"})
			return
		}
		id, err := strconv.ParseUint(idStr, 10, 64)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid resource ID format"})
			return
		}

		var userID uint
		if userIDInterface, exists := c.Get("userID"); exists {
			if uid, ok := userIDInterface.(uint); ok {
				userID = uid
			}
		}

		statusCode, err := w.checkFunc(c, w.services, id, userID)

		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Error during resource check: " + err.Error()})
			return
		}

		if statusCode != http.StatusOK {
			var message string
			switch statusCode {
			case http.StatusNotFound:
				message = "Resource not found"
			case http.StatusForbidden:
				message = "Permission denied"
			default:
				message = "An unexpected error occurred"
			}
			c.AbortWithStatusJSON(statusCode, gin.H{"error": message})
			return
		}

		c.Next()
	}
}

// ExistenceMiddlewareName returns the name for the existence middleware of a given resource type.
func ExistenceMiddlewareName(resourceType string) string {
	return fmt.Sprintf("existence_%s", resourceType)
}

// OwnershipMiddlewareName returns the name for the ownership middleware of a given resource type.
func OwnershipMiddlewareName(resourceType string) string {
	return fmt.Sprintf("ownership_%s", resourceType)
}

type genericResourceInitializer struct {
	name      string
	services  *AllServices
	checkFunc CheckFunc
}

func (i *genericResourceInitializer) Init() (middlewares.Middleware, error) {
	return &resourceMiddlewareWrapper{
		name:      i.name,
		services:  i.services,
		checkFunc: i.checkFunc,
	}, nil
}

func init() {
	container.Container.Provide(func(
		workService works.WorkService,
		chapterService chapters.ChapterService,
		characterService characters.CharacterService,
		draftService drafts.DraftService,
		worldviewItemService worldview.WorldviewItemService,
		worldviewCategoryService worldview.WorldviewCategoryService,
		relationshipService relationships.RelationshipService,
		promptService prompts.PromptService,
	) *AllServices {
		return &AllServices{
			WorkService:              workService,
			ChapterService:           chapterService,
			CharacterService:         characterService,
			DraftService:             draftService,
			WorldviewItemService:     worldviewItemService,
			WorldviewCategoryService: worldviewCategoryService,
			RelationshipService:      relationshipService,
			PromptService:            promptService,
		}
	})
	container.Container.Provide(NewResourceMiddlewareInitializers, dig.Group("middleware_initializers,flatten"))
}

func NewResourceMiddlewareInitializers(services *AllServices) []middlewares.MiddlewareInitializer {
	checks := map[string]CheckFunc{
		ExistenceMiddlewareName(WorkResource):              checkWorkExistence,
		OwnershipMiddlewareName(WorkResource):              checkWorkOwnership,
		ExistenceMiddlewareName(ChapterResource):           checkChapterExistence,
		OwnershipMiddlewareName(ChapterResource):           checkChapterOwnership,
		ExistenceMiddlewareName(CharacterResource):         checkCharacterExistence,
		OwnershipMiddlewareName(CharacterResource):         checkCharacterOwnership,
		ExistenceMiddlewareName(DraftResource):             checkDraftExistence,
		OwnershipMiddlewareName(DraftResource):             checkDraftOwnership,
		ExistenceMiddlewareName(WorldviewItemResource):     checkWorldviewItemExistence,
		OwnershipMiddlewareName(WorldviewItemResource):     checkWorldviewItemOwnership,
		ExistenceMiddlewareName(WorldviewCategoryResource): checkWorldviewCategoryExistence,
		OwnershipMiddlewareName(WorldviewCategoryResource): checkWorldviewCategoryOwnership,
		ExistenceMiddlewareName(RelationshipResource):      checkRelationshipExistence,
		OwnershipMiddlewareName(RelationshipResource):      checkRelationshipOwnership,
		ExistenceMiddlewareName(PromptResource):            checkPromptExistence,
		OwnershipMiddlewareName(PromptResource):            checkPromptOwnership,
	}

	var initializers []middlewares.MiddlewareInitializer
	for name, checkFunc := range checks {
		initializers = append(initializers, &genericResourceInitializer{
			name:      name,
			services:  services,
			checkFunc: checkFunc,
		})
	}
	return initializers
}
