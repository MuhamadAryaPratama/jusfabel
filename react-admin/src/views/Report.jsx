import { useState, useEffect } from "react";
import {
  Calendar,
  Filter,
  Download,
  Printer,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export default function BookingReport() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    sort: "id",
    order: "asc",
  });
  const [showFilters, setShowFilters] = useState(false);

  const getAuthToken = () => {
    const possibleTokens = [
      localStorage.getItem("adminToken"),
      localStorage.getItem("token"),
      localStorage.getItem("access_token"),
      localStorage.getItem("authToken"),
    ];
    return possibleTokens.find((token) => token !== null) || null;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const formatDateForAPI = (date) => {
        return date ? format(date, "yyyy-MM-dd") : null;
      };

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: pagination.sort,
        order: pagination.order,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && {
          startDate: formatDateForAPI(filters.startDate),
        }),
        ...(filters.endDate && { endDate: formatDateForAPI(filters.endDate) }),
      };

      Object.keys(params).forEach(
        (key) => params[key] == null && delete params[key]
      );

      const queryString = new URLSearchParams(params).toString();
      const url = `http://localhost:5000/api/bookings?${queryString}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
          localStorage.removeItem("authToken");
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setBookings(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.totalBookings,
          totalPages:
            data.pagination.totalPages ||
            Math.ceil(data.pagination.totalBookings / prev.limit),
        }));
      } else {
        throw new Error(data.message || "Failed to fetch bookings");
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, pagination.limit, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBookings();
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      search: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (e) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(e.target.value),
      page: 1,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = parseISO(dateString);
    return format(date, "dd MMM yyyy HH:mm", { locale: id });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      canceled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const translateStatus = (status) => {
    const statusMap = {
      pending: "Menunggu",
      accepted: "Diterima",
      completed: "Selesai",
      rejected: "Ditolak",
      canceled: "Dibatalkan",
    };
    return statusMap[status] || status;
  };

  const exportToCSV = () => {
    const headers = [
      "No",
      "Pelanggan",
      "Layanan",
      "Merek Kendaraan",
      "Model",
      "Tahun",
      "Plat Nomor",
      "Tanggal Service",
      "Status",
      "Kode Antrian",
      "Harga",
      "Dibuat Pada",
      "Alasan Penolakan",
    ];

    const exportData = bookings.map((booking, index) => {
      const nomorUrut = (pagination.page - 1) * pagination.limit + index + 1;
      return [
        nomorUrut,
        booking.user_name,
        booking.jenis_service,
        booking.merek,
        booking.model,
        booking.tahun,
        booking.nomer_plat,
        formatDate(booking.tanggal_service),
        translateStatus(booking.status),
        booking.kode_antrian || "-",
        booking.service_harga,
        formatDate(booking.created_at),
        booking.status === "rejected" && booking.rejection_reason
          ? booking.rejection_reason
          : "-",
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\r\n";
    exportData.forEach((row) => {
      csvContent += row.join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `laporan-booking-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Booking</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .status-pending { background-color: #fef9c3; color: #b45309; }
            .status-accepted { background-color: #dbeafe; color: #1e40af; }
            .status-completed { background-color: #dcfce7; color: #166534; }
            .status-rejected { background-color: #fee2e2; color: #991b1b; }
            .status-canceled { background-color: #f3f4f6; color: #4b5563; }
          </style>
        </head>
        <body>
          <h1>Laporan Booking</h1>
          <p>Tanggal: ${format(new Date(), "dd MMMM yyyy HH:mm", {
            locale: id,
          })}</p>
          <p>Total Data: ${bookings.length}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Pelanggan</th>
                <th>Layanan</th>
                <th>Merek</th>
                <th>Model</th>
                <th>Tahun</th>
                <th>Plat</th>
                <th>Tanggal Service</th>
                <th>Status</th>
                <th>Kode Antrian</th>
                <th>Harga</th>
                <th>Dibuat Pada</th>
                <th>Alasan Penolakan</th>
              </tr>
            </thead>
            <tbody>
              ${bookings
                .map((booking, index) => {
                  const nomorUrut =
                    (pagination.page - 1) * pagination.limit + index + 1;
                  return `
                    <tr>
                      <td>${nomorUrut}</td>
                      <td>${booking.user_name || "-"}</td>
                      <td>${booking.jenis_service || "-"}</td>
                      <td>${booking.merek || "-"}</td>
                      <td>${booking.model || "-"}</td>
                      <td>${booking.tahun || "-"}</td>
                      <td>${booking.nomer_plat || "-"}</td>
                      <td>${formatDate(booking.tanggal_service)}</td>
                      <td class="status-${booking.status}">${translateStatus(
                    booking.status
                  )}</td>
                      <td>${booking.kode_antrian || "-"}</td>
                      <td>${formatCurrency(booking.service_harga)}</td>
                      <td>${formatDate(booking.created_at)}</td>
                      <td>${
                        booking.status === "rejected" &&
                        booking.rejection_reason
                          ? booking.rejection_reason
                          : "-"
                      }</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="text-red-500 text-lg font-medium">Error: {error}</div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Coba Lagi
        </button>
        {(error.includes("Unauthorized") ||
          error.includes("login") ||
          error.includes("Authentication")) && (
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Login
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Booking</h1>
          <p className="text-gray-600">
            Manajemen dan analisis data booking service
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={printReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Filter Data</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            {showFilters ? (
              <>
                <ChevronUp size={16} />
                <span>Sembunyikan Filter</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                <span>Tampilkan Filter</span>
              </>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Booking
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="accepted">Diterima</option>
                <option value="completed">Selesai</option>
                <option value="rejected">Ditolak</option>
                <option value="canceled">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cari (Nama/Plat/Antrian)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Cari..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset Filter
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  No
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pelanggan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Layanan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kendaraan
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tanggal Service
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Kode Antrian
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Harga
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Dibuat Pada
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Alasan Penolakan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {loading
                      ? "Memuat data..."
                      : "Tidak ada data booking yang ditemukan"}
                  </td>
                </tr>
              ) : (
                bookings.map((booking, index) => {
                  const nomorUrut =
                    (pagination.page - 1) * pagination.limit + index + 1;
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {nomorUrut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.user_name || "-"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.user_email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.jenis_service || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {booking.merek} {booking.model} ({booking.tahun})
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.nomer_plat}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.tanggal_service)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {translateStatus(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.kode_antrian || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(booking.service_harga)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(booking.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.status === "rejected" &&
                        booking.rejection_reason
                          ? booking.rejection_reason
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Menampilkan{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                sampai{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                dari <span className="font-medium">{pagination.total}</span>{" "}
                hasil
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <label htmlFor="limit" className="mr-2 text-sm text-gray-700">
                  Per halaman:
                </label>
                <select
                  id="limit"
                  value={pagination.limit}
                  onChange={handleLimitChange}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNum
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
