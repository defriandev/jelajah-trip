package usecase

import (
	"context"
	"fmt"
	"jelajah-trip-backend/internal/domain"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

// GetAllForExport mengambil daftar booking untuk export
func (u *bookingUsecase) GetAllForExport(ctx context.Context, filter domain.BookingFilter) ([]domain.Booking, error) {
	return u.bookingRepo.GetAllForExport(ctx, filter)
}

// ExportExcel mengekspor data pemesanan ke dalam file Excel (.xlsx) dengan styling profesional
func (u *bookingUsecase) ExportExcel(ctx context.Context, filter domain.BookingFilter) ([]byte, string, error) {
	bookings, err := u.bookingRepo.GetAllForExport(ctx, filter)
	if err != nil {
		return nil, "", fmt.Errorf("gagal mengambil data pemesanan: %w", err)
	}

	f := excelize.NewFile()
	defer func() {
		_ = f.Close()
	}()

	sheetName := "Rekap Pemesanan"
	// Ganti Sheet1 default dengan nama sheet kita
	f.SetSheetName("Sheet1", sheetName)

	// Zona waktu WIB (Asia/Jakarta)
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		loc = time.FixedZone("WIB", 7*3600)
	}
	nowWIB := time.Now().In(loc).Format("02/01/2006 15:04:05 WIB")

	// 1. Gaya Judul Header Utama (Brand Deep Green #0F4C3A)
	titleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:   true,
			Size:   14,
			Color:  "FFFFFF",
			Family: "Segoe UI",
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"0F4C3A"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	if err != nil {
		return nil, "", err
	}

	// 2. Gaya Subjudul Metadata
	subtitleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Italic: true,
			Size:   9,
			Color:  "4A5550",
			Family: "Segoe UI",
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	if err != nil {
		return nil, "", err
	}

	// 3. Gaya Table Header Kolom (#EBF4F0)
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:   true,
			Size:   10,
			Color:  "14211D",
			Family: "Segoe UI",
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"EBF4F0"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
			WrapText:   true,
		},
		Border: []excelize.Border{
			{Type: "top", Color: "C5DFD6", Style: 1},
			{Type: "bottom", Color: "C5DFD6", Style: 2},
			{Type: "left", Color: "C5DFD6", Style: 1},
			{Type: "right", Color: "C5DFD6", Style: 1},
		},
	})
	if err != nil {
		return nil, "", err
	}

	// 4. Gaya Cell Data (General, Left, Center, Right, Currency)
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

	cellCodeStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 9.5, Family: "Consolas", Bold: true, Color: "0F4C3A"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderData,
	})

	currencyFormat := `Rp #,##0`
	cellCurrencyStyle, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Size: 9.5, Family: "Segoe UI", Bold: true, Color: "14211D"},
		Alignment:    &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		CustomNumFmt: &currencyFormat,
		Border:       borderData,
	})

	// 5. Gaya Baris Total
	totalLabelStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 10, Bold: true, Family: "Segoe UI", Color: "0F4C3A"},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"EBF4F0"}, Pattern: 1},
		Border: []excelize.Border{
			{Type: "top", Color: "0F4C3A", Style: 1},
			{Type: "bottom", Color: "0F4C3A", Style: 6}, // Double border
		},
	})

	totalCurrencyStyle, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Size: 10, Bold: true, Family: "Segoe UI", Color: "0F4C3A"},
		Alignment:    &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Fill:         excelize.Fill{Type: "pattern", Color: []string{"EBF4F0"}, Pattern: 1},
		CustomNumFmt: &currencyFormat,
		Border: []excelize.Border{
			{Type: "top", Color: "0F4C3A", Style: 1},
			{Type: "bottom", Color: "0F4C3A", Style: 6},
		},
	})

	totalPaxStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 10, Bold: true, Family: "Segoe UI", Color: "0F4C3A"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"EBF4F0"}, Pattern: 1},
		Border: []excelize.Border{
			{Type: "top", Color: "0F4C3A", Style: 1},
			{Type: "bottom", Color: "0F4C3A", Style: 6},
		},
	})

	// ─── Tulis Header & Metadata ───
	_ = f.MergeCell(sheetName, "A1", "L1")
	_ = f.SetCellValue(sheetName, "A1", "LAPORAN DATA PEMESANAN WISATA - JELAJAH TRIP")
	_ = f.SetCellStyle(sheetName, "A1", "L1", titleStyle)
	_ = f.SetRowHeight(sheetName, 1, 34)

	filterStatusText := filter.Status
	if filterStatusText == "" || filterStatusText == "all" {
		filterStatusText = "Semua Status"
	}
	subtitleText := fmt.Sprintf("Waktu Unduh: %s  |  Filter Status: %s  |  Total Data: %d Pesanan", nowWIB, strings.ToUpper(filterStatusText), len(bookings))
	_ = f.MergeCell(sheetName, "A2", "L2")
	_ = f.SetCellValue(sheetName, "A2", subtitleText)
	_ = f.SetCellStyle(sheetName, "A2", "L2", subtitleStyle)
	_ = f.SetRowHeight(sheetName, 2, 20)

	_ = f.SetRowHeight(sheetName, 3, 10) // Spasi kosong

	// ─── Kolom Tabel (Baris 4) ───
	headers := []string{
		"No.",
		"Kode Booking",
		"Waktu Pesan (WIB)",
		"Nama Pelanggan",
		"Email",
		"No. Telepon / WA",
		"Paket Wisata",
		"Tgl Perjalanan",
		"Pax",
		"Total Biaya",
		"Status",
		"Tipe Akun",
	}

	cols := []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"}
	for i, h := range headers {
		cell := fmt.Sprintf("%s4", cols[i])
		_ = f.SetCellValue(sheetName, cell, h)
		_ = f.SetCellStyle(sheetName, cell, cell, headerStyle)
	}
	_ = f.SetRowHeight(sheetName, 4, 26)

	// ─── Tulis Data Baris (Baris 5 dst) ───
	startRow := 5
	for idx, b := range bookings {
		row := startRow + idx
		tripTitle := "-"
		if b.Trip != nil && b.Trip.Title != "" {
			tripTitle = b.Trip.Title
		}

		accountType := "Tamu (Guest)"
		if b.UserID != nil {
			accountType = "Member Terdaftar"
		}

		createdWIB := b.CreatedAt.In(loc).Format("02/01/2006 15:04")

		_ = f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), idx+1)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), b.BookingCode)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), createdWIB)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), b.CustomerName)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), b.CustomerEmail)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), b.CustomerPhone)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), tripTitle)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), b.TravelDate)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("I%d", row), b.Pax)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("J%d", row), b.TotalPrice)
		_ = f.SetCellValue(sheetName, fmt.Sprintf("K%d", row), strings.ToUpper(string(b.Status)))
		_ = f.SetCellValue(sheetName, fmt.Sprintf("L%d", row), accountType)

		_ = f.SetCellStyle(sheetName, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), cellCodeStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), cellLeftStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("E%d", row), fmt.Sprintf("E%d", row), cellLeftStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("F%d", row), fmt.Sprintf("F%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("G%d", row), fmt.Sprintf("G%d", row), cellLeftStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("H%d", row), fmt.Sprintf("H%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("I%d", row), fmt.Sprintf("I%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("J%d", row), fmt.Sprintf("J%d", row), cellCurrencyStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("K%d", row), fmt.Sprintf("K%d", row), cellCenterStyle)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("L%d", row), fmt.Sprintf("L%d", row), cellCenterStyle)

		_ = f.SetRowHeight(sheetName, row, 22)
	}

	// ─── Baris Total ───
	totalRow := startRow + len(bookings)
	if len(bookings) > 0 {
		_ = f.MergeCell(sheetName, fmt.Sprintf("A%d", totalRow), fmt.Sprintf("H%d", totalRow))
		_ = f.SetCellValue(sheetName, fmt.Sprintf("A%d", totalRow), "TOTAL KESELURUHAN")
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("A%d", totalRow), fmt.Sprintf("H%d", totalRow), totalLabelStyle)

		paxFormula := fmt.Sprintf("=SUM(I%d:I%d)", startRow, totalRow-1)
		_ = f.SetCellFormula(sheetName, fmt.Sprintf("I%d", totalRow), paxFormula)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("I%d", totalRow), fmt.Sprintf("I%d", totalRow), totalPaxStyle)

		revenueFormula := fmt.Sprintf("=SUM(J%d:J%d)", startRow, totalRow-1)
		_ = f.SetCellFormula(sheetName, fmt.Sprintf("J%d", totalRow), revenueFormula)
		_ = f.SetCellStyle(sheetName, fmt.Sprintf("J%d", totalRow), fmt.Sprintf("J%d", totalRow), totalCurrencyStyle)

		_ = f.SetCellStyle(sheetName, fmt.Sprintf("K%d", totalRow), fmt.Sprintf("L%d", totalRow), totalLabelStyle)
		_ = f.SetRowHeight(sheetName, totalRow, 25)
	}

	// ─── Set Lebar Kolom yang Pas (Auto-width) ───
	colWidths := map[string]float64{
		"A": 7,   // No
		"B": 24,  // Kode Booking
		"C": 19,  // Waktu Pesan
		"D": 22,  // Nama Pelanggan
		"E": 26,  // Email
		"F": 18,  // No Telepon
		"G": 28,  // Paket Wisata
		"H": 16,  // Tgl Perjalanan
		"I": 10,  // Pax
		"J": 20,  // Total Biaya
		"K": 16,  // Status
		"L": 18,  // Tipe Akun
	}
	for col, width := range colWidths {
		_ = f.SetColWidth(sheetName, col, col, width)
	}

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, "", fmt.Errorf("gagal merender file excel: %w", err)
	}

	filename := fmt.Sprintf("rekap-pemesanan-jelajah-trip-%s.xlsx", time.Now().Format("20060102-150405"))
	return buf.Bytes(), filename, nil
}
