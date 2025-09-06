import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Navbar from "./Navbar";
import Footer from "./Footer";
import axiosClient from "../axiosClient";
import { useNavigate, useLocation } from "react-router-dom";

function OrderFormDirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    item_count: 0,
    total_quantity: 0,
    total_price: 0,
  });
  const [userInfo, setUserInfo] = useState(null);

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    notes: "",
  });

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem("token") || localStorage.getItem("access_token");
        if (!token) {
          Swal.fire({
            icon: "warning",
            title: "Login Diperlukan",
            text: "Silakan login terlebih dahulu untuk melakukan pemesanan",
            confirmButtonText: "Login",
          }).then(() => {
            navigate("/login", {
              state: { returnUrl: "/order-direct" },
            });
          });
          return;
        }

        // Fetch user data
        const userResponse = await axiosClient.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.data && userResponse.data.success) {
          const userData = userResponse.data.user;
          setUserInfo(userData);

          // Pre-fill form dengan nama field yang benar
          setFormData({
            customer_name: userData.full_name || userData.name || "",
            customer_email: userData.email || "",
            customer_phone: userData.phone || "",
            customer_address: userData.address || "",
            notes: "",
          });
        }

        // Fetch cart data
        const cartResponse = await axiosClient.get("/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCartItems(cartResponse.data.data || []);
        setCartSummary(
          cartResponse.data.summary || {
            item_count: 0,
            total_quantity: 0,
            total_price: 0,
          }
        );
      } catch (error) {
        console.error("Error fetching data:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");

          Swal.fire({
            icon: "warning",
            title: "Sesi Berakhir",
            text: "Silakan login kembali untuk melanjutkan pemesanan",
            confirmButtonText: "Login",
          }).then(() => {
            navigate("/login", {
              state: { returnUrl: "/order-direct" },
            });
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Terjadi kesalahan saat memuat data",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const required = {
      customer_name: "Nama Lengkap",
      customer_email: "Email",
      customer_phone: "Nomor Telepon",
      customer_address: "Alamat",
    };

    for (const [field, label] of Object.entries(required)) {
      if (!formData[field] || formData[field].toString().trim() === "") {
        Swal.fire({
          icon: "warning",
          title: "Data Tidak Lengkap",
          text: `${label} harus diisi`,
        });
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customer_email)) {
      Swal.fire({
        icon: "warning",
        title: "Email Tidak Valid",
        text: "Format email tidak valid",
      });
      return false;
    }

    // Validate phone number format
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    if (!phoneRegex.test(formData.customer_phone.replace(/\s/g, ""))) {
      Swal.fire({
        icon: "warning",
        title: "Nomor Telepon Tidak Valid",
        text: "Format nomor telepon Indonesia tidak valid",
      });
      return false;
    }

    // Check if cart has items
    if (cartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Keranjang Kosong",
        text: "Tidak ada item dalam keranjang untuk dipesan",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Login Diperlukan",
        text: "Silakan login terlebih dahulu untuk melanjutkan pemesanan",
        confirmButtonText: "Login",
      }).then(() => {
        navigate("/login", {
          state: { returnUrl: "/order-direct" },
        });
      });
      return;
    }

    try {
      setSubmitting(true);

      // Format data sesuai dengan struktur yang diharapkan controller CART
      const transactionData = {
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        notes: formData.notes || "",
      };

      // Gunakan endpoint /transactions/cart khusus untuk cart
      const response = await axiosClient.post(
        "/transactions/cart",
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        const transactionId = response.data.data.id;

        Swal.fire({
          icon: "success",
          title: "Pesanan Berhasil!",
          html: `
            <div class="text-left">
              <p><strong>Detail Pesanan:</strong></p>
              <p>Jumlah Item: ${cartSummary.item_count}</p>
              <p>Total Kuantitas: ${cartSummary.total_quantity}</p>
              <p>Total: Rp ${formatRupiah(cartSummary.total_price)}</p>
              <p class="mt-2">Pesanan Anda telah berhasil dibuat. Silakan lanjutkan ke pembayaran.</p>
            </div>
          `,
          confirmButtonText: "Lanjut ke Pembayaran",
        }).then(() => {
          // Navigate to payment page with transaction data
          navigate("/payment", {
            state: {
              transactionId: transactionId,
              transaction: response.data.data,
              fromCart: true,
            },
          });
        });
      } else {
        throw new Error(response.data?.message || "Gagal membuat pesanan");
      }
    } catch (error) {
      console.error("Error submitting order:", error);

      let errorMessage = "Terjadi kesalahan saat membuat pesanan";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Handle insufficient stock error specifically
      if (errorMessage.includes("stock") || errorMessage.includes("Stock")) {
        Swal.fire({
          icon: "warning",
          title: "Stok Tidak Cukup",
          text: errorMessage,
        }).then(() => {
          navigate("/cart");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Pesanan Gagal",
          text: errorMessage,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID").format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Form Pemesanan Keranjang
          </h1>
          <p className="text-gray-600">
            Lengkapi data diri Anda untuk memesan produk dari keranjang
          </p>
        </div>

        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Produk dalam Keranjang
            </h3>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border-b pb-4 last:border-b-0"
                >
                  <img
                    src={
                      item.product_details?.image || "/api/placeholder/80/80"
                    }
                    alt={item.product_details?.name}
                    className="w-20 h-20 object-cover rounded-md"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/80x80?text=Gambar+Tidak+Tersedia";
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {item.product_details?.name}
                    </h4>
                    <p className="text-orange-600 font-bold">
                      Rp {formatRupiah(item.product_details?.price)} x{" "}
                      {item.quantity}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Subtotal: Rp{" "}
                      {formatRupiah(
                        item.product_details?.price * item.quantity
                      )}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total:</span>
                  <span className="text-orange-600 text-xl">
                    Rp {formatRupiah(cartSummary.total_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                  placeholder="email@contoh.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                  placeholder="08xxxxxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 08xxxxxxxxxx (contoh: 081234567890)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Item
                </label>
                <input
                  type="text"
                  value={`${cartSummary.total_quantity} item`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Tidak dapat diubah</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Lengkap *
              </label>
              <textarea
                name="customer_address"
                value={formData.customer_address}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                required
                placeholder="Masukkan alamat lengkap untuk pengiriman"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Catatan khusus untuk pesanan (contoh: instruksi pengiriman, alergi, dll.)"
              ></textarea>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">
                Ringkasan Pesanan
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Jumlah Barang:</span>
                  <span>{cartSummary.item_count} barang</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Kuantitas:</span>
                  <span>{cartSummary.total_quantity} item</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                  <span>Total Harga:</span>
                  <span className="text-orange-600">
                    Rp {formatRupiah(cartSummary.total_price)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Memproses Pesanan...
                  </>
                ) : (
                  "Pesan Sekarang"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default OrderFormDirect;
