# Root Makefile Jelajah Trip

.PHONY: migrate-up migrate-down test build-backend build-frontend

migrate-up:
	cd backend && go run ./cmd/migrate up

migrate-down:
	cd backend && go run ./cmd/migrate down

test:
	cd backend && go test -v ./test/...

build-backend:
	cd backend && go build -o server.exe ./cmd/server

build-frontend:
	cd frontend && npm run build
