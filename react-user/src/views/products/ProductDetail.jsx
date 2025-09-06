import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosClient from "../../axiosClient";
import {
  ShoppingBagIcon,
  ArrowLeftIcon,
  StarIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Swal from "sweetalert2";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

  // Fungsi untuk mendapatkan token
  const getToken = () => {
    return (
      localStorage.getItem("token") || localStorage.getItem("access_token")
    );
  };

  // Fungsi untuk menghapus token
  const removeToken = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
  };

  useEffect(() => {
    fetchProduct();
    checkLoginStatus();
  }, [id]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCartCount();
      checkWishlistStatus();
    }
  }, [isLoggedIn, id]);

  const checkLoginStatus = async () => {
    const token = getToken();
    if (!token) {
      setIsLoggedIn(false);
      setUserInfo(null);
      return;
    }

    try {
      const response = await axiosClient.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

      // Updated to match the new cart API structure
      const totalQuantity =
        response.data.summary?.total_quantity ||
        response.data.data?.reduce((total, item) => total + item.quantity, 0) ||
        0;
      setCartCount(totalQuantity);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
      if (error.response && error.response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        setUserInfo(null);
      }
      setCartCount(0);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get(`/products/${id}`);

      if (response.data && response.data.success) {
        const productData = response.data.data || response.data.product;
        setProduct(productData);

        // Fetch related products
        fetchRelatedProducts(productData.category_id, productData.id);

        // Fetch reviews
        fetchReviews(productData.id);
      } else {
        setError("Produk tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      if (error.response && error.response.status === 404) {
        setError("Produk tidak ditemukan");
      } else {
        setError("Terjadi kesalahan saat memuat produk");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (categoryId, excludeProductId) => {
    try {
      const response = await axiosClient.get(
        `/products?category_id=${categoryId}&limit=4`
      );
      if (response.data && response.data.success) {
        const products = response.data.data || response.data.products || [];
        // Filter out the current product
        const filteredProducts = products.filter(
          (p) => p.id !== excludeProductId && p._id !== excludeProductId
        );
        setRelatedProducts(filteredProducts.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const fetchReviews = async (productId) => {
    try {
      const response = await axiosClient.get(
        `/ratings/products/${productId}/ratings`
      );
      if (response.data && response.data.success) {
        const reviewsData = response.data.data || response.data.ratings || [];
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const checkWishlistStatus = async () => {
    const token = getToken();
    if (!token) {
      setIsInWishlist(false);
      return;
    }

    try {
      const response = await axiosClient.get("/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        const wishlistItems =
          response.data.wishlist || response.data.data || [];
        const isInWishlist = wishlistItems.some(
          (item) =>
            item.product_id === parseInt(id) ||
            item.product_id?._id === id ||
            (item.product &&
              (item.product.id === parseInt(id) || item.product._id === id))
        );
        setIsInWishlist(isInWishlist);
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
      if (error.response && error.response.status === 401) {
        removeToken();
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    }
  };

  const toggleWishlist = async () => {
    const token = getToken();
    if (!token) {
      Swal.fire({
        title: "Login Diperlukan",
        text: "Anda harus login terlebih dahulu untuk menambah produk ke wishlist",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Login Sekarang",
        cancelButtonText: "Nanti Saja",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", {
            state: { returnUrl: `/products/${id}` },
          });
        }
      });
      return;
    }

    try {
      if (isInWishlist) {
        await axiosClient.delete(`/wishlist/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsInWishlist(false);
        Swal.fire({
          title: "Dihapus!",
          text: "Produk dihapus dari wishlist",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await axiosClient.post(
          `/wishlist/${id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setIsInWishlist(true);
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

  const addToCart = async () => {
    const token = getToken();
    if (!token) {
      Swal.fire({
        title: "Login Diperlukan",
        text: "Anda harus login terlebih dahulu untuk menambah produk ke keranjang",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Login Sekarang",
        cancelButtonText: "Nanti Saja",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", {
            state: { returnUrl: `/products/${id}` },
          });
        }
      });
      return;
    }

    try {
      await axiosClient.post(
        `/cart/${id}`,
        {
          quantity: quantity,
          size_id: selectedSize?.size_id || null,
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

      fetchCartCount();
    } catch (error) {
      console.error("Error adding to cart:", error);

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

  const handleOrder = () => {
    const token = getToken();
    if (!token) {
      Swal.fire({
        title: "Login Diperlukan",
        text: "Anda harus login terlebih dahulu untuk melakukan pemesanan",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Login Sekarang",
        cancelButtonText: "Nanti Saja",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", {
            state: {
              returnUrl: `/products/${id}`,
              action: "order",
              product: {
                id: product.id || product._id,
                name: product.name,
                price: selectedSize
                  ? product.price + (selectedSize.additional_price || 0)
                  : product.price,
                image: product.image,
                size: selectedSize,
              },
            },
          });
        }
      });
      return;
    }

    navigate(`/order`, {
      state: {
        product: {
          id: product.id || product._id,
          name: product.name,
          price: selectedSize
            ? product.price + (selectedSize.additional_price || 0)
            : product.price,
          image: product.image,
          size: selectedSize,
        },
        quantity: quantity,
        user: userInfo,
      },
    });
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing:", error));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          Swal.fire({
            title: "Tautan Disalin!",
            text: "Tautan produk telah disalin ke clipboard",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        })
        .catch((error) => {
          console.error("Error copying to clipboard:", error);
        });
    }
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
          <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />
        );
      } else {
        stars.push(<StarIcon key={i} className="w-5 h-5 text-yellow-400" />);
      }
    }

    return stars;
  };

  const calculateTotalPrice = () => {
    const basePrice = product.price || 0;
    const sizeAdditional = selectedSize
      ? selectedSize.additional_price || 0
      : 0;
    return (basePrice + sizeAdditional) * quantity;
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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar cartCount={cartCount} isLoggedIn={isLoggedIn} />
        <div className="flex-grow flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-4 animate-fadeIn">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Terjadi Kesalahan
            </h3>
            <p className="text-gray-600 mb-6">
              {error || "Produk tidak ditemukan"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchProduct}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Coba Lagi
              </button>
              <Link
                to="/products"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Kembali ke Produk
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

      {/* Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex text-sm text-gray-600">
            <Link to="/" className="hover:text-orange-600 transition-colors">
              Beranda
            </Link>
            <span className="mx-2">/</span>
            <Link
              to="/products"
              className="hover:text-orange-600 transition-colors"
            >
              Produk
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-grow">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Kembali
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="mb-4">
              <img
                src={product.image || "/api/placeholder/500/500"}
                alt={product.name}
                className="w-full h-80 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/500x500?text=Gambar+Tidak+Tersedia";
                }}
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {product.name}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={toggleWishlist}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title={
                    isInWishlist ? "Hapus dari Wishlist" : "Tambah ke Wishlist"
                  }
                >
                  {isInWishlist ? (
                    <HeartIconSolid className="w-6 h-6 text-red-500" />
                  ) : (
                    <HeartIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {renderStars(product.average_rating || 0)}
              </div>
              <span className="text-sm text-gray-600">
                ({product.total_ratings || 0} rating,{" "}
                {product.total_reviews || 0} ulasan)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-orange-600">
                {formatPrice(calculateTotalPrice() / quantity)}
              </span>
              {selectedSize && selectedSize.additional_price > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  Harga dasar: {formatPrice(product.price)} + ukuran:{" "}
                  {formatPrice(selectedSize.additional_price)}
                </div>
              )}
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Pilih Ukuran
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.size_id}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        selectedSize?.size_id === size.size_id
                          ? "border-orange-600 bg-orange-50 text-orange-700"
                          : "border-gray-300 hover:border-orange-400"
                      }`}
                    >
                      <div className="text-sm font-medium">{size.name}</div>
                      {size.additional_price > 0 && (
                        <div className="text-xs">
                          + {formatPrice(size.additional_price)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Jumlah
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                    className="px-3 py-2 text-gray-600 hover:text-orange-600 transition-colors"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    +
                  </button>
                </div>
                <span className="text-gray-600">
                  Stok:{" "}
                  {selectedSize ? selectedSize.stock || 0 : product.stock || 0}
                </span>
              </div>
            </div>

            {/* Total Price */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatPrice(calculateTotalPrice())}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={addToCart}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Tambah ke Keranjang
              </button>
              <button
                onClick={handleOrder}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Deskripsi Produk
          </h2>
          <div className="prose max-w-none text-gray-600">
            {product.description || "Tidak ada deskripsi produk."}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Ulasan Pelanggan
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada ulasan untuk produk ini.
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id || review._id}
                  className="border-b border-gray-100 pb-6 last:border-0"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold">
                        {review.user_name
                          ? review.user_name.charAt(0).toUpperCase()
                          : "U"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {review.user_name || "User"}
                      </h4>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>
                  {review.review && (
                    <p className="text-gray-600 mt-2">{review.review}</p>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Produk Terkait
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id || relatedProduct._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <Link
                    to={`/products/${relatedProduct.id || relatedProduct._id}`}
                  >
                    <img
                      src={relatedProduct.image || "/api/placeholder/300/200"}
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200?text=Gambar+Tidak+Tersedia";
                      }}
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-orange-600 font-bold">
                        {formatPrice(relatedProduct.price)}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default ProductDetail;
