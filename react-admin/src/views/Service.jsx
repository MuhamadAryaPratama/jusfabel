import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";

export default function Service() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [imageErrors, setImageErrors] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

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

  const fetchServices = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication required. Please login first.");
      }

      const response = await fetch(`${API_BASE_URL}/api/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
        }

        // Try to get error message from response
        let errorMessage = "Failed to fetch services";
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
        setServices(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch services");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching services:", err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle retry
  const handleRetry = () => {
    setError(null);
    fetchServices();
  };

  // Filter services based on search term
  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle image loading errors
  const handleImageError = (serviceId) => {
    setImageErrors((prev) => ({
      ...prev,
      [serviceId]: true,
    }));
  };

  // Construct full image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If imagePath already starts with http, return as is
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // If imagePath starts with /, add base URL
    if (imagePath.startsWith("/")) {
      return `${API_BASE_URL}${imagePath}`;
    }

    // Otherwise, construct the full path
    return `${API_BASE_URL}/${imagePath}`;
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      setIsDeleting(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error("Authentication required. Please login first.");
        }

        const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete service");
        }

        setServices(services.filter((service) => service.id !== id));
        alert("Service deleted successfully");
      } catch (err) {
        alert(`Error: ${err.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = (serviceId) => {
    navigate(`/service/edit/${serviceId}`);
  };

  // Image component with error handling
  const ServiceImage = ({ service }) => {
    const imageUrl = getImageUrl(service.image);
    const hasError = imageErrors[service.id];

    if (!imageUrl || hasError) {
      return (
        <div className="flex items-center justify-center h-16 w-16 bg-gray-100 rounded-md">
          <ImageIcon className="h-6 w-6 text-gray-400" />
        </div>
      );
    }

    return (
      <img
        className="h-16 w-16 object-cover rounded-md"
        src={imageUrl}
        alt={service.name}
        onError={() => handleImageError(service.id)}
        onLoad={() => {
          // Remove error state if image loads successfully
          setImageErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[service.id];
            return newErrors;
          });
        }}
      />
    );
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Semua Layanan</h1>
        <Link
          to="/service/tambah"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Layanan
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari layanan..."
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
                  Gambar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Layanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedServices.length > 0 ? (
                paginatedServices.map((service, index) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ServiceImage service={service} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div
                        className="max-w-xs truncate"
                        title={service.description}
                      >
                        {service.description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Rp {service.price?.toLocaleString("id-ID") || "0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(service.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="Edit layanan"
                          disabled={isDeleting}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Hapus layanan"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {searchTerm
                      ? "Tidak ada layanan yang cocok dengan pencarian"
                      : "Tidak ada data layanan"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredServices.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan{" "}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              sampai{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredServices.length)}
              </span>{" "}
              dari{" "}
              <span className="font-medium">{filteredServices.length}</span>{" "}
              hasil
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md border ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md border ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
