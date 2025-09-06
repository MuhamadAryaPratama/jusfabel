import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosClient from "../axiosClient";
import { useNavigate } from "react-router-dom";

function OrderForm() {
  const [cartCount, setCartCount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    total: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.address ||
      !formData.phone ||
      !formData.total
    ) {
      Swal.fire({
        title: "Error",
        text: "Harap lengkapi semua kolom sebelum mengirimkan pemesanan.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    setLoading(true);

    try {
      await axiosClient.post("/orders", formData);

      Swal.fire({
        title: "Success",
        text: "Pesanan Anda berhasil dikirim!",
        icon: "success",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/foods"); // Redirect ke halaman daftar menu setelah pemesanan
      });

      // Perbarui cart setelah pemesanan berhasil
      fetchCartCount();
    } catch {
      Swal.fire({
        title: "Error",
        text: "Gagal mengirimkan pesanan. Silakan coba lagi.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await axiosClient.get("/cart");
      const totalCount = response.data.data.reduce(
        (total, item) => total + item.jumlah,
        0
      );
      setCartCount(totalCount);
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  return (
    <div>
      <Navbar cartCount={cartCount} />
      <div className="container mx-auto py-8">
        <h1 className="text-center text-3xl font-bold mb-6">Form Pemesanan</h1>
        <form
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-lg"
        >
          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="name"
            >
              Nama Pelanggan
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Masukkan nama Anda"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="address"
            >
              Alamat Pengiriman
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Masukkan alamat pengiriman"
            ></textarea>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="phone"
            >
              Nomor Telepon
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="total"
            >
              Total Pesanan
            </label>
            <input
              type="number"
              id="total"
              name="total"
              value={formData.total}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
              placeholder="Masukkan total harga"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 font-bold text-white rounded-lg ${
              loading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
            } focus:outline-none`}
          >
            Beli
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export default OrderForm;
