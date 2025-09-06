import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosClient from "../axiosClient";
import Swal from "sweetalert2";

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get API base URL
  const API_BASE_URL = axiosClient.defaults.baseURL || "http://localhost:5000";

  // Handle image loading errors
  const handleImageError = (serviceId) => {
    setImageErrors((prev) => ({ ...prev, [serviceId]: true }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const servicesResponse = await axiosClient.get("/services");
        setServices(servicesResponse.data.data || []);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        setError("Gagal memuat data layanan. Silakan coba lagi nanti.");
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format price to IDR currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Function to construct proper image URL untuk gambar dari backend
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // Jika path sudah full URL (http/https)
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // Jika path dimulai dengan /uploads (dari backend)
    if (imagePath.startsWith("/uploads")) {
      return `${API_BASE_URL}${imagePath}`;
    }

    // Default case (jika path relatif)
    return `${API_BASE_URL}/uploads/${imagePath}`;
  };

  // Service Image component
  const ServiceImage = ({ service }) => {
    const imageUrl = getImageUrl(service.image);
    const hasError = imageErrors[service.id];

    if (!imageUrl || hasError) {
      return (
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-4">
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-blue-500 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-blue-600 text-sm font-medium">Service Image</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-48 mb-4 overflow-hidden rounded-lg bg-gray-100">
        <img
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          src={imageUrl}
          alt={service.name}
          onError={() => handleImageError(service.id)}
          onLoad={() => {
            setImageErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[service.id];
              return newErrors;
            });
          }}
        />
      </div>
    );
  };

  // Rest of the component remains the same...
  const handleServiceClick = (service) => {
    const token = localStorage.getItem("token");

    if (!token) {
      sessionStorage.setItem("selectedService", JSON.stringify(service));
      sessionStorage.setItem("redirectFrom", "/booking");

      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Silakan login terlebih dahulu untuk melakukan booking",
        confirmButtonText: "Login",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", {
            state: {
              from: { pathname: "/services" },
              selectedService: service,
            },
          });
        }
      });
    } else {
      navigate("/booking", {
        state: {
          selectedService: service,
        },
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const servicesResponse = await axiosClient.get("/services");
        setServices(servicesResponse.data.data || []);
      } catch (error) {
        console.error("Failed to fetch services:", error);
        setError("Gagal memuat data layanan. Silakan coba lagi nanti.");
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  };

  const whyChoose = [
    {
      icon: "👥",
      title: "Teknisi Berpengalaman",
      description:
        "Tim teknisi profesional dengan sertifikat dan pengalaman bertahun-tahun",
    },
    {
      icon: "⚡",
      title: "Service Cepat",
      description: "Layanan cepat dan efisien dengan kualitas terjamin",
    },
    {
      icon: "🏆",
      title: "Sparepart Berkualitas",
      description: "Menggunakan spare part original dan berkualitas tinggi",
    },
    {
      icon: "💰",
      title: "Harga Terjangkau",
      description: "Harga pas di kantong dengan kualitas service terdepan",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat layanan...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Layanan Service Terlengkap
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Dari perawatan rutin hingga perbaikan darurat, kami menyediakan
            layanan service kendaraan yang komprehensif dengan teknisi
            berpengalaman
          </p>
        </div>
      </div>

      {/* Services Section */}
      <div className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
          Pilihan Layanan Kami
        </h2>

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <svg
                className="h-12 w-12 text-red-500 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Gagal Memuat Layanan
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && services.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
              <svg
                className="h-12 w-12 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Belum Ada Layanan
              </h3>
              <p className="text-gray-600">
                Layanan sedang dalam tahap persiapan. Silakan kembali lagi
                nanti.
              </p>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {!error && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative"
              >
                {service.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* Service Image - Now properly displayed */}
                  <ServiceImage service={service} />

                  {/* Service Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {service.description}
                    </p>
                  </div>

                  {/* Features */}
                  {service.features && service.features.length > 0 && (
                    <ul className="mb-4 pl-5">
                      {service.features.map((feature, index) => (
                        <li
                          key={index}
                          className="text-gray-600 text-sm list-disc mb-1"
                        >
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Price and Book Button */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 mb-5">
                      {formatPrice(service.price)}
                    </p>
                    <button
                      onClick={() => handleServiceClick(service)}
                      className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                    >
                      Book Service
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Why Choose AutoCare Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Mengapa Pilih AutoCare?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              AutoCare terpercaya memberikan service terbaik dengan teknisi
              berpengalaman
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChoose.map((item, index) => (
              <div
                key={index}
                className="text-center p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4 bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ServicesPage;
