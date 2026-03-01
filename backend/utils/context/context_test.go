package context

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestNewTraceID(t *testing.T) {
	traceID1 := NewTraceID()
	assert.NotEmpty(t, traceID1)

	// 为了确保唯一性，稍微等待一下
	time.Sleep(1 * time.Nanosecond)

	traceID2 := NewTraceID()
	assert.NotEmpty(t, traceID2)
	assert.NotEqual(t, traceID1, traceID2)
}

func TestNew(t *testing.T) {
	t.Run("without parent", func(t *testing.T) {
		cw := New()
		assert.NotNil(t, cw)
		assert.NotNil(t, cw.Context)
		assert.NotEmpty(t, cw.TraceID())
	})

	t.Run("with parent", func(t *testing.T) {
		parentCtx := context.WithValue(context.Background(), "testKey", "testValue")
		cw := New(parentCtx)
		assert.NotNil(t, cw)
		assert.NotNil(t, cw.Context)
		assert.NotEmpty(t, cw.TraceID())

		// 检查父上下文的值是否存在
		val := cw.Value("testKey")
		assert.Equal(t, "testValue", val)
	})

	t.Run("with nil parent", func(t *testing.T) {
		cw := New(nil)
		assert.NotNil(t, cw)
		assert.NotNil(t, cw.Context)
		assert.NotEmpty(t, cw.TraceID())
	})
}

func TestContext_TraceID(t *testing.T) {
	t.Run("found", func(t *testing.T) {
		cw := New()
		traceID := cw.TraceID()
		assert.NotEmpty(t, traceID)
	})

	t.Run("not found", func(t *testing.T) {
		// 创建一个没有 traceIDKey 的 Context
		cw := &Context{Context: context.Background()}
		traceID := cw.TraceID()
		assert.Empty(t, traceID)
	})
}

func TestContext_WithValue(t *testing.T) {
	cw := New()
	key := "myKey"
	value := "myValue"

	cwWithValue := cw.WithValue(key, value)

	// 确保返回的是一个新的 Context 实例
	assert.NotSame(t, cw, cwWithValue)
	assert.NotEqual(t, cw, cwWithValue)

	// 检查新上下文中是否存在该值
	retrievedValue := cwWithValue.Value(key)
	assert.Equal(t, value, retrievedValue)

	// 确保原始上下文没有被修改
	originalValue := cw.Value(key)
	assert.Nil(t, originalValue)

	// 确保 traceID 仍然存在
	assert.NotEmpty(t, cwWithValue.TraceID())
}

func TestContext_WithCancel(t *testing.T) {
	cw := New()
	cwWithCancel, cancel := cw.WithCancel()

	assert.NotNil(t, cwWithCancel)
	assert.NotNil(t, cancel)
	assert.NotSame(t, cw, cwWithCancel)

	// 检查 traceID
	assert.Equal(t, cw.TraceID(), cwWithCancel.TraceID())

	// 测试取消
	cancel()
	select {
	case <-cwWithCancel.Done():
		// 期望被取消
	default:
		t.Error("context should have been canceled")
	}
}

func TestContext_WithDeadline(t *testing.T) {
	cw := New()
	deadline := time.Now().Add(100 * time.Millisecond)
	cwWithDeadline, cancel := cw.WithDeadline(deadline)
	defer cancel()

	assert.NotNil(t, cwWithDeadline)
	assert.NotNil(t, cancel)
	assert.NotSame(t, cw, cwWithDeadline)

	// 检查 traceID
	assert.Equal(t, cw.TraceID(), cwWithDeadline.TraceID())

	// 检查截止日期
	d, ok := cwWithDeadline.Deadline()
	assert.True(t, ok)
	assert.WithinDuration(t, deadline, d, time.Millisecond)

	// 测试超时
	time.Sleep(150 * time.Millisecond)
	select {
	case <-cwWithDeadline.Done():
		// 期望超时
	default:
		t.Error("context should have timed out")
	}
}

func TestContext_WithTimeout(t *testing.T) {
	cw := New()
	timeout := 50 * time.Millisecond
	cwWithTimeout, cancel := cw.WithTimeout(timeout)
	defer cancel()

	assert.NotNil(t, cwWithTimeout)
	assert.NotNil(t, cancel)
	assert.NotSame(t, cw, cwWithTimeout)

	// 检查 traceID
	assert.Equal(t, cw.TraceID(), cwWithTimeout.TraceID())

	// 检查截止日期
	_, ok := cwWithTimeout.Deadline()
	assert.True(t, ok)

	// 测试超时
	time.Sleep(100 * time.Millisecond)
	select {
	case <-cwWithTimeout.Done():
		// 期望超时
	default:
		t.Error("context should have timed out")
	}
}
