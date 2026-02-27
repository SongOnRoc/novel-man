package drafts

import "errors"

// ErrAssociatedWorkNotFound indicates the work referenced by a draft does not exist
// (including the case where it has been soft-deleted).
var ErrAssociatedWorkNotFound = errors.New("associated work not found")
