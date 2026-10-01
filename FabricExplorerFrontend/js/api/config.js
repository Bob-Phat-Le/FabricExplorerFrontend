// Cấu hình tầng API. Đổi useMock -> false khi backend sẵn sàng.
export const API_CONFIG = {
    baseUrl: 'http://localhost:8080/api',        // prefix của backend
    useMock: false,             // true: dùng js/mocks/handlers.js, không gọi mạng
    mockLatencyMs: 300,
    timeoutMs: 30000,
    /** Trả về headers xác thực (vd. { Authorization: `Bearer ${token}` }). */
    getAuthHeaders: () => ({}),
};
