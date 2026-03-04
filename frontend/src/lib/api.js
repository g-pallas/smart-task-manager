import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: "application/json" },
});

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default api;
