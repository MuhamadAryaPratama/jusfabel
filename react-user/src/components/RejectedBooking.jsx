import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axiosClient from "../axiosClient";
import Navbar from "./Navbar";

function RejectedBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axiosClient.get(`/bookings/${id}`);

        // Check if response is successful
        if (!response.data || !response.data.success) {
          throw new Error(
            response.data?.message || "Failed to fetch booking data"
          );
        }

        const bookingData = response.data.data;
        setBooking(bookingData);

        // Redirect if booking is not rejected
        if (bookingData.status !== "rejected") {
          switch (bookingData.status) {
            case "accepted":
              navigate(`/bookings/${id}/accepted`, { replace: true });
              break;
            case "pending":
              navigate(`/bookings/${id}/waiting`, { replace: true });
              break;
            default:
              navigate("/my-bookings", { replace: true });
          }
          return;
        }
      } catch (err) {
        console.error("Error fetching booking:", err);
        const errorMessage =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Gagal memuat data booking";
        setError(errorMessage);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          confirmButtonText: "OK",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();

    // Cleanup function
    return () => {
      // Cancel any ongoing requests if component unmounts
    };
  }, [id, navigate]);

  const handleBackToList = () => {
    navigate("/my-bookings");
  };

  const handleCreateNewBooking = () => {
    navigate("/layanan");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data booking...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Terjadi Kesalahan
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Kembali
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-10 w-10 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Data Tidak Ditemukan
            </h2>
            <p className="text-gray-600 mb-4">
              Booking dengan ID tersebut tidak ditemukan
            </p>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Kembali ke Daftar Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Booking Ditolak
            </h1>
            <p className="text-gray-600">
              Maaf, booking Anda tidak dapat diproses oleh admin
            </p>
          </div>

          <div className="mb-8">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Alasan Penolakan
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Admin telah menolak booking Anda dengan alasan:{" "}
                      <span className="font-semibold">
                        {booking.rejection_reason ||
                          "Tidak disebutkan alasan spesifik"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Detail Booking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID Booking</p>
                    <p className="font-medium">{booking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Diajukan</p>
                    <p className="font-medium">
                      {new Date(booking.created_at).toLocaleDateString(
                        "id-ID",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Layanan</p>
                    <p className="font-medium">{booking.jenis_service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-red-600 capitalize">
                      {booking.status}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Informasi Kendaraan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Merek</p>
                    <p className="font-medium">{booking.merek}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Model</p>
                    <p className="font-medium">{booking.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tahun</p>
                    <p className="font-medium">{booking.tahun}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nomor Plat</p>
                    <p className="font-medium">{booking.nomer_plat}</p>
                  </div>
                </div>
              </div>

              {booking.detail_kerusakan && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Detail Kerusakan
                  </h3>
                  <p className="whitespace-pre-line">
                    {booking.detail_kerusakan}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCreateNewBooking}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Buat Booking Baru
            </button>
            <button
              onClick={handleBackToList}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Kembali ke Daftar Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RejectedBooking;
