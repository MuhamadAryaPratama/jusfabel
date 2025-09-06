import axios from "axios";

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 7000,
});

axiosClient.interceptors.request.use((config) => {
  const publicEndpoints = [
    "/admin/auth/login",
    "/admin/auth/register",
    "/admin/auth/forgot-password",
    "/admin/auth/reset-password",
  ];

  // Check if the current request is to a public endpoint
  const isPublicEndpoint = publicEndpoints.some((endpoint) =>
    config.url.includes(endpoint)
  );

  // Always add token for non-public endpoints, including admin endpoints
  if (!isPublicEndpoint) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      console.error("Network Error: Please check your internet connection");
      return Promise.reject(new Error("Network Error"));
    }

    const originalRequest = error.config;

    // Handle 401 errors with token refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      const token = localStorage.getItem("access_token");

      if (token) {
        try {
          originalRequest._retry = true;

          // Try to refresh the token
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
            null,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          const newToken = response.data.access_token;
          localStorage.setItem("access_token", newToken);

          // Update the authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request
          return axiosClient(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);

          // If refresh fails, clear the token and redirect to login
          localStorage.removeItem("access_token");

          // Only redirect if we're not already on the login page
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }

          return Promise.reject(refreshError);
        }
      } else {
        // No token available, redirect to login
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
