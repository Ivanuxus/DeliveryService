import axios from "axios";

// Функция для обновления токена
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    console.error("Ошибка: отсутствует refreshToken");
    return false;
  }

  try {
    console.log("Попытка обновления токена с refreshToken:", refreshToken);
    const response = await axios.post(
      "http://127.0.0.1:8000/api/token/refresh/",
      {
        refresh: refreshToken,
      }
    );
    console.log("Обновленный токен:", response.data.access);
    localStorage.setItem("accessToken", response.data.access);
    return true;
  } catch (err) {
    console.error(
      "Ошибка обновления токена:",
      err.response?.data || err.message
    );
    return false;
  }
};

// Создаём экземпляр Axios
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Интерсептор запросов
apiClient.interceptors.request.use((config) => {
  console.log("Making request:", {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
  });

  // Don't add Authorization header for login and refresh token requests
  if (!config.url.includes("login") && !config.url.includes("token/refresh")) {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  // Don't stringify data if it's already a string
  if (config.data && typeof config.data === "object") {
    config.data = JSON.stringify(config.data);
  }

  return config;
});

// Интерсептор ответов
apiClient.interceptors.response.use(
  (response) => {
    console.log("Received response:", {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    console.error("Request failed:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const success = await refreshAccessToken();
      if (success) {
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${localStorage.getItem("accessToken")}`;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
