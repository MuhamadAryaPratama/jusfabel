import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import axiosClient from "../../axiosClient";

export default function SizeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "inch",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isEdit) {
      fetchSize();
    }
  }, [id]);

  const fetchSize = async () => {
    try {
      const response = await axiosClient.get(`/sizes/${id}`);
      setFormData(response.data.data);
    } catch (error) {
      setError("Gagal memuat data size");
      console.error("Fetch size error:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!formData.name || !formData.unit) {
        setError("Nama dan unit harus diisi");
        setLoading(false);
        return;
      }

      if (isEdit) {
        await axiosClient.put(`/sizes/${id}`, formData);
        setSuccess("Size berhasil diperbarui");
      } else {
        await axiosClient.post("/sizes", formData);
        setSuccess("Size berhasil ditambahkan");
      }

      setTimeout(() => {
        navigate("/sizes");
      }, 1000);
    } catch (error) {
      console.error("Submit error:", error);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === "ECONNABORTED") {
        setError("Waktu koneksi habis. Silakan coba lagi.");
      } else if (error.message === "Network Error") {
        setError(
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
        );
      } else {
        setError(isEdit ? "Gagal memperbarui size" : "Gagal menambahkan size");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate("/sizes")}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali ke Daftar Size
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Size" : "Tambah Size Baru"}
        </h1>
        <p className="text-gray-600">
          {isEdit
            ? "Perbarui informasi size"
            : "Tambahkan size baru untuk produk"}
        </p>
      </div>

      <div className="max-w-2xl">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Size *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Contoh: Small, Medium, Large"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Deskripsi optional untuk size"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="inch">Inch</option>
                <option value="cm">Centimeter (cm)</option>
                <option value="meter">Meter</option>
              </select>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? "Menyimpan..." : "Simpan"}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate("/sizes")}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
