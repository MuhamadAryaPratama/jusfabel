import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../axiosClient";
import Navbar from "../../components/Navbar";

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
    limit: 10,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosClient.get(
        `/transactions/user?page=${page}&limit=10`
      );

      if (response.data.success) {
        setTransactions(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setError("Gagal memuat riwayat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Tanggal tidak valid";
      }

      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleDateString("id-ID", options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      "menunggu pembayaran": {
        color: "bg-yellow-100 text-yellow-800",
        text: "Menunggu Pembayaran",
      },
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Menunggu Pembayaran",
      },
      waiting: {
        color: "bg-blue-100 text-blue-800",
        text: "Menunggu Konfirmasi",
      },
      processing: { color: "bg-blue-100 text-blue-800", text: "Diproses" },
      shipped: { color: "bg-indigo-100 text-indigo-800", text: "Dikirim" },
      completed: { color: "bg-green-100 text-green-800", text: "Selesai" },
      cancelled: { color: "bg-red-100 text-red-800", text: "Dibatalkan" },
      paid: { color: "bg-blue-100 text-blue-800", text: "Menunggu Konfirmasi" },
      confirmed: { color: "bg-green-100 text-green-800", text: "Dikonfirmasi" },
      accept: { color: "bg-green-100 text-green-800", text: "Diterima" },
      reject: { color: "bg-red-100 text-red-800", text: "Ditolak" },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage);
    }
  };

  const handleTransactionClick = (transaction) => {
    // Navigasi berdasarkan status transaksi
    switch (transaction.status) {
      case "menunggu pembayaran":
      case "pending":
        // Untuk status menunggu pembayaran, arahkan ke halaman payment
        navigate("/payment", {
          state: {
            transactionId: transaction.id,
            transaction: transaction,
          },
        });
        break;
      case "waiting":
      case "paid":
      case "processing":
        // Untuk status yang sedang menunggu konfirmasi/diproses
        navigate(`/transactions/${transaction.id}/waiting`);
        break;
      case "accept":
      case "confirmed":
      case "completed":
      case "shipped":
        // Untuk status yang diterima/selesai
        navigate(`/transactions/${transaction.id}/accepted`);
        break;
      case "reject":
      case "cancelled":
        // Untuk status yang ditolak/dibatalkan
        navigate(`/transactions/${transaction.id}/rejected`);
        break;
      default:
        // Default: tampilkan detail transaksi
        navigate(`/transaction/${transaction.id}`);
        break;
    }
  };

  // Fungsi untuk menghitung nomor urut berdasarkan pagination
  const getTransactionNumber = (index) => {
    return (pagination.currentPage - 1) * pagination.limit + index + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Riwayat Transaksi
          </h1>
          <p className="text-gray-600 mt-2">
            Lihat semua transaksi yang telah Anda lakukan
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Belum ada transaksi
            </h3>
            <p className="mt-1 text-gray-500">
              Mulai berbelanja untuk melihat riwayat transaksi Anda
            </p>
            <div className="mt-6">
              <Link
                to="/list-products"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Mulai Belanja
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <li key={transaction.id}>
                    <div
                      onClick={() => handleTransactionClick(transaction)}
                      className="block hover:bg-gray-50 cursor-pointer px-4 py-4 sm:px-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-800 text-sm font-medium mr-3">
                              {getTransactionNumber(index)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(transaction.total_price)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex ml-11">
                          <p className="flex items-center text-sm text-gray-500">
                            {transaction.total_items} item •{" "}
                            {transaction.total_quantity} produk
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p>{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-md shadow">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Menampilkan{" "}
                      <span className="font-medium">
                        {(pagination.currentPage - 1) * pagination.limit + 1}
                      </span>{" "}
                      sampai{" "}
                      <span className="font-medium">
                        {Math.min(
                          pagination.currentPage * pagination.limit,
                          pagination.totalTransactions
                        )}
                      </span>{" "}
                      dari{" "}
                      <span className="font-medium">
                        {pagination.totalTransactions}
                      </span>{" "}
                      hasil
                    </p>
                  </div>
                  <div>
                    <nav
                      className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                      aria-label="Pagination"
                    >
                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={pagination.currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          pagination.currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        &laquo; Sebelumnya
                      </button>

                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Halaman {pagination.currentPage} dari{" "}
                        {pagination.totalPages}
                      </span>

                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          pagination.currentPage === pagination.totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        Berikutnya &raquo;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;
