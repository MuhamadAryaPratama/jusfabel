import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axiosClient from "../../axiosClient";
import {
  ShoppingBagIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Swal from "sweetalert2";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State baru untuk pencarian
  const [isSearching, setIsSearching] = useState(false); // State untuk indikator pencarian
  const navigate = useNavigate();
  const location = useLocation();
  const productGridRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    checkLoginStatus();

    // Clear any post-login actions from location state on first load
    if (location.state && !location.state.fromLogin) {
      navigate(location.pathname, { replace: true });
    }
  }, []);

  useEffect(() => {
    // Hapus handling post-login karena tidak diperlukan lagi
    if (location.state?.fromLogin) {
      // Clear location state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.fromLogin]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedCategory, sortBy, searchTerm]); // Tambahkan searchTerm sebagai dependency

  useEffect(() => {
    // Fetch cart count hanya jika user sudah login
    if (isLoggedIn) {
      fetchCartCount();
      fetchWishlist();
    } else {
      setCartCount(0);
      setWishlist([]);
    }
  }, [isLoggedIn]);

  // Fungsi untuk melakukan pencarian
  const handleSearch = (term) => {
    setSearchTerm(term.toLowerCase());
    setIsSearching(term.length > 0);
  };

  // Fungsi untuk menghapus pencarian
  const clearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const getToken = () => {
    // Cek kedua kemungkinan nama token
    return (
      localStorage.getItem("token") || localStorage.getItem("access_token")
    );
  };

  const removeToken = () => {
    // Hapus kedua kemungkinan nama token
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
  };

  const checkLoginStatus = async () => {
    const token = getToken();
    if (!token) {
      setIsLoggedIn(false);
      setUserInfo(null);
      return;
    }

    try {
      // Gunakan endpoint yang benar dengan authorization header yang sesuai
      const response = await axiosClient.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Login status check response:", response.data); // Debug log

      if (response.data && response.data.success) {
        setIsLoggedIn(true);
        setUserInfo(response.data.user);
      } else {
        setIsLoggedIn(false);
        setUserInfo(null);
        removeToken();
      }
    } catch (error) {
      console.error("Failed to check login status:", error);
      console.error("Error response:", error.response?.data); // Debug log
      setIsLoggedIn(false);
      setUserInfo(null);
      removeToken();
    }
  };

  const fetchCartCount = async () => {
    const token = getToken();
    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const response = await axiosClient.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Cart response:", response.data); // Debug log

      // Updated to match the new cart API structure
      const totalQuantity =
        response.data.summary?.total_quantity ||
        response.data.data?.reduce((total, item) => total + item.quantity, 0) ||
        0;
      setCartCount(totalQuantity);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
      console.error("Cart error response:", error.response?.data); // Debug log

      if (error.response && error.response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        setUserInfo(null);
      }
      setCartCount(0);
    }
  };

  const fetchWishlist = async () => {
    const token = getToken();
    if (!token) {
      setWishlist([]);
      return;
    }

    try {
      const response = await axiosClient.get("/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Wishlist response:", response.data); // Debug log

      if (response.data && response.data.success) {
        const wishlistData = response.data.wishlist || response.data.data || [];
        setWishlist(wishlistData);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      console.error("Wishlist error response:", error.response?.data); // Debug log

      if (error.response && error.response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        setUserInfo(null);
      }
      setWishlist([]);
    }
  };

  const toggleWishlist = async (product) => {
    // Jika user belum login, tampilkan alert untuk login terlebih dahulu
    if (!isLoggedIn) {
      Swal.fire({
        title: "Login Diperlukan",
        text: "Anda harus login terlebih dahulu untuk menambahkan produk ke wishlist",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", { state: { from: location.pathname } });
        }
      });
      return;
    }

    const token = getToken();
    const productId = product._id || product.id;
    const isInWishlist = wishlist.some(
      (item) =>
        (item.product_id || item.product?._id || item.product?.id) === productId
    );

    try {
      if (isInWishlist) {
        // Remove from wishlist
        await axiosClient.delete(`/wishlist/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setWishlist(
          wishlist.filter(
            (item) =>
              (item.product_id || item.product?._id || item.product?.id) !==
              productId
          )
        );

        Swal.fire({
          title: "Dihapus!",
          text: "Produk dihapus dari wishlist",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        // Add to wishlist
        await axiosClient.post(
          `/wishlist/${productId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setWishlist([...wishlist, { product_id: productId, product }]);

        Swal.fire({
          title: "Ditambahkan!",
          text: "Produk ditambahkan ke wishlist",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);

      let errorMessage = isInWishlist
        ? "Gagal menghapus produk dari wishlist"
        : "Gagal menambahkan produk ke wishlist";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Jika error 401, logout user
      if (error.response?.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        setUserInfo(null);
        errorMessage = "Sesi login telah berakhir, silakan login kembali";
      }

      Swal.fire({
        title: "Gagal!",
        text: errorMessage,
        icon: "error",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get("/products");

      if (response.data && response.data.success) {
        let productsData = response.data.products || response.data.data || [];

        if (Array.isArray(productsData)) {
          // Fetch ratings untuk setiap produk
          const productsWithRatings = await Promise.all(
            productsData.map(async (product) => {
              try {
                const ratingsResponse = await axiosClient.get(
                  `/ratings/products/${product._id || product.id}/ratings`
                );

                if (ratingsResponse.data && ratingsResponse.data.success) {
                  const ratings =
                    ratingsResponse.data.ratings ||
                    ratingsResponse.data.data ||
                    [];

                  // Hitung rata-rata rating
                  const totalRating = ratings.reduce(
                    (sum, rating) => sum + rating.rating,
                    0
                  );
                  const averageRating =
                    ratings.length > 0 ? totalRating / ratings.length : 0;

                  // Hitung jumlah review (rating dengan komentar)
                  const reviewCount = ratings.filter(
                    (rating) => rating.comment && rating.comment.trim() !== ""
                  ).length;

                  return {
                    ...product,
                    averageRating,
                    reviewCount,
                    ratingCount: ratings.length,
                  };
                }
              } catch (error) {
                console.error(
                  `Error fetching ratings for product ${
                    product._id || product.id
                  }:`,
                  error
                );
                // Jika gagal, tetap kembalikan produk tanpa rating
                return {
                  ...product,
                  averageRating: 0,
                  reviewCount: 0,
                  ratingCount: 0,
                };
              }

              return {
                ...product,
                averageRating: 0,
                reviewCount: 0,
                ratingCount: 0,
              };
            })
          );

          setProducts(productsWithRatings);
        } else {
          console.error("Products data is not an array:", productsData);
          setError("Format data produk tidak valid");
          setProducts([]);
        }
      } else {
        setError("Gagal memuat data produk");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Terjadi kesalahan saat memuat produk");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get("/categories");
      if (response.data && response.data.success) {
        const categoriesData =
          response.data.categories || response.data.data || [];

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.error("Categories data is not an array:", categoriesData);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filterAndSortProducts = () => {
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products];

    // Filter berdasarkan kategori
    if (selectedCategory !== "all") {
      const categoryId = parseInt(selectedCategory);
      filtered = filtered.filter(
        (product) => product && product.category_id === categoryId
      );
    }

    // Filter berdasarkan pencarian :cite[1]:cite[5]
    if (searchTerm) {
      filtered = filtered.filter((product) => {
        // Cari di nama produk
        const nameMatch =
          product.name && product.name.toLowerCase().includes(searchTerm);

        // Cari di deskripsi produk
        const descMatch =
          product.description &&
          product.description.toLowerCase().includes(searchTerm);

        // Cari di kategori produk (jika ada informasi kategori)
        const categoryMatch =
          product.category_name &&
          product.category_name.toLowerCase().includes(searchTerm);

        return nameMatch || descMatch || categoryMatch;
      });
    }

    // Urutkan produk
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />
        );
      } else {
        stars.push(<StarIcon key={i} className="w-4 h-4 text-yellow-400" />);
      }
    }

    return stars;
  };

  const handleOrder = (product) => {
    // Jika user belum login, tampilkan alert untuk login terlebih dahulu
    if (!isLoggedIn) {
      Swal.fire({
        title: "Login Diperlukan",
        text: "Anda harus login terlebih dahulu untuk memesan produk",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", {
            state: {
              from: location.pathname,
              product: {
                id: product._id || product.id,
                name: product.name,
                price: product.price,
                image: product.image,
              },
            },
          });
        }
      });
      return;
    }

    // Jika sudah login, lanjutkan ke halaman order
    navigate("/order", {
      state: {
        product: {
          id: product._id || product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        },
        user: userInfo,
      },
    });
  };

  const addToCart = async (product) => {
    // Jika user belum login, tampilkan alert untuk login terlebih dahulu
    if (!isLoggedIn) {
      Swal.fire({
        title: "Login Diperlukan",
        text: "Anda harus login terlebih dahulu untuk menambahkan produk ke keranjang",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Login",
        cancelButtonText: "Batal",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", { state: { from: location.pathname } });
        }
      });
      return;
    }

    const token = getToken();

    try {
      // Use the shopping cart API endpoint to add product to cart
      await axiosClient.post(
        `/cart/${product._id || product.id}`,
        {
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire({
        title: "Berhasil!",
        text: "Produk berhasil ditambahkan ke keranjang",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh cart count
      fetchCartCount();
    } catch (error) {
      console.error("Error adding to cart:", error);
      console.error("Add to cart error response:", error.response?.data); // Debug log

      let errorMessage = "Gagal menambahkan produk ke keranjang";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes("stock")) {
        errorMessage = "Stok produk tidak mencukupi";
      } else if (
        error.message.includes("not found") ||
        error.message.includes("not available")
      ) {
        errorMessage = "Produk tidak ditemukan atau tidak tersedia";
      }

      // Jika error 401, logout user
      if (error.response?.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        setUserInfo(null);
        errorMessage = "Sesi login telah berakhir, silakan login kembali";
      }

      Swal.fire({
        title: "Gagal!",
        text: errorMessage,
        icon: "error",
      });
    }
  };

  const viewProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar cartCount={cartCount} isLoggedIn={isLoggedIn} />
        <div className="flex-grow flex items-center justify-center py-12">
          <div className="text-center animate-fadeIn">
            <ArrowPathIcon className="w-12 h-12 text-orange-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Memuat produk...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar cartCount={cartCount} isLoggedIn={isLoggedIn} />
        <div className="flex-grow flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-4 animate-fadeIn">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Terjadi Kesalahan
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchProducts}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Coba Lagi
              </button>
              <Link
                to="/"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar cartCount={cartCount} isLoggedIn={isLoggedIn} />

      {/* Header */}
      <div className="bg-white shadow-sm animate-slideDown">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Semua Produk
          </h1>
          <p className="text-gray-600">
            Temukan berbagai pilihan jus sehat dan segar
          </p>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="container mx-auto px-4 pt-6 lg:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg mb-4"
        >
          <FunnelIcon className="w-5 h-5" />
          {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
        </button>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex-grow flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div
          className={`lg:w-64 mb-6 lg:mb-0 ${
            showFilters ? "block" : "hidden lg:block"
          } animate-fadeIn`}
        >
          <div className="bg-white p-4 rounded-xl shadow-md sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              Filter Produk
            </h2>

            {/* Search Input - Ditambahkan di sidebar filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Produk
              </label>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Cari nama, deskripsi, atau kategori..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((category) => (
                    <option
                      key={category._id || category.id}
                      value={category._id || category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urutkan Berdasarkan
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="name">Nama A-Z</option>
                  <option value="price-low">Harga Terendah</option>
                  <option value="price-high">Harga Tertinggi</option>
                  <option value="rating">Rating Tertinggi</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Content */}
        <div className="flex-grow">
          {/* Search Bar untuk tampilan mobile - Ditambahkan di atas hasil pencarian */}
          <div className="lg:hidden mb-6">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Produk
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Cari nama, deskripsi, atau kategori..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <p className="text-gray-600 mb-2 sm:mb-0">
                Menampilkan {filteredProducts.length} produk
                {selectedCategory !== "all" &&
                  ` dalam kategori "${
                    categories.find(
                      (c) => (c._id || c.id) === parseInt(selectedCategory)
                    )?.name || selectedCategory
                  }"`}
                {searchTerm && ` untuk pencarian "${searchTerm}"`}
              </p>

              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="flex items-center text-sm text-orange-600 hover:text-orange-700"
                >
                  <XMarkIcon className="w-4 h-4 mr-1" />
                  Hapus pencarian
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {!filteredProducts || filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md animate-fadeIn">
              <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                {searchTerm
                  ? `Tidak ada produk yang ditemukan untuk "${searchTerm}"`
                  : "Tidak ada produk yang ditemukan"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Hapus Pencarian
                  </button>
                )}
                {selectedCategory !== "all" && (
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Tampilkan Semua Produk
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              ref={productGridRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12"
            >
              {filteredProducts.map((product, index) => {
                const productId = product._id || product.id;
                const isInWishlist = wishlist.some(
                  (item) =>
                    (item.product_id ||
                      item.product?._id ||
                      item.product?.id) === productId
                );

                return (
                  <div
                    key={productId}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeInUp"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative group">
                      <img
                        src={product.image || "/api/placeholder/300/200"}
                        alt={product.name}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia";
                        }}
                      />
                      {product.is_popular && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold animate-pulse">
                          Populer
                        </div>
                      )}

                      {/* Wishlist Button */}
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors z-10"
                        title={
                          isInWishlist
                            ? "Hapus dari Wishlist"
                            : "Tambah ke Wishlist"
                        }
                      >
                        {isInWishlist ? (
                          <HeartIconSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-gray-600 hover:text-red-500" />
                        )}
                      </button>

                      {/* View Detail Button */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => viewProductDetail(productId)}
                          className="bg-white text-orange-600 p-2 rounded-full hover:bg-orange-600 hover:text-white transition-colors"
                          title="Lihat Detail"
                        >
                          <EyeIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3
                        className="font-semibold text-lg text-gray-800 mb-2 line-clamp-1 cursor-pointer hover:text-orange-600 transition-colors"
                        onClick={() => viewProductDetail(productId)}
                      >
                        {product.name || "Nama Produk Tidak Tersedia"}
                      </h3>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description || "Tidak ada deskripsi"}
                      </p>

                      {/* Rating Section */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                          {renderStars(product.averageRating || 0)}
                          <span className="text-sm text-gray-600 ml-1">
                            ({product.ratingCount || 0})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-orange-600">
                          {formatPrice(product.price)}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => addToCart(product)}
                            className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-110"
                            title="Tambah ke Keranjang"
                          >
                            <ShoppingBagIcon className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => handleOrder(product)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 text-sm font-semibold"
                          >
                            Pesan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Products;
