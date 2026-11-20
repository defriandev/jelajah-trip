package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/xuri/excelize/v2"
)

func (u *tripUsecase) ExportExcel(ctx context.Context) ([]byte, string, error) {
	trips, err := u.tripRepo.GetAllForExport(ctx)
	if err != nil {
		return nil, "", fmt.Errorf("gagal mengambil data paket wisata: %w", err)
	}

	f := excelize.NewFile()
	defer func() {
		_ = f.Close()
	}()

	sheetName := "Daftar Paket Wisata"
	f.SetSheetName("Sheet1", sheetName)

	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		loc = time.FixedZone("WIB", 7*3600)
	}
	nowWIB := time.Now().In(loc).Format("02/01/2006 15:04:05 WIB")

	// 1. Gaya Judul Header Utama
	titleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 14, Color: "FFFFFF", Family: "Segoe UI"},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"0F4C3A"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	if err != nil {
		return nil, "", err
	}

	subtitleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Italic: true, Size: 9, Color: "4A5550", Family: "Segoe UI"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 10, Color: "14211D", Family: "Segoe UI"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"EBF4F0"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "top", Color: "C5DFD6", Style: 1},
			{Type: "bottom", Color: "C5DFD6", Style: 2},
			{Type: "left", Color: "C5DFD6", Style: 1},
			{Type: "right", Color: "C5DFD6", Style: 1},
		},
	})

	borderData := []excelize.Border{
		{Type: "top", Color: "E6E4DD", Style: 1},
		{Type: "bottom", Color: "E6E4DD", Style: 1},
		{Type: "left", Color: "E6E4DD", Style: 1},
		{Type: "right", Color: "E6E4DD", Style: 1},
	}

	cellCenterStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 9.5, Family: "Segoe UI", Color: "14211D"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderData,
	})

	cellLeftStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 9.5, Family: "Segoe UI", Color: "14211D"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
		Border:    borderData,
	})

	currencyFormat := `Rp #,##0`
	cellCurrencyStyle, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Size: 9.5, Family: "Segoe UI", Bold: true, Color: "14211D"},
		Alignment:    &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		CustomNumFmt: &currencyFormat,
		Border:       borderData,
	})

	// Header Banner
	_ = f.MergeCell(sheetName, "A1", "H1")
	_ = f.SetCellValue(sheetName, "A1", "KATALOG PAKET WISATA - JELAJAH TRIP")
	_ = f.SetCellStyle(sheetName, "A1", "H1", titleStyle)
	_ = f.SetRowHeight(sheetName, 1, 34)

	_ = f.MergeCell(sheetName, "A2", "H2")
	_ = f.SetCellValue(sheetName, "A2", fmt.Sprintf("Waktu Unduh: %s  |  Total: %d Paket Wisata", nowWIB, len(trips)))
	_ = f.SetCellStyle(sheetName, "A2", "H2", subtitleStyle)
	_ = f.SetRowHeight(sheetName, 2, 20)

	_ = f.SetRowHeight(sheetName, 3, 10)

	headers := []string{"No.", "ID Paket", "Nama Paket Wisata", "Destinasi", "Durasi", "Kuota", "Harga / Pax", "Status"}
	cols := []string{"A", "B", "C", "D", "E", "F", "G", "H"}
	for i, h := range headers {
		cell := fmt.Sprintf("%s4", cols[i])
		_ = f.SetCellValue(sheetName, cell, h)
		_ = f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}
	_ = f.SetRowHeight(sheetName, 4, 26)

	startRow := 5
	for idx, t := range trips {
		row := startRow + idx
		status := "Aktif"
		if t.DeletedAt.Valid {
			status = "Diarsipkan"
		}

		_ = f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), idx+1)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), t.ID.String())
		_ = f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), t.Title)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), t.Destination)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), t.Duration)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), t.Quota)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), t.Price)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), status)

		_ = f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), cellLeftStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), cellLeftStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("E%d", row), fmt.Sprintf("E%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("F%d", row), fmt.Sprintf("F%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), cellCurrencyStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("H%d", row), fmt.Sprintf("H%d", row), cellCenterStyle)

		_ = f.SetRowHeight(sheetName, row, 22)
	}

	colWidths := map[string]float64{
		"A": 7,   // No
		"B": 38,  // ID
		"C": 32,  // Judul
		"D": 20,  // Destinasi
		"E": 14,  // Durasi
		"F": 12,  // Kuota
		"G": 20,  // Harga
		"H": 16,  // Status
	}
	for col, width := range colWidths {
		_ = f.SetColWidth(sheetName, col, col, width)
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, "", fmt.Errorf("gagal merender file excel: %w", err)
	}

	filename := fmt.Sprintf("katalog-paket-wisata-%s.xlsx", time.Now().Format("20060102-150405"))
	return buf.Bytes(), filename, nil
}
