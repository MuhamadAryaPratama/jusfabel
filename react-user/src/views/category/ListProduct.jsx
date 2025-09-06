import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import axiosClient from "../../axiosClient";
import Swal from "sweetalert2";
import {
  EyeIcon,
  HeartIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/solid";

export default function ListProduct() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const categoryName = searchParams.get("category");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(categoryName || "");
  const [addingToCart, setAddingToCart] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wishlist, setWishlist] = useState([]);

  const itemsPerPage = 12;

  // Utility functions
  const getToken = () => {
    return (
      localStorage.getItem("token") || localStorage.getItem("access_token")
    );
  };

  const removeToken = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
  };

  // Fungsi untuk memformat angka ke format Rupiah
  const formatRupiah = (angka) => {
    if (!angka) return "Rp 0";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // Check login status
  const checkLoginStatus = () => {
    const token = getToken();
    setIsLoggedIn(!!token);
  };

  // Fetch wishlist
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

      if (response.data && response.data.success) {
        const wishlistData = response.data.wishlist || response.data.data || [];
        setWishlist(wishlistData);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      if (error.response && error.response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
      }
      setWishlist([]);
    }
  };

  // Toggle wishlist
  const toggleWishlist = async (product) => {
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
    const productId = product.id || product._id;
    const isInWishlist = wishlist.some(
      (item) =>
        (item.product_id || item.product?._id || item.product?.id) === productId
    );

    try {
      if (isInWishlist) {
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
      Swal.fire({
        title: "Gagal!",
        text: "Terjadi kesalahan saat mengupdate wishlist",
        icon: "error",
      });
    }
  };

  // View product detail - DIPERBAIKI: Menggunakan navigate ke halaman detail produk
  const viewProductDetail = (productId) => {
    navigate(`/products/${productId}`);
  };

  useEffect(() => {
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

        const totalJumlah =
          response.data.summary?.total_quantity ||
          response.data.data?.reduce(
            (total, item) => total + (item.jumlah || item.quantity),
            0
          ) ||
          0;
        setCartCount(totalJumlah);
      } catch (error) {
        console.error("Failed to fetch cart count:", error);
        if (error.response && error.response.status === 401) {
          removeToken();
          setIsLoggedIn(false);
        }
        setCartCount(0);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axiosClient.get("/categories");
        const categoriesData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      }
    };

    checkLoginStatus();
    fetchCartCount();
    fetchCategories();
    if (isLoggedIn) {
      fetchWishlist();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `/products?page=${currentPage}&limit=${itemsPerPage}`;

        if (selectedCategory) {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }

        url += `&sort=${sortBy}&order=${sortOrder}`;

        const response = await axiosClient.get(url);
        const productsData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        // Fetch ratings untuk setiap produk
        const productsWithRatings = await Promise.all(
          productsData.map(async (product) => {
            try {
              const ratingsResponse = await axiosClient.get(
                `/ratings/products/${product.id || product._id}/ratings`
              );

              if (ratingsResponse.data && ratingsResponse.data.success) {
                const ratings =
                  ratingsResponse.data.ratings ||
                  ratingsResponse.data.data ||
                  [];

                const totalRating = ratings.reduce(
                  (sum, rating) => sum + rating.rating,
                  0
                );
                const averageRating =
                  ratings.length > 0 ? totalRating / ratings.length : 0;

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
                  product.id || product._id
                }:`,
                error
              );
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
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setError("Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, sortBy, sortOrder, currentPage]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);

    const params = new URLSearchParams();
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    navigate(`/products?${params.toString()}`, { replace: true });
  };

  const handleSortChange = (sortField) => {
    if (sortField === sortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(sortField);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleAddToCart = async (product) => {
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

    const productId = product.id || product._id;
    setAddingToCart((prev) => ({ ...prev, [productId]: true }));

    try {
      const token = getToken();

      await axiosClient.post(
        `/cart/${productId}`,
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
      const response = await axiosClient.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const totalJumlah =
        response.data.summary?.total_quantity ||
        response.data.data?.reduce(
          (total, item) => total + (item.jumlah || item.quantity),
          0
        ) ||
        0;
      setCartCount(totalJumlah);
    } catch (error) {
      console.error("Failed to add product to cart:", error);

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

      if (error.response && error.response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        errorMessage = "Sesi login telah berakhir, silakan login kembali";
        navigate("/login", { state: { from: location.pathname } });
      }

      Swal.fire({
        title: "Gagal!",
        text: errorMessage,
        icon: "error",
      });
    } finally {
      setAddingToCart((prev) => ({ ...prev, [productId]: false }));
    }
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

  const sortedAndFilteredProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "price") {
        return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
      } else if (sortBy === "rating") {
        return sortOrder === "asc"
          ? (a.averageRating || 0) - (b.averageRating || 0)
          : (b.averageRating || 0) - (a.averageRating || 0);
      }
      return 0;
    });
  }, [products, sortBy, sortOrder]);

  const paginationButtons = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    paginationButtons.push(
      <button
        key={1}
        onClick={() => setCurrentPage(1)}
        className={`px-3 py-1 rounded ${
          1 === currentPage
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        } border border-gray-300`}
      >
        1
      </button>
    );
    if (startPage > 2) {
      paginationButtons.push(
        <span key="ellipsis-start" className="px-2 py-1">
          ...
        </span>
      );
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationButtons.push(
      <button
        key={i}
        onClick={() => setCurrentPage(i)}
        className={`px-3 py-1 rounded ${
          i === currentPage
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        } border border-gray-300`}
      >
        {i}
      </button>
    );
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationButtons.push(
        <span key="ellipsis-end" className="px-2 py-1">
          ...
        </span>
      );
    }
    paginationButtons.push(
      <button
        key={totalPages}
        onClick={() => setCurrentPage(totalPages)}
        className={`px-3 py-1 rounded ${
          totalPages === currentPage
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        } border border-gray-300`}
      >
        {totalPages}
      </button>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <head>
        <title>
          {selectedCategory
            ? `${selectedCategory} Products - Jusfabel`
            : "All Products - Jusfabel"}
        </title>
        <meta
          name="description"
          content={`Browse our collection of ${
            selectedCategory || "all"
          } products at Jusfabel. Find the perfect items for your home.`}
        />
      </head>

      <Navbar cartCount={cartCount} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <nav className="text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex">
            <li className="flex items-center">
              <button
                onClick={() => navigate("/")}
                className="hover:text-blue-600 transition-colors"
              >
                Home
              </button>
              <span className="mx-2">/</span>
            </li>
            <li className="flex items-center">
              <span className="text-gray-800 font-medium">
                {selectedCategory ? selectedCategory : "All Products"}
              </span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 bg-white p-6 rounded-lg shadow-md h-fit sticky top-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleCategoryChange("")}
                className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                  !selectedCategory
                    ? "bg-blue-100 text-blue-700 font-medium border border-blue-300"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.name)}
                  className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedCategory === category.name
                      ? "bg-blue-100 text-blue-700 font-medium border border-blue-300"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {selectedCategory
                  ? `${selectedCategory} Products`
                  : "All Products"}
                <span className="text-gray-600 text-lg font-normal ml-2">
                  ({products.length} products)
                </span>
              </h1>

              <div className="flex items-center gap-3">
                <span className="text-gray-700 text-sm">Sort by:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="rating-desc">Rating (Highest)</option>
                  <option value="rating-asc">Rating (Lowest)</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="text-center py-12">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
                  aria-label="Loading products"
                ></div>
                <p className="text-gray-600 mt-4">Loading products...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 p-6 rounded-lg mb-8 text-center">
                <svg
                  className="w-12 h-12 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-red-800 font-medium hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-4xl mb-4" aria-hidden="true">
                  🛍️
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600">
                  {selectedCategory
                    ? `We couldn't find any products in the "${selectedCategory}" category.`
                    : "No products available at the moment."}
                </p>
                {selectedCategory && (
                  <button
                    onClick={() => handleCategoryChange("")}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    View all products
                  </button>
                )}
              </div>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {sortedAndFilteredProducts.map((product) => {
                    const productId = product.id || product._id;
                    const isInWishlist = wishlist.some(
                      (item) =>
                        (item.product_id ||
                          item.product?._id ||
                          item.product?.id) === productId
                    );

                    return (
                      <div
                        key={productId}
                        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group relative"
                      >
                        {/* Wishlist Button */}
                        <button
                          onClick={() => toggleWishlist(product)}
                          className="absolute top-2 right-2 z-10 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                          title={
                            isInWishlist
                              ? "Remove from wishlist"
                              : "Add to wishlist"
                          }
                        >
                          {isInWishlist ? (
                            <HeartIconSolid className="w-5 h-5 text-red-500" />
                          ) : (
                            <HeartIcon className="w-5 h-5 text-gray-600 hover:text-red-500" />
                          )}
                        </button>

                        <div
                          className="h-48 bg-gray-200 overflow-hidden cursor-pointer relative"
                          onClick={() => viewProductDetail(productId)}
                        >
                          <img
                            src={product.image || "/api/placeholder/300/300"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=658&q=80";
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>

                          {/* View Detail Button */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewProductDetail(productId);
                              }}
                              className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-colors"
                              title="View details"
                            >
                              <EyeIcon className="w-6 h-6" />
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          <h3
                            className="font-semibold text-lg mb-1 cursor-pointer hover:text-blue-600 transition-colors line-clamp-1"
                            onClick={() => viewProductDetail(productId)}
                          >
                            {product.name}
                          </h3>

                          {/* Rating Section */}
                          <div className="flex items-center gap-1 mb-2">
                            {renderStars(product.averageRating || 0)}
                            <span className="text-sm text-gray-600">
                              ({product.ratingCount || 0})
                            </span>
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
                            {product.description}
                          </p>

                          <div className="flex justify-between items-center">
                            <span className="text-blue-600 font-bold">
                              {formatRupiah(product.price)}
                            </span>
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={addingToCart[productId]}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                              aria-label={`Add ${product.name} to cart`}
                            >
                              {addingToCart[productId] ? (
                                <>
                                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <ShoppingBagIcon className="w-4 h-4 mr-1" />
                                  Add to Cart
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-100 border border-gray-300 transition-colors flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Previous
                    </button>

                    <div className="flex gap-1">{paginationButtons}</div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-100 border border-gray-300 transition-colors flex items-center"
                    >
                      Next
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
