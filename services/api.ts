import axios from "axios";
import { router } from "expo-router";
import { clearAuth, getToken } from "./auth";

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Token usado na requisição:', token);
  console.log('Header Authorization:', config.headers.Authorization);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await clearAuth();
      router.replace("/(tabs)/login");
    }
    return Promise.reject(error);
  }
);

export { api };

