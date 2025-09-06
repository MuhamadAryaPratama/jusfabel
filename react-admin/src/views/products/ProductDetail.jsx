// src/views/products/ProductDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../../axiosClient";
import { ArrowLeft, Edit, Star } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axiosClient.get(`/products/${id}`);
      if (response.data.success) {
        setProduct(response.data.data);
        
        // Jika produk memiliki category_id, ambil nama kategori
        if (response.data.data.category_id) {
          fetchCategoryName(response.data.data.category_id);
        } else {
          setLoading(false);
        }
      } else {
        setError("Produk tidak ditemukan");
        setLoading(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat detail produk");
      setLoading(false);
    }
  };

  const fetchCategoryName = async (categoryId) => {
    try {
      const response = await axiosClient.get(`/categories/${categoryId}`);
      if (response.data.success) {
        setCategoryName(response.data.data.name);
      } else {
        setCategoryName("Kategori tidak ditemukan");
      }
    } catch (err) {
      setCategoryName("Gagal memuat kategori");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Daftar Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            to="/products"
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Detail Produk</h1>
        </div>
        <Link
          to={`/products/edit/${id}`}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Edit className="w-5 h-5 mr-2" />
          Edit Produk
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div>
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Tidak ada gambar</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {product.name}
            </h2>

            <div className="flex items-center mb-4">
              <span className="text-3xl font-bold text-blue-600">
                {formatPrice(product.price)}
              </span>
              <span
                className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                  product.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.is_active ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </h3>
              <p className="text-gray-600">
                {product.description || "Tidak ada deskripsi"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Stok</h3>
                <p className="text-lg font-semibold text-gray-800">
                  {product.stock} unit
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </h3>
                <p className="text-gray-600">
                  {product.category_id ? categoryName : "-"}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Rating</h3>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-1" />
                <span className="text-lg font-semibold text-gray-800">
                  {product.average_rating?.toFixed(1) || "0.0"}
                </span>
                <span className="text-gray-500 ml-2">
                  ({product.total_ratings || 0} ulasan)
                </span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Dibuat Pada
              </h3>
              <p className="text-gray-600">
                {new Date(product.created_at).toLocaleDateString("id-ID")}
              </p>
            </div>

            {product.updated_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Diupdate Pada
                </h3>
                <p className="text-gray-600">
                  {new Date(product.updated_at).toLocaleDateString("id-ID")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}