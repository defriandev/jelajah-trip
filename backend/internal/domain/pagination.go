package domain

import (
	"fmt"
	"strings"
)

// Allowed columns for sorting per entity (Whitelist mencegah SQL Injection)
var allowedTripSortColumns = map[string]string{
	"created_at":  "created_at",
	"price":       "price",
	"title":       "title",
	"destination": "destination",
	"quota":       "quota",
}

var allowedBookingSortColumns = map[string]string{
	"created_at":    "created_at",
	"travel_date":   "travel_date",
	"total_price":   "total_price",
	"status":        "status",
	"customer_name": "customer_name",
	"pax":           "pax",
}

var allowedReviewSortColumns = map[string]string{
	"created_at": "created_at",
	"rating":     "rating",
}

// SanitizePagination memvalidasi page, limit, dan mapping whitelist sorting
func SanitizePagination(p *PaginationParams, defaultLimit int, allowedColumns map[string]string, defaultSort, defaultOrder string) (int, int, string, error) {
	if defaultLimit <= 0 {
		defaultLimit = 12
	}

	page := p.Page
	if page < 1 {
		page = 1
	}

	limit := p.Limit
	if limit < 1 {
		limit = defaultLimit
	} else if limit > 100 {
		limit = 100
	}

	order := strings.ToLower(strings.TrimSpace(p.Order))
	if order != "asc" && order != "desc" {
		if defaultOrder != "" {
			order = strings.ToLower(defaultOrder)
		} else {
			order = "desc"
		}
	}

	sortRaw := strings.ToLower(strings.TrimSpace(p.Sort))
	if sortRaw == "" {
		sortRaw = defaultSort
	}

	col, ok := allowedColumns[sortRaw]
	if !ok {
		return 0, 0, "", NewValidationError(fmt.Sprintf("kolom pengurutan (sort) '%s' tidak diizinkan", sortRaw), []ErrorDetail{
			{Field: "sort", Message: fmt.Sprintf("kolom sort harus salah satu dari: %s", getMapKeys(allowedColumns))},
		})
	}

	orderClause := fmt.Sprintf("%s %s", col, strings.ToUpper(order))
	return page, limit, orderClause, nil
}

func getMapKeys(m map[string]string) string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return strings.Join(keys, ", ")
}

func GetAllowedTripSortColumns() map[string]string {
	return allowedTripSortColumns
}

func GetAllowedBookingSortColumns() map[string]string {
	return allowedBookingSortColumns
}

func GetAllowedReviewSortColumns() map[string]string {
	return allowedReviewSortColumns
}
