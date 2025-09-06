import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../axiosClient";
import Navbar from "../../components/Navbar";
import Swal from "sweetalert2";

function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const navigate = useNavigate();

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount || 0);
  };

  const fetchWishlist = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/wishlist?page=${page}&limit=10`);

      setWishlistItems(response.data.data || []);
      setPagination(
        response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 10,
        }
      );
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal memuat wishlist",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const result = await Swal.fire({
        title: "Hapus dari wishlist?",
        text: "Apakah Anda yakin ingin menghapus produk ini dari wishlist?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
      });

      if (result.isConfirmed) {
        await axiosClient.delete(`/wishlist/${productId}`);

        Swal.fire({
          icon: "success",
          title: "Terhapus",
          text: "Produk dihapus dari wishlist",
          timer: 1500,
          showConfirmButton: false,
        });

        fetchWishlist(pagination.currentPage); // Refresh wishlist data
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal menghapus produk dari wishlist",
      });
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await axiosClient.post(`/cart/${productId}`, { quantity: 1 });

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Produk ditambahkan ke keranjang",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal menambahkan produk ke keranjang",
      });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchWishlist(newPage);
    }
  };

  useEffect(() => {
    fetchWishlist(1);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Tombol Kembali - Ditambahkan di bagian atas */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/list-products")}
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Kembali ke Daftar Produk
            </button>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Wishlist Saya
              </h1>
              {/* Menampilkan jumlah wishlist */}
              {wishlistItems.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {pagination.totalItems} produk dalam wishlist
                </p>
              )}
            </div>
            {wishlistItems.length > 0 && (
              <button
                onClick={() => navigate("/products")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Lanjut Belanja
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Wishlist Anda kosong
              </h3>
              <p className="mt-1 text-gray-500">
                Tambahkan produk favorit Anda ke wishlist untuk menyimpannya.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => navigate("/list-products")}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Jelajahi Produk
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Informasi jumlah dan pagination di bagian atas */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Menampilkan {wishlistItems.length} dari{" "}
                  {pagination.totalItems} produk
                </p>

                {/* Pagination untuk bagian atas (opsional) */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={pagination.currentPage === 1}
                      className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    <span className="text-sm text-gray-600">
                      Halaman {pagination.currentPage} dari{" "}
                      {pagination.totalPages}
                    </span>

                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      className="p-1 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      {item.product_details.image && (
                        <img
                          src={item.product_details.image}
                          alt={item.product_details.name}
                          className="w-full h-48 object-cover cursor-pointer"
                          onClick={() =>
                            navigate(`/products/${item.product_id}`)
                          }
                        />
                      )}
                      <button
                        onClick={() =>
                          handleRemoveFromWishlist(item.product_id)
                        }
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-100 transition-colors"
                        title="Hapus dari wishlist"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-red-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4">
                      <h3
                        className="font-medium text-gray-900 mb-1 cursor-pointer hover:text-blue-600"
                        onClick={() => navigate(`/products/${item.product_id}`)}
                      >
                        {item.product_details.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {item.product_details.category_name}
                      </p>
                      <p className="text-lg font-bold text-blue-600 mb-3">
                        {formatCurrency(item.product_details.price)}
                      </p>
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-sm ${
                            item.product_details.stock > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.product_details.stock > 0
                            ? `Stok: ${item.product_details.stock}`
                            : "Stok Habis"}
                        </span>
                        <button
                          onClick={() => handleAddToCart(item.product_id)}
                          disabled={item.product_details.stock <= 0}
                          className={`px-3 py-1 rounded text-sm ${
                            item.product_details.stock > 0
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {item.product_details.stock > 0
                            ? "Tambah ke Keranjang"
                            : "Stok Habis"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination di bagian bawah */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={pagination.currentPage === 1}
                      className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md ${
                          page === pagination.currentPage
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default WishlistPage;
