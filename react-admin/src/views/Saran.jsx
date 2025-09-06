import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export default function Saran() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSarans: 0,
    limit: 10,
  });

  const API_BASE_URL = "http://localhost:5000";

  const getAuthToken = () => {
    // Try multiple possible token keys
    const possibleTokens = [
      localStorage.getItem("adminToken"),
      localStorage.getItem("token"),
      localStorage.getItem("access_token"),
      localStorage.getItem("authToken"),
    ];

    return possibleTokens.find((token) => token !== null) || null;
  };

  const fetchSuggestions = async (page = 1, search = "") => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const url = new URL(`${API_BASE_URL}/api/saran/admin/all`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", "10");
      if (search.trim()) {
        url.searchParams.append("search", search.trim());
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear potentially invalid tokens
          localStorage.removeItem("adminToken");
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
          localStorage.removeItem("authToken");
          throw new Error("Session expired. Please login again.");
        } else if (response.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        } else if (response.status === 404) {
          throw new Error(
            "API endpoint not found. Please check server configuration."
          );
        }

        // Try to get error message from response
        let errorMessage = "Failed to fetch suggestions";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If can't parse JSON, use default message
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.data || []);
        setPagination(
          data.pagination || {
            currentPage: page,
            totalPages: 1,
            totalSarans: data.data?.length || 0,
            limit: 10,
          }
        );
      } else {
        throw new Error(data.message || "Failed to fetch suggestions");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching suggestions:", err);

      // Reset data on error
      setSuggestions([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalSarans: 0,
        limit: 10,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions(currentPage, searchTerm);
  }, [currentPage]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to page 1 when searching
      } else {
        fetchSuggestions(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== currentPage
    ) {
      setCurrentPage(newPage);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchSuggestions(currentPage, searchTerm);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    try {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      };
      return new Date(dateString).toLocaleDateString("id-ID", options);
    } catch (e) {
      return dateString; // Return original if formatting fails
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">Error occurred:</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleRetry}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            {error.includes("login") && (
              <button
                onClick={() => (window.location.href = "/login")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Daftar Saran</h1>
        <p className="text-gray-600">Kelola saran dan masukan dari pelanggan</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, email, atau pesan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pesan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <tr key={suggestion.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(pagination.currentPage - 1) * pagination.limit +
                        index +
                        1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {suggestion.user_full_name || suggestion.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {suggestion.user_email || suggestion.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs break-words">
                        {suggestion.message ? (
                          <span title={suggestion.message}>
                            {suggestion.message.length > 100
                              ? `${suggestion.message.substring(0, 100)}...`
                              : suggestion.message}
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(
                        suggestion.created_at || suggestion.createdAt
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {searchTerm
                      ? "Tidak ada saran yang cocok dengan pencarian"
                      : "Tidak ada data saran"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan{" "}
              <span className="font-medium">
                {(pagination.currentPage - 1) * pagination.limit + 1}
              </span>{" "}
              sampai{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalSarans
                )}
              </span>{" "}
              dari <span className="font-medium">{pagination.totalSarans}</span>{" "}
              hasil
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md border ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {[...Array(Math.min(5, pagination.totalPages))].map(
                  (_, index) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          pageNumber === currentPage
                            ? "bg-blue-500 text-white"
                            : "text-gray-700 hover:bg-gray-50 border"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`px-3 py-1 rounded-md border ${
                  currentPage === pagination.totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Info */}
        <div className="px-6 py-3 bg-gray-50 border-t">
          <p className="text-sm text-gray-600">
            Total Saran:{" "}
            <span className="font-medium">{pagination.totalSarans}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
