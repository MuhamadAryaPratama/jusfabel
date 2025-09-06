import { useState, useEffect } from "react";
import axiosClient from "../../axiosClient";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Filter,
  FileText,
  Printer,
  AlertCircle,
} from "lucide-react";

export default function SalesReport() {
  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
    },
    transactions: [],
    dailyStats: [],
    productStats: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [filters, setFilters] = useState({
    status: "accept", // Default hanya transaksi yang diterima
  });
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  useEffect(() => {
    fetchSalesReport();
  }, [dateRange, filters]);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        status: filters.status,
      };

      // Hapus parameter yang kosong
      Object.keys(params).forEach((key) => {
        if (params[key] === null || params[key] === "") {
          delete params[key];
        }
      });

      const response = await axiosClient.get(
        "/transactions/stats/sales-report",
        {
          params,
        }
      );

      if (response.data && response.data.success) {
        // Sanitize data untuk mencegah NaN
        const data = response.data.data;
        const sanitizedData = {
          summary: {
            totalRevenue: sanitizeNumber(data.summary?.totalRevenue),
            totalTransactions: sanitizeNumber(data.summary?.totalTransactions),
            averageOrderValue: sanitizeNumber(data.summary?.averageOrderValue),
            totalCustomers: sanitizeNumber(data.summary?.totalCustomers),
          },
          transactions: Array.isArray(data.transactions)
            ? data.transactions
            : [],
          dailyStats: Array.isArray(data.dailyStats) ? data.dailyStats : [],
          productStats: Array.isArray(data.productStats)
            ? data.productStats
            : [],
        };
        setReportData(sanitizedData);
      } else {
        setReportData({
          summary: {
            totalRevenue: 0,
            totalTransactions: 0,
            averageOrderValue: 0,
            totalCustomers: 0,
          },
          transactions: [],
          dailyStats: [],
          productStats: [],
        });
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
      console.error("Failed to fetch sales report:", err);
    }
  };

  // Helper function untuk sanitize numbers
  const sanitizeNumber = (value) => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    // Header CSV
    let csvContent = "Laporan Penjualan\n";
    csvContent += `Periode: ${formatDate(dateRange.startDate)} - ${formatDate(
      dateRange.endDate
    )}\n\n`;

    // Ringkasan
    csvContent += "RINGKASAN\n";
    csvContent += `Total Pendapatan,${formatPrice(
      reportData.summary.totalRevenue
    )}\n`;
    csvContent += `Total Transaksi,${reportData.summary.totalTransactions}\n`;
    csvContent += `Rata-rata Nilai Pesanan,${formatPrice(
      reportData.summary.averageOrderValue
    )}\n`;
    csvContent += `Total Pelanggan,${reportData.summary.totalCustomers}\n\n`;

    // Data transaksi
    csvContent += "TRANSAKSI\n";
    csvContent += "ID,Tanggal,Pelanggan,Items,Quantity,Total,Status\n";

    reportData.transactions.forEach((transaction) => {
      csvContent += `${transaction.id},${formatDate(transaction.created_at)},${
        transaction.customer_name
      },${sanitizeNumber(transaction.total_items)},${sanitizeNumber(
        transaction.total_quantity
      )},${sanitizeNumber(transaction.total_price)},${transaction.status}\n`;
    });

    // Buat file dan download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `laporan-penjualan-${dateRange.startDate}-to-${dateRange.endDate}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  const formatPrice = (price) => {
    const sanitizedPrice = sanitizeNumber(price);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(sanitizedPrice);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  const formatNumber = (num) => {
    const sanitizedNum = sanitizeNumber(num);
    return new Intl.NumberFormat("id-ID").format(sanitizedNum);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Gagal memuat laporan penjualan: {error}
            </p>
            <button
              onClick={fetchSalesReport}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={printReport}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Transaksi
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="accept">Diterima</option>
              <option value="all">Semua Status</option>
              <option value="waiting">Menunggu Konfirmasi</option>
              <option value="reject">Ditolak</option>
            </select>
          </div>

          <button
            onClick={fetchSalesReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 h-10"
          >
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Pendapatan
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(reportData.summary.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Transaksi
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(reportData.summary.totalTransactions)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Rata-rata Pesanan
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(reportData.summary.averageOrderValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Pelanggan
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(reportData.summary.totalCustomers)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            Daftar Transaksi
          </h2>
          <p className="text-sm text-gray-500">
            {reportData.transactions.length} transaksi ditemukan
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  ID Transaksi
                  {sortConfig.key === "id" && (
                    <span className="ml-1">
                      {sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4 inline" />
                      ) : (
                        <ChevronDown className="w-4 h-4 inline" />
                      )}
                    </span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("created_at")}
                >
                  Tanggal
                  {sortConfig.key === "created_at" && (
                    <span className="ml-1">
                      {sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4 inline" />
                      ) : (
                        <ChevronDown className="w-4 h-4 inline" />
                      )}
                    </span>
                  )}
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
                  Items
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("total_price")}
                >
                  Total
                  {sortConfig.key === "total_price" && (
                    <span className="ml-1">
                      {sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-4 h-4 inline" />
                      ) : (
                        <ChevronDown className="w-4 h-4 inline" />
                      )}
                    </span>
                  )}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.transactions.length > 0 ? (
                reportData.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{sanitizeNumber(transaction.id) || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.customer_name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(transaction.total_items)} produk
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(transaction.total_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === "accept"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "waiting"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status === "accept"
                          ? "Diterima"
                          : transaction.status === "waiting"
                          ? "Menunggu"
                          : "Ditolak"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="text-gray-500 flex flex-col items-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mb-2" />
                      <p>Tidak ada transaksi ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Performa Produk</h2>
          <p className="text-sm text-gray-500">
            Produk terlaris berdasarkan pendapatan
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Produk
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Terjual
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Pendapatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.productStats.length > 0 ? (
                reportData.productStats.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.product_name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatNumber(product.quantity_sold)} item
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(product.total_revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center">
                    <div className="text-gray-500 flex flex-col items-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mb-2" />
                      <p>Tidak ada data performa produk</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
