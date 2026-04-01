// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: client/src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// Auto-attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("stc_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

// Auto-redirect on 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("stc_token");
      localStorage.removeItem("stc_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;


// ─────────────────────────────────────────────────────────────────────────────
// FILE 2: client/src/services/authService.js
// ─────────────────────────────────────────────────────────────────────────────
// import API from "./api";
//
// export const registerUser = (data) =>
//   API.post("/api/auth/register", data);
//
// export const loginUser = (email, password) =>
//   API.post("/api/auth/login", { email, password });


// ─────────────────────────────────────────────────────────────────────────────
// FILE 3: client/src/services/dashboardService.js   ← CREATE THIS NEW FILE
// ─────────────────────────────────────────────────────────────────────────────
// import API from "./api";
//
// // For admin
// export const getAdminStats          = () => API.get("/api/dashboard/stats");
// export const getRecentTransactions  = () => API.get("/api/dashboard/recent-transactions");
//
// // For user dashboard
// export const getUserStats           = () => API.get("/api/dashboard/user-stats");


// ─────────────────────────────────────────────────────────────────────────────
// FILE 4: client/src/services/paymentService.js   ← CREATE THIS NEW FILE
// ─────────────────────────────────────────────────────────────────────────────
// import API from "./api";
//
// // User
// export const getMyInstallments = () =>
//   API.get("/api/payments/my-installments");
//
// export const getPaymentHistory = () =>
//   API.get("/api/payments/history");
//
// export const payInstallment = (installmentId, paymentMode, referenceNumber) =>
//   API.post("/api/payments/pay", { installmentId, paymentMode, referenceNumber });
//
// // Admin
// export const getDefaulters = () =>
//   API.get("/api/payments/admin/defaulters");
//
// export const adminRecordPayment = (data) =>
//   API.post("/api/payments/admin/record", data);


// ─────────────────────────────────────────────────────────────────────────────
// FILE 5: client/src/services/chitService.js   ← CREATE THIS NEW FILE
// ─────────────────────────────────────────────────────────────────────────────
// import API from "./api";
//
// export const getPlans  = () => API.get("/api/chits/plans");
// export const getGroups = () => API.get("/api/chits/groups");
// export const joinGroup = (groupId) =>
//   API.post(`/api/chits/groups/${groupId}/join`);
//
// // Admin only
// export const createGroup = (data) => API.post("/api/chits/groups", data);