import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import axiosClient from "../axiosClient";
import Navbar from "./Navbar";

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);

  // Get transaction data from navigation state
  const {
    transactionId,
    transaction: transactionData,
    fromOrder,
    fromCart,
  } = location.state || {};

  useEffect(() => {
    // If no transaction data, redirect back
    if (!transactionId && !transactionData) {
      Swal.fire({
        icon: "warning",
        title: "Data Tidak Ditemukan",
        text: "Data transaksi tidak ditemukan. Silakan buat pesanan terlebih dahulu.",
      }).then(() => {
        navigate("/");
      });
      return;
    }

    // Set transaction data
    if (transactionData) {
      setTransaction(transactionData);
    } else if (transactionId) {
      fetchTransactionData(transactionId);
    }
  }, [transactionId, transactionData, navigate]);

  const fetchTransactionData = async (id) => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("access_token");

      const response = await axiosClient.get(`/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.success) {
        setTransaction(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal memuat data transaksi",
      }).then(() => {
        navigate("/");
      });
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID").format(amount || 0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "warning",
          title: "Format File Tidak Valid",
          text: "Silakan upload file gambar (JPG, JPEG, PNG)",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "warning",
          title: "File Terlalu Besar",
          text: "Ukuran file maksimal 5MB",
        });
        return;
      }

      setPaymentProof(file);
    }
  };

  const handlePaymentConfirmation = async () => {
    if (!paymentProof) {
      Swal.fire({
        icon: "warning",
        title: "Bukti Pembayaran Diperlukan",
        text: "Silakan upload bukti pembayaran terlebih dahulu",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi Pembayaran",
      text: "Apakah Anda yakin sudah melakukan pembayaran sesuai dengan jumlah yang tertera?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Sudah Bayar",
      cancelButtonText: "Belum",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("access_token");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("payment_proof", paymentProof);

      // Gunakan endpoint yang benar sesuai dengan controller
      const response = await axiosClient.post(
        `/transactions/${transaction.id}/payment-proof`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Pembayaran Dikonfirmasi!",
          text: "Bukti pembayaran telah dikirim. Pesanan Anda sedang diproses.",
          confirmButtonText: "Lihat Status",
        }).then(() => {
          // Navigate to waiting confirmation page
          navigate(`/transactions/${transaction.id}/waiting`);
        });
      } else {
        throw new Error(
          response.data?.message || "Gagal konfirmasi pembayaran"
        );
      }
    } catch (error) {
      console.error("Error confirming payment:", error);

      let errorMessage = "Terjadi kesalahan saat konfirmasi pembayaran";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: "error",
        title: "Konfirmasi Gagal",
        text: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data pembayaran...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Data transaksi tidak ditemukan</p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Pembayaran Pesanan
          </h1>
          <p className="text-gray-600">
            Scan QRIS di bawah untuk melakukan pembayaran
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">
              Scan QRIS untuk Pembayaran
            </h3>

            {/* QRIS Image */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <img
                  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAMFBMVEX///8AAADl5eXIyMjU1NTx8fH7+/vr6+vd3d2+vr6ysrKYmJhsbGxUVFQ8PDwmJiYODg7KAAAAoElEQVR4nO3QQQ0AAAzDsJU/6QsoKgvGw4z33nsDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMCfgdqA+QAf"
                  alt="QRIS Code"
                  className="w-72 h-72 object-contain"
                />
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">
                Cara Pembayaran:
              </h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Buka aplikasi e-wallet atau mobile banking Anda</li>
                <li>2. Pilih menu Scan QR atau QRIS</li>
                <li>3. Scan kode QR di atas</li>
                <li>4. Masukkan nominal sesuai total pembayaran</li>
                <li>5. Konfirmasi pembayaran</li>
                <li>6. Upload bukti pembayaran di bawah</li>
              </ol>
            </div>

            {/* Upload Payment Proof */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Bukti Pembayaran *
                </label>
                <input
                  type="file"
                  name="payment_proof"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: JPG, JPEG, PNG (Maksimal 5MB)
                </p>
              </div>

              {paymentProof && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  File berhasil dipilih: {paymentProof.name}
                </div>
              )}
            </div>

            <button
              onClick={handlePaymentConfirmation}
              disabled={submitting || !paymentProof}
              className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Mengonfirmasi Pembayaran...
                </>
              ) : (
                "Konfirmasi Pembayaran"
              )}
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">
              Ringkasan Pesanan
            </h3>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm text-gray-600">ID Transaksi</p>
                <p className="font-medium">#{transaction.id}</p>
              </div>

              <div className="border-b pb-4">
                <p className="text-sm text-gray-600">Nama Pemesan</p>
                <p className="font-medium">{transaction.customer_name}</p>
              </div>

              <div className="border-b pb-4">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{transaction.customer_email}</p>
              </div>

              <div className="border-b pb-4">
                <p className="text-sm text-gray-600">Nomor Telepon</p>
                <p className="font-medium">{transaction.customer_phone}</p>
              </div>

              <div className="border-b pb-4">
                <p className="text-sm text-gray-600">Alamat Pengiriman</p>
                <p className="font-medium">{transaction.customer_address}</p>
              </div>

              {transaction.notes && (
                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600">Catatan</p>
                  <p className="font-medium">{transaction.notes}</p>
                </div>
              )}

              {/* Items */}
              <div className="border-b pb-4">
                <p className="text-sm text-gray-600 mb-2">Item Pesanan</p>
                <div className="space-y-2">
                  {transaction.items && transaction.items.length > 0 ? (
                    transaction.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.product_name || `Produk ${item.product_id}`}
                        </span>
                        <span>{item.quantity}x</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Detail item akan dimuat...
                    </p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Pembayaran:</span>
                  <span className="text-orange-600 text-2xl">
                    Rp{" "}
                    {formatRupiah(
                      transaction.total_amount || transaction.total_price || 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-yellow-800 font-medium">
                  Status:{" "}
                  {transaction.status === "processing"
                    ? "Sedang Diproses"
                    : "Menunggu Pembayaran"}
                </span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                {transaction.status === "processing"
                  ? "Pembayaran Anda sedang diproses oleh admin"
                  : "Silakan lakukan pembayaran dan upload bukti pembayaran"}
              </p>
            </div>

            {/* Cancel Order Button */}
            <button
              onClick={() => {
                Swal.fire({
                  title: "Batalkan Pesanan?",
                  text: "Apakah Anda yakin ingin membatalkan pesanan ini?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Ya, Batalkan",
                  cancelButtonText: "Tidak",
                }).then((result) => {
                  if (result.isConfirmed) {
                    navigate("/");
                  }
                });
              }}
              className="w-full mt-4 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Batalkan Pesanan
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Butuh Bantuan?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <svg
                className="w-8 h-8 text-orange-600 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <p className="font-medium">WhatsApp</p>
              <p className="text-gray-600">+62 812-3456-7890</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <svg
                className="w-8 h-8 text-orange-600 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="font-medium">Email</p>
              <p className="text-gray-600">support@example.com</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <svg
                className="w-8 h-8 text-orange-600 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-medium">Jam Operasional</p>
              <p className="text-gray-600">08:00 - 17:00 WIB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
