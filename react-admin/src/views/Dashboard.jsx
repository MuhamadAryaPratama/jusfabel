import { useState, useEffect } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  Star,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function Dashboard() {
  const [productStats, setProductStats] = useState({ total: 0, active: 0 });
  const [transactionStats, setTransactionStats] = useState({
    status_counts: { waiting: 0, accept: 0, reject: 0 },
    sales_stats: { total_transactions: 0, total_revenue: 0 },
  });
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [productLoading, setProductLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    const possibleTokens = [
      localStorage.getItem("adminToken"),
      localStorage.getItem("token"),
      localStorage.getItem("access_token"),
      localStorage.getItem("authToken"),
    ];
    return possibleTokens.find((token) => token !== null) || null;
  };

  const fetchData = async (endpoint, setData, setLoadingState, params = {}) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const queryString = new URLSearchParams(params).toString();
      const url = `http://localhost:5000/api/${endpoint}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Don't throw error for stats endpoint, just return empty data
        if (endpoint === "transactions/stats/overview") {
          console.warn("Stats endpoint not available, using fallback data");
          return setData({
            status_counts: { waiting: 0, accept: 0, reject: 0 },
            sales_stats: { total_transactions: 0, total_revenue: 0 },
          });
        }

        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
          localStorage.removeItem("authToken");
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setData(data.data || data);
      } else {
        throw new Error(data.message || `Failed to fetch ${endpoint}`);
      }
    } catch (err) {
      // Only set error for critical endpoints, not for stats
      if (endpoint !== "transactions/stats/overview") {
        setError(err.message);
      }
      console.error(`Fetch error (${endpoint}):`, err);
    } finally {
      if (setLoadingState) setLoadingState(false);
    }
  };

  // Fallback function to calculate stats from transactions data
  const calculateStatsFromTransactions = (transactions) => {
    const status_counts = {
      waiting: 0,
      accept: 0,
      reject: 0,
      processing: 0,
      completed: 0,
    };

    let total_revenue = 0;

    transactions.forEach((transaction) => {
      status_counts[transaction.status] =
        (status_counts[transaction.status] || 0) + 1;
      if (
        transaction.status === "accept" ||
        transaction.status === "completed"
      ) {
        total_revenue += transaction.total_price || 0;
      }
    });

    return {
      status_counts,
      sales_stats: {
        total_transactions: transactions.length,
        total_revenue,
      },
    };
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        // Fetch products
        const productsResponse = await fetch(
          "http://localhost:5000/api/products?limit=1000",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProductStats({
            total:
              productsData.pagination?.totalProducts ||
              productsData.data?.length ||
              0,
            active:
              productsData.data?.filter(
                (product) => product.is_active !== false
              ).length || 0,
          });
        }
        setProductLoading(false);

        // Fetch transactions for stats and recent list
        const transactionsResponse = await fetch(
          "http://localhost:5000/api/transactions?limit=1000",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          const transactions = transactionsData.data || transactionsData;

          // Set recent transactions (last 5)
          const recent = Array.isArray(transactions)
            ? transactions.slice(0, 5)
            : [];
          setRecentTransactions(recent);

          // Calculate stats from transactions
          const calculatedStats = calculateStatsFromTransactions(transactions);
          setTransactionStats(calculatedStats);
        }
        setTransactionLoading(false);
        setTransactionsLoading(false);

        // Try to fetch users if endpoint exists
        try {
          const usersResponse = await fetch(
            "http://localhost:5000/api/auth/users?limit=1",
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUserStats({
              totalUsers: usersData.pagination?.totalUsers || 0,
              totalCustomers:
                usersData.data?.filter((user) => user.role === "customer")
                  .length || 0,
            });
          }
        } catch (userError) {
          console.warn("Users endpoint not available");
          setUserStats({ totalUsers: 0, totalCustomers: 0 });
        }
        setUserLoading(false);
      } catch (err) {
        setError(err.message);
        setProductLoading(false);
        setTransactionLoading(false);
        setUserLoading(false);
        setTransactionsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleRetry = () => {
    setError(null);
    setProductLoading(true);
    setTransactionLoading(true);
    setUserLoading(true);
    setTransactionsLoading(true);

    const fetchAllData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        // Refetch all data
        const productsResponse = await fetch(
          "http://localhost:5000/api/products?limit=1000",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProductStats({
            total:
              productsData.pagination?.totalProducts ||
              productsData.data?.length ||
              0,
            active:
              productsData.data?.filter(
                (product) => product.is_active !== false
              ).length || 0,
          });
        }

        const transactionsResponse = await fetch(
          "http://localhost:5000/api/transactions?limit=1000",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json();
          const transactions = transactionsData.data || transactionsData;

          setRecentTransactions(
            Array.isArray(transactions) ? transactions.slice(0, 5) : []
          );
          setTransactionStats(calculateStatsFromTransactions(transactions));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setProductLoading(false);
        setTransactionLoading(false);
        setTransactionsLoading(false);
        setUserLoading(false);
      }
    };

    fetchAllData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      waiting: "bg-yellow-100 text-yellow-800",
      accept: "bg-green-100 text-green-800",
      reject: "bg-red-100 text-red-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-purple-100 text-purple-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const translateStatus = (status) => {
    const statusMap = {
      waiting: "Menunggu",
      accept: "Diterima",
      reject: "Ditolak",
      processing: "Diproses",
      completed: "Selesai",
    };
    return statusMap[status] || status;
  };

  const getIconColor = (color) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
      yellow: "text-yellow-600",
      orange: "text-orange-600",
      red: "text-red-600",
    };
    return colors[color] || "text-gray-600";
  };

  const stats = [
    {
      title: "Total Produk",
      value: productLoading ? "Loading..." : productStats.total.toString(),
      subtitle: `${productStats.active} aktif`,
      icon: Package,
      color: "blue",
    },
    {
      title: "Total Transaksi",
      value: transactionLoading
        ? "Loading..."
        : transactionStats.sales_stats.total_transactions.toString(),
      subtitle: formatCurrency(transactionStats.sales_stats.total_revenue),
      icon: ShoppingCart,
      color: "green",
    },
    {
      title: "Total Pelanggan",
      value: userLoading ? "Loading..." : userStats.totalCustomers.toString(),
      subtitle: `${userStats.totalUsers} total pengguna`,
      icon: Users,
      color: "purple",
    },
  ];

  const statusOverview = [
    {
      label: "Menunggu",
      count: transactionStats.status_counts.waiting,
      color: "yellow",
    },
    {
      label: "Diterima",
      count: transactionStats.status_counts.accept,
      color: "green",
    },
    {
      label: "Ditolak",
      count: transactionStats.status_counts.reject,
      color: "red",
    },
  ];

  if (
    productLoading ||
    transactionLoading ||
    userLoading ||
    transactionsLoading
  ) {
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
          onClick={handleRetry}
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
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Selamat datang kembali, Admin!</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                <stat.icon className={`w-6 h-6 ${getIconColor(stat.color)}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Transaksi Terbaru
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.customer_name || "Tidak ada nama"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {transaction.customer_email || "Tidak ada email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.total_price)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          {formatDate(transaction.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {translateStatus(transaction.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      Tidak ada transaksi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Status Transaksi
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ringkasan Status Transaksi
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {statusOverview.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full bg-${item.color}-500`}
                    ></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Total Transaksi
                </span>
                <span className="text-base font-bold text-gray-900">
                  {transactionStats.sales_stats.total_transactions}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
