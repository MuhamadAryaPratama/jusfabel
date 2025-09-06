import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import axiosClient from "../axiosClient";

function OrderForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const selectedProduct = location.state?.product;

  // Fungsi untuk memformat angka ke format Rupiah
  const formatRupiah = (angka) => {
    if (!angka) return "0";
    const numberValue = typeof angka === "string" ? parseFloat(angka) : angka;
    return numberValue.toLocaleString("id-ID");
  };

  const [formData, setFormData] = useState({
    product_id: selectedProduct?.id || "",
    quantity: 1,
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    notes: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Check if user is logged in
        const token =
          localStorage.getItem("token") || localStorage.getItem("access_token");
        if (!token) {
          // Jika belum login, redirect ke login
          Swal.fire({
            icon: "warning",
            title: "Login Diperlukan",
            text: "Silakan login terlebih dahulu untuk melakukan pemesanan",
            confirmButtonText: "Login",
          }).then(() => {
            navigate("/login", {
              state: {
                returnUrl: "/order",
                product: selectedProduct,
              },
            });
          });
          return;
        }

        // Fetch user data from /auth/me endpoint
        const response = await axiosClient.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.success) {
          const userData = response.data.user;
          setUserInfo(userData);

          // Pre-fill form with user data - PERBAIKAN: Sesuaikan dengan field yang diharapkan controller
          setFormData((prev) => ({
            ...prev,
            customer_name: userData.full_name || userData.name || "",
            customer_email: userData.email || "",
            customer_phone: userData.phone || "",
            customer_address: userData.address || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);

        // Jika token tidak valid, hapus dan redirect ke login
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
              state: {
                returnUrl: "/order",
                product: selectedProduct,
              },
            });
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Terjadi kesalahan saat memuat data user",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, selectedProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validasi khusus untuk quantity
    if (name === "quantity") {
      const qty = parseInt(value);
      const maxStock = selectedProduct?.stock || 100;

      if (qty < 1) {
        setFormData((prev) => ({ ...prev, quantity: 1 }));
      } else if (qty > maxStock) {
        setFormData((prev) => ({ ...prev, quantity: maxStock }));
        Swal.fire({
          icon: "warning",
          title: "Jumlah Melebihi Stok",
          text: `Stok tersedia: ${maxStock}`,
        });
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(formData.customer_phone.replace(/\D/g, ""))) {
      Swal.fire({
        icon: "warning",
        title: "Nomor Telepon Tidak Valid",
        text: "Nomor telepon harus 10-13 digit angka",
      });
      return false;
    }

    // Validate quantity
    if (formData.quantity < 1) {
      Swal.fire({
        icon: "warning",
        title: "Jumlah Tidak Valid",
        text: "Jumlah pesanan minimal 1",
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
          state: {
            returnUrl: "/order",
            product: selectedProduct,
          },
        });
      });
      return;
    }

    try {
      setSubmitting(true);

      // Format data sesuai dengan struktur yang diharapkan controller
      const transactionData = {
        product_id: formData.product_id,
        quantity: parseInt(formData.quantity),
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        notes: formData.notes,
      };

      // Gunakan endpoint /transactions sesuai dengan controller
      const response = await axiosClient.post(
        "/transactions",
        transactionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        const productPrice =
          typeof selectedProduct?.price === "string"
            ? parseFloat(selectedProduct.price)
            : selectedProduct?.price;

        const transactionId = response.data.data.id;

        Swal.fire({
          icon: "success",
          title: "Pesanan Berhasil!",
          html: `
            <div class="text-left">
              <p><strong>Detail Pesanan:</strong></p>
              <p>Produk: ${selectedProduct?.name}</p>
              <p>Jumlah: ${formData.quantity}</p>
              <p>Total: Rp ${formatRupiah(productPrice * formData.quantity)}</p>
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
              fromOrder: true,
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
          navigate("/products");
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

  // Pastikan price adalah number untuk perhitungan
  const productPrice =
    typeof selectedProduct?.price === "string"
      ? parseFloat(selectedProduct.price)
      : selectedProduct?.price;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Form Pemesanan Produk
          </h1>
          <p className="text-gray-600">
            Lengkapi data diri Anda untuk memesan produk
          </p>
        </div>

        {selectedProduct && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Produk yang Dipesan
            </h3>
            <div className="flex items-center gap-4">
              <img
                src={selectedProduct.image || "/placeholder-product.jpg"}
                alt={selectedProduct.name}
                className="w-20 h-20 object-cover rounded-md"
                onError={(e) => {
                  e.target.src = "/placeholder-product.jpg";
                }}
              />
              <div className="flex-1">
                <h4 className="font-semibold text-lg">
                  {selectedProduct.name}
                </h4>
                <p className="text-orange-600 font-bold text-xl">
                  Rp {formatRupiah(productPrice)}
                </p>
                <p className="text-gray-600 text-sm">
                  Stok: {selectedProduct.stock || "Tersedia"}
                </p>
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
                  pattern="[0-9]{10,13}"
                  title="Masukkan 10-13 digit nomor telepon"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  max={selectedProduct?.stock || 100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal: {selectedProduct?.stock || 100}
                </p>
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
                placeholder="Catatan khusus untuk pesanan (contoh: tambahan gula, alergi, dll.)"
              ></textarea>
            </div>

            {selectedProduct && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Ringkasan Pesanan
                </h4>
                <div className="flex justify-between items-center">
                  <span>Subtotal ({formData.quantity} item):</span>
                  <span className="font-semibold">
                    Rp {formatRupiah(productPrice * formData.quantity)}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
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
    </div>
  );
}

export default OrderForm;
