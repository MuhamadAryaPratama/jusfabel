import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import axiosClient from "../../axiosClient";

function Reviews() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userRatings, setUserRatings] = useState([]);
  const navigate = useNavigate();

  // Fungsi helper untuk mengambil rating user
  const fetchUserRatingsForProduct = async (productId) => {
    try {
      console.log("Mencoba endpoint utama...");
      // Coba endpoint utama
      const response = await axiosClient.get(
        `/api/products/${productId}/ratings/me`
      );
      console.log("Berhasil mengambil rating dari endpoint utama");
      return response.data.data || [];
    } catch (error) {
      console.warn("Endpoint utama gagal, mencoba fallback...", error.message);

      try {
        // Fallback: ambil semua ratings user dan filter
        console.log("Mencoba fallback: mengambil semua ratings...");
        const allResponse = await axiosClient.get("/ratings/me");
        const filteredRatings = allResponse.data.data.filter(
          (rating) => rating.product_id === productId
        );
        console.log("Berhasil mengambil rating dari fallback", filteredRatings);
        return filteredRatings || [];
      } catch (fallbackError) {
        console.error("Fallback juga gagal:", fallbackError.message);
        return [];
      }
    }
  };

  // Cek status login dan ambil data user
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Verifikasi token dengan backend
          const response = await axiosClient.get("/auth/me");
          setIsLoggedIn(true);
          setUser(response.data.user);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Mengambil data produk dari API
  useEffect(() => {
    const fetchProducts = async () => {
      if (!isLoggedIn) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axiosClient.get("/products");

        // Handle berbagai format response API
        let productsData = [];

        if (Array.isArray(response.data)) {
          productsData = response.data;
        } else if (response.data && Array.isArray(response.data.products)) {
          productsData = response.data.products;
        } else if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          productsData = response.data.data;
        } else {
          console.error("Format response tidak dikenali:", response.data);
          setMessage({
            type: "error",
            text: "Format data produk tidak valid.",
          });
        }

        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
        setMessage({
          type: "error",
          text: "Gagal memuat daftar produk. Silakan coba lagi nanti.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchProducts();
    }
  }, [isLoggedIn]);

  // Mengambil rating user untuk produk yang dipilih
  useEffect(() => {
    const fetchRatings = async () => {
      if (!selectedProduct || !isLoggedIn) {
        setUserRatings([]);
        return;
      }

      console.log(`Mengambil rating untuk produk: ${selectedProduct.id}`);
      const ratings = await fetchUserRatingsForProduct(selectedProduct.id);
      setUserRatings(ratings);
    };

    fetchRatings();
  }, [selectedProduct, isLoggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi login
    if (!isLoggedIn) {
      setMessage({
        type: "error",
        text: "Anda harus login terlebih dahulu untuk memberikan review",
      });
      navigate("/login");
      return;
    }

    // Validasi form
    if (!selectedProduct) {
      setMessage({ type: "error", text: "Pilih produk terlebih dahulu" });
      return;
    }

    if (rating === 0) {
      setMessage({ type: "error", text: "Berikan rating terlebih dahulu" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      console.log("Mengirim rating...", {
        product_id: selectedProduct.id,
        rating,
        review,
      });

      // Kirim rating ke API - akan membuat rating baru
      const response = await axiosClient.post("/ratings", {
        product_id: selectedProduct.id,
        rating: rating,
        review: review,
      });

      console.log("Rating berhasil dikirim:", response.data);

      setMessage({
        type: "success",
        text: "Rating berhasil dikirim! Terima kasih atas masukan Anda.",
      });

      // Reset form
      setRating(0);
      setReview("");

      // Refresh daftar rating user
      const ratings = await fetchUserRatingsForProduct(selectedProduct.id);
      setUserRatings(ratings);
    } catch (error) {
      console.error("Error submitting rating:", error);

      if (error.response?.status === 401) {
        setMessage({
          type: "error",
          text: "Sesi Anda telah berakhir. Silakan login kembali.",
        });
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem("token");
      } else if (error.response?.status === 400) {
        setMessage({
          type: "error",
          text: error.response.data.message || "Data yang dikirim tidak valid.",
        });
      } else {
        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Gagal mengirim rating. Silakan coba lagi nanti.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login", { state: { from: "/reviews" } });
  };

  // Tampilkan loading saat memeriksa autentikasi
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <p className="mt-4 text-gray-600">Memeriksa autentikasi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar cartCount={cartCount} isLoggedIn={isLoggedIn} user={user} />

      <div className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Beri Rating</h1>
            <p className="mt-2 text-lg text-gray-600">
              Bagikan pengalaman Anda dengan produk kami
            </p>
          </div>

          {message.text && (
            <div
              className={`mb-6 p-4 rounded-md ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : message.type === "error"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {!isLoggedIn ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                  <svg
                    className="h-6 w-6 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Login Diperlukan
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Anda harus login terlebih dahulu untuk memberikan rating pada
                  produk kami.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleLoginRedirect}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Login Sekarang
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <form onSubmit={handleSubmit}>
                    {/* Product Selection */}
                    <div className="mb-6">
                      <label
                        htmlFor="product"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Pilih Produk
                      </label>
                      {isLoading ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
                          <p className="text-gray-500">Memuat produk...</p>
                        </div>
                      ) : products.length === 0 ? (
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
                          <p className="text-gray-500">
                            Tidak ada produk tersedia
                          </p>
                        </div>
                      ) : (
                        <select
                          id="product"
                          value={selectedProduct ? selectedProduct.id : ""}
                          onChange={(e) => {
                            const productId = e.target.value;
                            const product = products.find(
                              (p) => p.id.toString() === productId
                            );
                            setSelectedProduct(product || null);
                            setMessage({ type: "", text: "" });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          required
                        >
                          <option value="">-- Pilih Produk --</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Rating Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            {star <= (hoverRating || rating) ? (
                              <StarIcon className="h-8 w-8 text-yellow-400" />
                            ) : (
                              <StarOutlineIcon className="h-8 w-8 text-gray-300" />
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {rating === 0
                          ? "Pilih bintang untuk memberikan rating"
                          : rating === 1
                          ? "Tidak puas"
                          : rating === 2
                          ? "Kurang puas"
                          : rating === 3
                          ? "Cukup"
                          : rating === 4
                          ? "Puas"
                          : "Sangat puas"}
                      </p>
                    </div>

                    {/* Review Input */}
                    <div className="mb-6">
                      <label
                        htmlFor="review"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Ulasan (opsional)
                      </label>
                      <textarea
                        id="review"
                        rows={4}
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Bagikan pengalaman Anda dengan produk ini..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div>
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !selectedProduct ||
                          rating === 0 ||
                          products.length === 0
                        }
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Mengirim...
                          </>
                        ) : (
                          "Kirim Rating"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Daftar Rating User */}
              {selectedProduct && userRatings.length > 0 && (
                <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Rating Anda untuk {selectedProduct.name}
                    </h2>
                    <div className="space-y-4">
                      {userRatings.map((userRating) => (
                        <div
                          key={userRating.id}
                          className="border-b border-gray-200 pb-4 last:border-b-0"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i}>
                                    {i < userRating.rating ? (
                                      <StarIcon className="h-5 w-5 text-yellow-400" />
                                    ) : (
                                      <StarOutlineIcon className="h-5 w-5 text-gray-300" />
                                    )}
                                  </span>
                                ))}
                              </div>
                              <span className="ml-2 text-sm text-gray-500">
                                {new Date(
                                  userRating.created_at
                                ).toLocaleDateString("id-ID", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                          {userRating.review && (
                            <p className="text-gray-700 mt-2 bg-gray-50 p-3 rounded-md">
                              {userRating.review}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Informasi ketika belum ada rating */}
              {selectedProduct && userRatings.length === 0 && (
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <svg
                      className="h-6 w-6 text-blue-600 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-blue-800">
                      Anda belum memberikan rating untuk {selectedProduct.name}.
                      Berikan rating pertama Anda!
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Mengapa Rating Anda Penting?
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Membantu kami meningkatkan kualitas produk</li>
                    <li>Memberikan panduan bagi pelanggan lain</li>
                    <li>Membangun komunitas yang saling mendukung</li>
                    <li>
                      Anda dapat memberikan rating sebanyak yang Anda inginkan
                    </li>
                    <li>Setiap rating sangat dihargai dan diperhitungkan</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Reviews;
