import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variabel single-flight promise untuk sinkronisasi pembaruan token paralel
let refreshPromise = null;

// Helper ekstraksi pesan error seragam dari respon backend (Fase 2.5)
const extractErrorMessage = (data) => {
  if (!data) return null;
  if (typeof data.error === 'object' && data.error !== null) {
    if (data.error.message) {
      if (Array.isArray(data.error.details) && data.error.details.length > 0) {
        return `${data.error.message}: ${data.error.details.map((d) => d.message).join(', ')}`;
      }
      return data.error.message;
    }
    return JSON.stringify(data.error);
  }
  if (typeof data.error === 'string') return data.error;
  if (typeof data.message === 'string') return data.message;
  return null;
};

// Response interceptor untuk auto-refresh session saat access token kedaluwarsa
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // (a) Jangan retry/refresh untuk request ke /auth/refresh, /auth/login, dan endpoint auth lain
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/register');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      // (b) Single-flight refresh promise: pastikan request 401 paralel menunggu satu refresh yang sama
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          .then((res) => {
            refreshPromise = null;
            return res.data;
          })
          .catch((refreshErr) => {
            refreshPromise = null;
            // Jika refresh gagal, bersihkan state user dan arahkan ke login
            localStorage.removeItem('jelajah_user');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshErr);
          });
      }

      return refreshPromise
        .then(() => api(originalRequest))
        .catch((err) => {
          const message =
            extractErrorMessage(err.response?.data) ||
            err.message ||
            'Sesi telah berakhir, silakan login kembali';
          return Promise.reject(new Error(message));
        });
    }

    const message =
      extractErrorMessage(error.response?.data) ||
      error.message ||
      'Terjadi kesalahan sistem';
    return Promise.reject(new Error(message));
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

export const tripService = {
  getTrips: (params) => api.get('/trips', { params }),
  getDestinations: () => api.get('/trips/destinations'),
  getTripByID: (id) => api.get(`/trips/${id}`),
  createTrip: (data) => api.post('/trips', data),
  updateTrip: (id, data) => api.put(`/trips/${id}`, data),
  deleteTrip: (id) => api.delete(`/trips/${id}`),
  exportExcel: () =>
    api.get('/trips/export/excel', {
      responseType: 'blob',
    }),
};

export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  trackBooking: (code, verification) =>
    api.get('/bookings/track', {
      params: {
        code,
        verification,
      },
    }),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getAllBookings: (params) => api.get('/bookings', { params }),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  getStats: () => api.get('/bookings/admin/stats'),
  exportExcel: (params) =>
    api.get('/bookings/export/excel', {
      params,
      responseType: 'blob',
    }),
};

// Helper pemicu unduh berkas di browser
export function triggerFileDownload(blobData, defaultFilename = 'laporan.xlsx') {
  const blob = new Blob([blobData], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', defaultFilename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const reviewService = {
  getReviewsByTrip: (tripId, params) => api.get(`/reviews/trip/${tripId}`, { params }),
  createReview: (data) => api.post('/reviews', data),
  getAllReviews: (params) => api.get('/reviews', { params }),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

export const faqService = {
  getFAQs: (params) => api.get('/faqs', { params }),
  createFAQ: (data) => api.post('/faqs', data),
  deleteFAQ: (id) => api.delete(`/faqs/${id}`),
};

export default api;
