import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axiosClient from "../axiosClient";
import Navbar from "./Navbar";

function AcceptedBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fungsi utilitas untuk format harga
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount || 0);
  };

  // Fungsi utilitas untuk format tanggal
  const formatDate = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await axiosClient.get(`/bookings/${id}`);
        if (response.data.data.status !== "accepted") {
          navigate("/my-bookings");
          return;
        }
        // Pastikan semua field memiliki nilai default
        setBooking({
          ...response.data.data,
          service_harga: response.data.data.service_harga || 0,
          jenis_service: response.data.data.jenis_service || "-",
          detail_kerusakan: response.data.data.detail_kerusakan || "-",
        });
      } catch (error) {
        console.error("Error fetching booking:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Gagal memuat data booking",
        }).then(() => navigate("/my-bookings"));
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, navigate]);

  const handleDownloadPDF = async () => {
    try {
      const response = await axiosClient.get(
        `/bookings/${id}/download-ticket`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `ticket-${booking.kode_antrian || "booking"}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengunduh",
        text: "Terjadi kesalahan saat mengunduh tiket",
      });
    }
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

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Data booking tidak ditemukan</p>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Booking Diterima
            </h1>
            <p className="text-gray-600">
              Booking Anda telah diterima oleh admin
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="absolute -bottom-2 left-0 right-0 text-center">
                  <span className="bg-green-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                    DITERIMA
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8 text-center">
              <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
                <p className="font-bold text-lg">Kode Antrian</p>
                <p className="text-2xl font-black">{booking.kode_antrian}</p>
              </div>
              <p className="text-gray-600">
                Simpan kode ini untuk menunjukkan saat tiba di bengkel
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Informasi Pelanggan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nama</p>
                    <p className="font-medium">{booking.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{booking.user_email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Informasi Booking
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID Booking</p>
                    <p className="font-medium">{booking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tanggal Service</p>
                    <p className="font-medium">
                      {formatDate(booking.tanggal_service)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Layanan</p>
                    <p className="font-medium">{booking.jenis_service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Harga</p>
                    <p className="font-medium">
                      {formatCurrency(booking.service_harga)}
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

              {booking.detail_kerusakan && booking.detail_kerusakan !== "-" && (
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
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Unduh Tiket PDF
            </button>
            <button
              onClick={() => navigate("/my-bookings")}
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

export default AcceptedBooking;
