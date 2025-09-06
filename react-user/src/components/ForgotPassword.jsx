import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../axiosClient";
import Logo from "../assets/jusfabel-logo.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const response = await axiosClient.post(
        "http://localhost:5000/api/auth/forgotpassword", // Gunakan axiosClient tanpa hardcode URL
        {
          email: email,
        }
      );

      if (response.data.success) {
        setSuccessMessage(
          "Email terdaftar! Kode reset password telah dikirim ke email Anda."
        );

        // Store email in sessionStorage for the reset page
        sessionStorage.setItem("resetPasswordEmail", email);

        // Store the reset code/token if it's provided in the response
        // Cek berbagai kemungkinan nama field dari API response
        if (response.data.resetCode) {
          sessionStorage.setItem("resetCode", response.data.resetCode);
        } else if (response.data.resetToken) {
          sessionStorage.setItem("resetCode", response.data.resetToken);
        } else if (response.data.token) {
          sessionStorage.setItem("resetCode", response.data.token);
        }

        // Redirect to reset password page
        setTimeout(() => {
          navigate("/reset-password");
        }, 1000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Email tidak ditemukan. Silakan coba lagi."
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
          Lupa Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Masukkan alamat email Anda untuk reset password
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
                Anda akan dialihkan ke halaman reset password dalam beberapa
                detik...
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900"
            >
              Email
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? "Memproses..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
