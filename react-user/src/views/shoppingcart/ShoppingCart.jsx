import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../axiosClient";
import Navbar from "../../components/Navbar";
import Swal from "sweetalert2";

function MyCart() {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    item_count: 0,
    total_quantity: 0,
    total_price: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount || 0);
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/cart");

      setCartItems(response.data.data || []);
      setCartSummary(
        response.data.summary || {
          item_count: 0,
          total_quantity: 0,
          total_price: 0,
        }
      );
    } catch (error) {
      console.error("Error fetching cart:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal memuat keranjang belanja",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        await handleRemoveItem(productId);
        return;
      }

      await axiosClient.put(`/cart/${productId}`, { quantity: newQuantity });

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Jumlah produk diperbarui",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchCart(); // Refresh cart data
    } catch (error) {
      console.error("Error updating quantity:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal memperbarui jumlah produk",
      });
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      const result = await Swal.fire({
        title: "Hapus produk?",
        text: "Apakah Anda yakin ingin menghapus produk ini dari keranjang?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
      });

      if (result.isConfirmed) {
        await axiosClient.delete(`/cart/${productId}`);

        Swal.fire({
          icon: "success",
          title: "Terhapus",
          text: "Produk dihapus dari keranjang",
          timer: 1500,
          showConfirmButton: false,
        });

        fetchCart(); // Refresh cart data
      }
    } catch (error) {
      console.error("Error removing item:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal menghapus produk dari keranjang",
      });
    }
  };

  const handleClearCart = async () => {
    try {
      const result = await Swal.fire({
        title: "Kosongkan keranjang?",
        text: "Apakah Anda yakin ingin mengosongkan seluruh keranjang belanja?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ya, kosongkan!",
        cancelButtonText: "Batal",
      });

      if (result.isConfirmed) {
        await axiosClient.delete("/cart");

        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Keranjang belanja dikosongkan",
          timer: 1500,
          showConfirmButton: false,
        });

        fetchCart(); // Refresh cart data
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal mengosongkan keranjang",
      });
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <button
          onClick={() => navigate("/list-products")}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors mb-6"
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
          Kembali ke Produk
        </button>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                Keranjang Belanja Saya
              </h1>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={handleClearCart}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Kosongkan Keranjang
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : cartItems.length === 0 ? (
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Keranjang belanja kosong
              </h3>
              <p className="mt-1 text-gray-500">
                Tambahkan beberapa produk untuk mulai berbelanja.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => navigate("/list-products")}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Lihat Produk
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-2/3">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produk
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Harga
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {cartItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {item.product_details.image && (
                                <img
                                  src={item.product_details.image}
                                  alt={item.product_details.name}
                                  className="h-16 w-16 object-cover rounded"
                                />
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.product_details.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {item.product_details.category_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Stok: {item.product_details.stock}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.product_details.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.product_id,
                                    item.quantity - 1
                                  )
                                }
                                className="p-1 bg-gray-200 rounded-l-md hover:bg-gray-300"
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="px-3 py-1 bg-white border-y">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.product_id,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1 bg-gray-200 rounded-r-md hover:bg-gray-300"
                                disabled={
                                  item.quantity >= item.product_details.stock
                                }
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(
                              item.product_details.price * item.quantity
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveItem(item.product_id)}
                              className="text-red-600 hover:text-red-900 flex items-center justify-end w-full"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cart Summary */}
              <div className="lg:w-1/3">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Ringkasan Belanja
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Jumlah Barang:</span>
                      <span>{cartSummary.item_count} barang</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Kuantitas:</span>
                      <span>{cartSummary.total_quantity} item</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200 font-medium">
                      <span>Total Harga:</span>
                      <span>{formatCurrency(cartSummary.total_price)}</span>
                    </div>
                    <button
                      onClick={() => navigate("/order-direct")}
                      className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Lanjut ke Pembayaran
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyCart;
