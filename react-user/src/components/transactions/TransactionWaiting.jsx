import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axiosClient from "../../axiosClient";
import Navbar from "../Navbar";

function TransactionWaiting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("access_token");
        const response = await axiosClient.get(`/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTransaction(response.data.data);

        // If transaction is already processed/shipped, navigate to appropriate page
        if (!["pending", "paid"].includes(response.data.data.status)) {
          handleStatusChange(response.data.data.status, response.data.data);
          return;
        }

        // Start polling if transaction is pending or paid
        const pollInterval = setInterval(async () => {
          try {
            const pollResponse = await axiosClient.get(`/transactions/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setTransaction(pollResponse.data.data);

            if (!["pending", "paid"].includes(pollResponse.data.data.status)) {
              clearInterval(pollInterval);
              handleStatusChange(
                pollResponse.data.data.status,
                pollResponse.data.data
              );
            }
          } catch (error) {
            console.error("Polling error:", error);
          }
        }, 10000); // Poll every 10 seconds

        setPolling(pollInterval);
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

    return () => {
      if (polling) clearInterval(polling);
    };
  }, [id, navigate]);

  const handleStatusChange = (status, transactionData) => {
    switch (status) {
      case "confirmed":
      case "processing":
        // Navigate to TransactionAccepted page
        navigate(`/transaction-accepted/${id}`, { replace: true });
        break;
      case "shipped":
        Swal.fire({
          icon: "success",
          title: "Pesanan Dikirim!",
          text: "Pesanan Anda sudah dikirim dan dalam perjalanan.",
          confirmButtonText: "OK",
        });
        break;
      case "delivered":
        Swal.fire({
          icon: "success",
          title: "Pesanan Sampai!",
          text: "Pesanan Anda telah sampai di tujuan.",
          confirmButtonText: "OK",
        });
        break;
      case "cancelled":
        Swal.fire({
          icon: "error",
          title: "Pesanan Dibatalkan",
          text: "Pesanan Anda telah dibatalkan.",
          confirmButtonText: "OK",
        }).then(() => {
          navigate("/", { replace: true });
        });
        break;
      default:
        break;
    }
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID").format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "paid":
        return "text-blue-600 bg-blue-100";
      case "confirmed":
        return "text-green-600 bg-green-100";
      case "processing":
        return "text-orange-600 bg-orange-100";
      case "shipped":
        return "text-purple-600 bg-purple-100";
      case "delivered":
        return "text-green-600 bg-green-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Menunggu Pembayaran";
      case "paid":
        return "Menunggu Konfirmasi";
      case "confirmed":
        return "Pembayaran Dikonfirmasi";
      case "processing":
        return "Sedang Diproses";
      case "shipped":
        return "Dalam Pengiriman";
      case "delivered":
        return "Telah Sampai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Status Pesanan
            </h1>
            <p className="text-gray-600">Pantau status pesanan Anda di sini</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center">
                  {transaction.status === "paid" ||
                  transaction.status === "pending" ? (
                    <svg
                      className="w-16 h-16 text-orange-600 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : transaction.status === "confirmed" ||
                    transaction.status === "processing" ? (
                    <svg
                      className="w-16 h-16 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-16 h-16 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  )}
                </div>
                <div className="absolute -bottom-2 left-0 right-0 text-center">
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {getStatusText(transaction.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
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
                    <p className="font-medium text-orange-600">
                      Rp{" "}
                      {formatRupiah(
                        transaction.total_amount || transaction.total_price
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">
                      {getStatusText(transaction.status)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Informasi Pengiriman
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nama Penerima</p>
                    <p className="font-medium">{transaction.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nomor Telepon</p>
                    <p className="font-medium">{transaction.customer_phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Alamat Pengiriman</p>
                    <p className="font-medium">
                      {transaction.customer_address}
                    </p>
                  </div>
                </div>
              </div>

              {transaction.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Catatan Pesanan
                  </h3>
                  <p className="whitespace-pre-line">{transaction.notes}</p>
                </div>
              )}

              {/* Items */}
              {transaction.items && transaction.items.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Item Pesanan
                  </h3>
                  <div className="space-y-2">
                    {transaction.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <span className="font-medium">
                          {item.product_name || `Produk ${item.product_id}`}
                        </span>
                        <span className="text-gray-600">{item.quantity}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Kembali ke Beranda
            </button>

            {transaction.status === "pending" && (
              <button
                onClick={() =>
                  navigate("/payment", {
                    state: {
                      transactionId: transaction.id,
                      transaction: transaction,
                    },
                  })
                }
                className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
              >
                Bayar Sekarang
              </button>
            )}
          </div>

          {(transaction.status === "paid" ||
            transaction.status === "confirmed") && (
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Halaman ini akan otomatis memperbarui status pesanan Anda</p>
              <p>Silakan tunggu konfirmasi dari admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionWaiting;
