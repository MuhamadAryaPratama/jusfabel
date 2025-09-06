import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Image as ImageIcon, Loader2 } from "lucide-react";

export default function EditService() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000";

  const [service, setService] = useState({
    name: "",
    description: "",
    price: "",
    image: null,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchService = async () => {
      try {
        const token = localStorage.getItem("access_token");

        // Check if token exists
        if (!token) {
          throw new Error("Token tidak ditemukan. Silakan login kembali.");
        }

        const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("access_token");
            throw new Error("Sesi telah berakhir. Silakan login kembali.");
          }
          throw new Error("Gagal mengambil data layanan");
        }

        const data = await response.json();

        // Ensure price is handled correctly
        const serviceData = {
          ...data.data,
          price: data.data.price ? String(data.data.price) : "",
        };

        setService(serviceData);
        if (data.data.image) {
          setPreviewImage(getImageUrl(data.data.image));
        }
      } catch (err) {
        setError(err.message);

        // If authentication error, redirect to login
        if (err.message.includes("login")) {
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchService();
    }
  }, [id, navigate]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return `${API_BASE_URL}${imagePath}`;
    return `${API_BASE_URL}/${imagePath}`;
  };

  const formatRupiah = (value) => {
    if (!value && value !== 0) return "";

    // Convert to string and remove non-digits
    const numericValue = String(value).replace(/\D/g, "");
    if (!numericValue) return "";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseInt(numericValue));
  };

  const parseRupiah = (value) => {
    if (!value) return "";
    // Ensure value is a string before calling replace
    return String(value).replace(/\D/g, "");
  };

  const validateForm = () => {
    const errors = {};

    if (!service.name.trim()) {
      errors.name = "Nama layanan harus diisi";
    }

    if (!service.price) {
      errors.price = "Harga harus diisi";
    } else {
      const numericPrice = parseFloat(parseRupiah(service.price));
      if (isNaN(numericPrice) || numericPrice <= 0) {
        errors.price = "Harga harus lebih dari 0";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setService((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    const numericValue = parseRupiah(value);

    setService((prev) => ({
      ...prev,
      price: numericValue,
    }));

    // Clear price error
    if (formErrors.price) {
      setFormErrors((prev) => ({ ...prev, price: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFormErrors((prev) => ({
          ...prev,
          image: "Harus upload file gambar",
        }));
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          image: "Ukuran gambar maksimal 5MB",
        }));
        return;
      }

      setService((prev) => ({
        ...prev,
        image: file,
      }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      // Clear image error
      setFormErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const formData = new FormData();
      formData.append("name", service.name.trim());
      formData.append("description", service.description.trim());
      formData.append("price", parseRupiah(service.price));

      if (service.image instanceof File) {
        formData.append("image", service.image);
      }

      const response = await fetch(`${API_BASE_URL}/api/services/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          throw new Error("Sesi telah berakhir. Silakan login kembali.");
        }

        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal memperbarui layanan");
      }

      navigate("/service/semua", {
        state: { success: "Layanan berhasil diperbarui" },
      });
    } catch (err) {
      setError(err.message);

      // If authentication error, redirect to login after showing error
      if (err.message.includes("login")) {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    // Clean up preview URL if it was created
    if (previewImage && previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }
    navigate(-1);
  };

  const handleCancel = () => {
    // Clean up preview URL if it was created
    if (previewImage && previewImage.startsWith("blob:")) {
      URL.revokeObjectURL(previewImage);
    }
    navigate("/service/semua");
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (previewImage && previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Memuat data layanan...</span>
      </div>
    );
  }

  if (error && !service.name) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => navigate("/service/semua")}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
          >
            Kembali ke Layanan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Layanan</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6"
      >
        {/* Nama Layanan */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Nama Layanan *
          </label>
          <input
            type="text"
            name="name"
            value={service.name}
            onChange={handleChange}
            placeholder="Masukkan nama layanan"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              formErrors.name
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200"
            }`}
            required
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        {/* Deskripsi */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={service.description}
            onChange={handleChange}
            rows="4"
            placeholder="Masukkan deskripsi layanan (opsional)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors resize-vertical"
          />
        </div>

        {/* Harga */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Harga *
          </label>
          <div className="relative">
            <input
              type="text"
              name="price"
              value={formatRupiah(service.price)}
              onChange={handlePriceChange}
              placeholder="Masukkan harga layanan"
              className={`w-full pl-4 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                formErrors.price
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-blue-200"
              }`}
              required
            />
            <span className="absolute right-3 top-2.5 text-gray-500 font-medium">
              IDR
            </span>
          </div>
          {formErrors.price && (
            <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
          )}
        </div>

        {/* Gambar */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Gambar</label>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              {previewImage ? (
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 rounded-lg transition-all cursor-pointer" />
                </div>
              ) : (
                <div className="h-32 w-32 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block">
                <span className="sr-only">Pilih gambar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 file:cursor-pointer
                    cursor-pointer transition-colors"
                />
              </label>
              {formErrors.image && (
                <p className="mt-1 text-sm text-red-600">{formErrors.image}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, JPEG maksimal 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
