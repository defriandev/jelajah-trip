# Jelajah Trip - Platform Reservasi & Kurasi Perjalanan Nusantara

Platform reservasi perjalanan curated berbasis clean/hexagonal architecture di backend (Go + Fiber) dan modern feature-based di frontend (React 19 + Vite + Tailwind CSS).

---

## Panduan Menjalankan Sistem

### 1. Prasyarat Sistem
- **Go**: v1.26+
- **Node.js**: v20+ & npm
- **PostgreSQL**: v17+ (Database `jelajah_trip`)

---

### 2. Konfigurasi Backend (`backend/.env`)
Salin berkas konfigurasi template:
```bash
cp backend/.env.example backend/.env
```
Pastikan variabel `DATABASE_URL` dan `JWT_SECRET` terisi dengan benar.

---

### 3. Bootstrap Administrator Production (`cmd/createadmin`)

> **Keamanan Kredensial:** Flag `-password` telah dihapus sepenuhnya untuk mencegah kebocoran kata sandi di shell history/process table. Kata sandi wajib diisi melalui environment variable `ADMIN_INITIAL_PASSWORD` atau prompt tersembunyi interaktif (terminal).

#### Opsi A: Menggunakan Prompt Tersembunyi (Interaktif di Terminal)
```bash
cd backend
go run ./cmd/createadmin -name "Super Admin" -email "admin@jelajah.com"
```
Terminal akan meminta kata sandi secara aman tanpa menampilkan karakter ke layar:
```text
Masukkan Kata Sandi Admin (minimal 8 karakter, input tersembunyi): **********
```

#### Opsi B: Menggunakan Environment Variable (CI/CD atau Script Deployment)
**Di Linux/macOS:**
```bash
cd backend
ADMIN_INITIAL_PASSWORD="SuperSecureAdmin2026!" go run ./cmd/createadmin -name "Super Admin" -email "admin@jelajah.com"
```

**Di Windows PowerShell:**
```powershell
cd backend
$env:ADMIN_INITIAL_PASSWORD="SuperSecureAdmin2026!"; .\createadmin.exe -name "Super Admin" -email "admin@jelajah.com"; Remove-Item Env:\ADMIN_INITIAL_PASSWORD
```

---

### 4. Menjalankan Server Backend
```bash
cd backend
go run ./cmd/server
# Server berjalan di http://localhost:8080
```

---

### 5. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend berjalan di http://localhost:5173
```

---

## Fitur Keamanan & Arsitektur
1. **Cookie Session HttpOnly:** Access token dan refresh token disimpan murni di cookie browser (`HttpOnly`, `SameSite=Lax`, `Secure` pada production) dengan `Path=/api/v1/auth` untuk refresh token.
2. **Single-Flight Auto Refresh:** Request 401 paralel menunggu satu refresh promise bersama, mencegah balapan refresh token.
3. **Refresh Token Reuse Detection:** Jika refresh token yang telah dicabut digunakan kembali, sistem otomatis mencabut seluruh sesi aktif pengguna tersebut (RFC 6749 Threat Model).
4. **Validasi Telepon Terpadu:** Standarisasi nomor ponsel Indonesia aktif (`domain.IndonesianPhoneRegex` di backend dan `validateIndonesianPhone` di frontend).
5. **Atomic Booking Quota & State Machine:** Kuota trip diamankan dengan pembaruan atomik dan transaksi database berkunci baris (`FOR UPDATE`).
