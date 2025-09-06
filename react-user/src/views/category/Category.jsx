import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../axiosClient";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCartCount();
    checkLoginStatus();
  }, []);

  const checkLoginStatus = () => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/categories");

      // Handle berbagai format respons API
      let categoriesData = [];

      if (Array.isArray(response.data)) {
        // Format 1: API mengembalikan array langsung
        categoriesData = response.data;
      } else if (
        response.data.categories &&
        Array.isArray(response.data.categories)
      ) {
        // Format 2: API mengembalikan object dengan property categories
        categoriesData = response.data.categories;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Format 3: API mengembalikan object dengan property data
        categoriesData = response.data.data;
      } else {
        console.error("Format respons API tidak dikenali:", response.data);
        throw new Error("Format data tidak valid");
      }

      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Gagal memuat kategori. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const response = await axiosClient.get("/cart");
      // Handle berbagai format respons cart
      let cartItems = [];

      if (Array.isArray(response.data)) {
        cartItems = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        cartItems = response.data.data;
      } else if (response.data.items && Array.isArray(response.data.items)) {
        cartItems = response.data.items;
      }

      const totalJumlah = cartItems.reduce(
        (total, item) => total + (item.jumlah || item.quantity || 0),
        0
      );
      setCartCount(totalJumlah);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("access_token");
        setIsLoggedIn(false);
      }
      setCartCount(0);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar cartCount={cartCount} />
        <div className="flex-grow bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar cartCount={cartCount} />
        <div className="flex-grow bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchCategories}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar cartCount={cartCount} />
      <div className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Kategori Produk
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Temukan berbagai kategori produk jus yang segar dan sehat untuk
              kebutuhan Anda.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">Belum ada kategori yang tersedia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id || category._id || category.name}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <Link
                      to={`/products?category=${category.name}`}
                      className="inline-block bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                    >
                      Lihat Produk
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Category;
