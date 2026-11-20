package domain

import "regexp"

// IndonesianPhoneRegexPattern mendefinisikan format baku nomor ponsel Indonesia:
// Dimulai dengan prefix (+62, 62, atau 0), diikuti digit '8', lalu 1 digit bukan nol (1-9),
// dan 7 hingga 11 digit angka berikutnya (panjang lokal 10 s/d 14 digit).
const IndonesianPhoneRegexPattern = `^(?:\+62|62|0)8[1-9][0-9]{7,11}$`

// IndonesianPhoneRegex adalah compiled regex instance untuk validasi nomor telepon di seluruh layer aplikasi.
var IndonesianPhoneRegex = regexp.MustCompile(IndonesianPhoneRegexPattern)
