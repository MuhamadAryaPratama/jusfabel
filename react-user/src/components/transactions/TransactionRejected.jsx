import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axiosClient from "../../axiosClient";
import Navbar from "../Navbar";

function TransactionRejected() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("access_token");
        const response = await axiosClient.get(`/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTransaction(response.data.data);

        // Simulasi alasan penolakan (dalam implementasi nyata, ini harus datang dari backend)
        const reasons = [
          "Bukti pembayaran tidak jelas/tidak terbaca",
          "Bukti pembayaran tidak sesuai dengan jumlah transaksi",
          "Pembayaran tidak ditemukan dalam sistem bank",
          "Transaksi kadaluarsa",
          "Data pembayaran tidak lengkap",
        ];
        setRejectionReason(reasons[Math.floor(Math.random() * reasons.length)]);

        // Show rejection notification if transaction is cancelled
        if (response.data.data.status === "cancelled") {
          Swal.fire({
            icon: "error",
            title: "Pembayaran Ditolak",
            text: "Pembayaran Anda tidak dapat dikonfirmasi. Silakan periksa detail transaksi untuk informasi lebih lanjut.",
            confirmButtonText: "Mengerti",
          });
        }
      } catch (error) {
        console.error("Error fetching transaction:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Gagal memuat data transaksi",
        }).then(() => navigate("/"));
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, navigate]);

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID").format(amount || 0);
  };

  const handleRetryPayment = () => {
    navigate("/payment", {
      state: {
        transactionId: transaction.id,
        transaction: transaction,
        isRetry: true,
      },
    });
  };

  const handleContactSupport = () => {
    // Ini bisa diarahkan ke halaman kontak, WhatsApp, atau email
    window.location.href =
      "https://wa.me/6281234567890?text=Halo,%20saya%20membutuhkan%20bantuan%20mengenai%20transaksi%20yang%20ditolak";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data transaksi...</p>
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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
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
              Pembayaran Ditolak
            </h1>
            <p className="text-gray-600">
              Pembayaran Anda tidak dapat dikonfirmasi oleh sistem.
            </p>
          </div>

          <div className="space-y-6">
            {/* Rejection Information */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-3">
                Alasan Penolakan
              </h3>
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0"
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
                <p className="text-red-700">{rejectionReason}</p>
              </div>
            </div>

            {/* Transaction Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Informasi Transaksi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID Transaksi</p>
                  <p className="font-medium">#{transaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal Pesanan</p>
                  <p className="font-medium">
                    {new Date(transaction.created_at).toLocaleDateString(
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
                  <p className="text-sm text-gray-600">Total Pembayaran</p>
                  <p className="font-medium text-red-600">
                    Rp {formatRupiah(transaction.total_price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium text-red-600">Ditolak</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            {transaction.items && transaction.items.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Item Pesanan
                </h3>
                <div className="space-y-3">
                  {transaction.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded border"
                    >
                      <div className="flex items-center">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded mr-3"
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {item.product_name || `Produk ${item.product_id}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Rp {formatRupiah(item.price_per_unit)} per item
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          Rp {formatRupiah(item.total_price)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} item
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                Langkah yang Dapat Dilakukan
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Unggah ulang bukti pembayaran yang lebih jelas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Pastikan jumlah pembayaran sesuai dengan tagihan</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Hubungi customer service jika butuh bantuan</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Anda dapat mencoba melakukan pembayaran kembali</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Kembali ke Beranda
            </button>
            <button
              onClick={handleRetryPayment}
              className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
            >
              Coba Bayar Lagi
            </button>
            <button
              onClick={handleContactSupport}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Hubungi Bantuan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionRejected;
