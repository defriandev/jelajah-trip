/**
 * Format standar nomor ponsel Indonesia (selaras dengan backend domain.IndonesianPhoneRegex):
 * Dimulai dengan prefix (+62, 62, atau 0), diikuti angka 8, lalu 1 digit bukan nol (1-9),
 * dan 7 hingga 11 digit angka berikutnya (panjang 10 s/d 14 digit).
 */
export const INDONESIAN_PHONE_REGEX = /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/;

/**
 * Validasi nomor ponsel Indonesia setelah menghapus spasi dan tanda minus
 * @param {string} phone
 * @returns {boolean}
 */
export const validateIndonesianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const sanitized = phone.replace(/[\s-]/g, '');
  return INDONESIAN_PHONE_REGEX.test(sanitized);
};
