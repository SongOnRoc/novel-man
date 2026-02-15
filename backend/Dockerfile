# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev

WORKDIR /app

# Copy all source code (including local replace dependencies)
COPY . .

# Download dependencies
RUN go mod download

# Build the binary (CGO required for go-sqlite3)
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o /novel-man-backend .

# Final stage
FROM alpine:3.19

# Install runtime dependencies (sqlite-libs required for go-sqlite3)
RUN apk --no-cache add ca-certificates tzdata sqlite-libs

# Create non-root user
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -D appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /novel-man-backend /app/novel-man-backend

# Copy default config (can be overridden by volume mount)
COPY --from=builder /app/config.example.yaml /app/config.yaml

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

CMD ["/app/novel-man-backend", "api"]
