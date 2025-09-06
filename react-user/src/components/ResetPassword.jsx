import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axiosClient";
import Logo from "../assets/jusfabel-logo.png";

function ResetPassword() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { resettoken } = useParams(); // Get reset token from URL params

  useEffect(() => {
    // Check if reset token exists in URL params or sessionStorage
    const sessionResetCode = sessionStorage.getItem("resetCode");
    const sessionResetToken = sessionStorage.getItem("resetToken");

    if (!resettoken && !sessionResetCode && !sessionResetToken) {
      navigate("/forgot-password");
      return;
    }
  }, [navigate, resettoken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePasswords = () => {
    if (formData.password.length < 6) {
      setError("Password harus minimal 6 karakter");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!validatePasswords()) {
      setIsLoading(false);
      return;
    }

    try {
      // Use reset token from URL params or sessionStorage (prioritize resetCode from forgot password)
      const token =
        resettoken ||
        sessionStorage.getItem("resetCode") ||
        sessionStorage.getItem("resetToken");

      if (!token) {
        setError("Token reset tidak valid. Silakan minta reset password baru.");
        setIsLoading(false);
        return;
      }

      const response = await axiosClient.put(
        `http://localhost:5000/api/auth/resetpassword/${token}`,
        {
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }
      );

      if (response.data.success) {
        setSuccessMessage("Password berhasil diubah!");

        // Clear all stored data from sessionStorage
        sessionStorage.removeItem("resetPasswordEmail");
        sessionStorage.removeItem("resetToken");
        sessionStorage.removeItem("resetCode");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="absolute top-4 left-4">
        <Link
          to="/login"
          className="text-indigo-600 hover:text-indigo-500 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          <span className="text-sm font-semibold">Kembali ke Login</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img alt="Your Company" src={Logo} className="mx-auto h-30 w-28" />
        <h2 className="mt-3 text-center text-2xl font-bold tracking-tight text-gray-900">
          Set Password Baru
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Masukkan password baru Anda
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          {successMessage && (
            <div className="text-green-500 text-sm text-center">
              {successMessage}
              <p className="mt-2 text-xs">
                Anda akan dialihkan ke halaman login dalam beberapa detik...
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-900"
            >
              Password Baru
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-900"
            >
              Konfirmasi Password
            </label>
            <div className="mt-2">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex w-full justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                isLoading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              {isLoading ? "Memproses..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
