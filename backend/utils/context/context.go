package context

import (
	"context"
	"fmt"
	"time"
)

type traceIDKey struct{}

// ContextWrapper 是对标准 context.Context 的封装
// 以确保 traceID 始终存在。
type Context struct {
	context.Context
}

// NewTraceID 生成一个新的唯一 trace_id。
func NewTraceID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// New 创建一个新的 ContextWrapper。
// 如果提供了父上下文，它将被用作基础。否则，将创建一个新的后台上下文。
// 在任何情况下，都会注入一个新的 traceID。
func New(parent ...context.Context) *Context {
	var pctx context.Context
	if len(parent) > 0 && parent[0] != nil {
		pctx = parent[0]
	} else {
		pctx = context.Background()
	}

	// 注入一个新的 traceID，覆盖任何现有的。
	traceID := NewTraceID()
	ctx := context.WithValue(pctx, traceIDKey{}, traceID)

	return &Context{Context: ctx}
}

// TraceID 从上下文中提取 trace_id。
// 如果未找到 trace_id，则返回一个空字符串。
func (c *Context) TraceID() string {
	val := c.Value(traceIDKey{})
	if val == nil {
		return ""
	}
	id, _ := val.(string)
	return id
}

// WithValue 返回带有给定键值对的上下文副本。
func (c *Context) WithValue(key, value interface{}) *Context {
	return &Context{Context: context.WithValue(c.Context, key, value)}
}

// WithCancel 返回上下文的副本和取消函数。
func (c *Context) WithCancel() (*Context, context.CancelFunc) {
	ctx, cancel := context.WithCancel(c.Context)
	return &Context{Context: ctx}, cancel
}

// WithDeadline 返回带有截止日期的上下文副本。
func (c *Context) WithDeadline(d time.Time) (*Context, context.CancelFunc) {
	ctx, cancel := context.WithDeadline(c.Context, d)
	return &Context{Context: ctx}, cancel
}

// WithTimeout 返回带有超时的上下文副本。
func (c *Context) WithTimeout(timeout time.Duration) (*Context, context.CancelFunc) {
	ctx, cancel := context.WithTimeout(c.Context, timeout)
	return &Context{Context: ctx}, cancel
}
