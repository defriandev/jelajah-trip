# Makefile untuk Jelajah Trip Backend

.PHONY: help migrate-up migrate-down migrate-version test run build

help:
	@echo "Perintah yang tersedia:"
	@echo "  make migrate-up       Jalankan migrasi database ke versi terbaru"
	@echo "  make migrate-down     Rollback seluruh migrasi database"
	@echo "  make migrate-version  Tampilkan versi migrasi aktif"
	@echo "  make run              Jalankan server backend"
	@echo "  make test             Jalankan seluruh automated test"
	@echo "  make build            Build server.exe dan binary CLI"

migrate-up:
	go run ./cmd/migrate up

migrate-down:
	go run ./cmd/migrate down

migrate-version:
	go run ./cmd/migrate version

run:
	go run ./cmd/server

test:
	go test -v ./test/...

build:
	go build -o server.exe ./cmd/server
	go build -o createadmin.exe ./cmd/createadmin
	go build -o migrate.exe ./cmd/migrate
