import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosClient from "../axiosClient";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/home.jpg";

export default function Dashboard() {
  const [cartCount, setCartCount] = useState(0);
  const [ratings, setRatings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartCount = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setCartCount(0);
        return;
      }
      try {
        const response = await axiosClient.get("/cart");
        const totalJumlah = response.data.data.reduce(
          (total, item) => total + item.jumlah,
          0
        );
        setCartCount(totalJumlah);
      } catch (error) {
        console.error("Failed to fetch cart count:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("access_token");
        }
        setCartCount(0);
      }
    };

    const fetchRatings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get("/ratings");
        console.log("Ratings response:", response.data);

        const ratingsData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        setRatings(ratingsData);
      } catch (error) {
        console.error("Failed to fetch ratings:", error);
        setError("Failed to load ratings");
        setRatings([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await axiosClient.get("/categories");
        console.log("Categories response:", response.data);

        const categoriesData = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        // If product_count is not available from backend, fetch it separately
        const categoriesWithProductCount = await Promise.all(
          categoriesData.map(async (category) => {
            // If backend already provides product_count, use it
            if (category.product_count !== undefined) {
              return category;
            }

            try {
              // Fallback: fetch products count for this category
              const productsResponse = await axiosClient.get(
                `/products?category=${category.id}&limit=1`
              );
              return {
                ...category,
                product_count:
                  productsResponse.data.pagination?.totalProducts || 0,
              };
            } catch (error) {
              console.error(
                `Failed to fetch product count for category ${category.id}:`,
                error
              );
              return {
                ...category,
                product_count: 0,
              };
            }
          })
        );

        setCategories(categoriesWithProductCount);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Fallback to empty array if API fails
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCartCount();
    fetchRatings();
    fetchCategories();
  }, []);

  // Menggunakan useMemo untuk mencegah re-render yang tidak perlu
  const services = useMemo(
    () => [
      {
        icon: "🛡️",
        title: "Garansi Kualitas",
        description: "Material premium dan pengerjaan berkualitas tinggi",
      },
      {
        icon: "🎧",
        title: "Dukungan 24/7",
        description: "Layanan pelanggan ahli siap membantu Anda",
      },
      {
        icon: "↩️",
        title: "Mudah Return",
        description: "Kebijakan pengembalian 30 hari tanpa ribet",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar cartCount={cartCount} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Left Side - Content */}
            <div className="w-full md:w-1/2 md:pr-8 mb-8 md:mb-0">
              {/* Badge */}
              <div className="inline-block mb-6">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Premium Home Furniture
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Elevate Your Home with{" "}
                <span className="text-yellow-400">Jusfabel</span>
              </h1>

              <p className="text-lg md:text-xl mb-8 opacity-90 leading-relaxed">
                Explore our handpicked selection of luxurious carpets, stylish
                lighting, and artistic wall decor for a beautifully refined
                home.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/list-products")}
                  className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  aria-label="Browse our collection"
                >
                  Shop Collection
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative">
                {/* Image container */}
                <div className="w-80 h-80 bg-white rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden">
                  <img
                    src={Logo}
                    alt="Jusfabel Home Furniture - Luxury home decor and furnishings"
                    className="w-full h-full object-cover"
                    loading="eager"
                    width={320}
                    height={320}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  {/* Fallback content */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 hidden items-center justify-center">
                    <div className="text-center text-gray-600">
                      <div className="text-6xl mb-4" aria-hidden="true">
                        🏠
                      </div>
                      <p className="text-lg font-semibold">Home Furniture</p>
                      <p className="text-sm mt-2">Luxury & Comfort</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              id="features-heading"
              className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
            >
              Why Choose Jusfabel?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide the best quality furniture with premium materials and
              excellent customer service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center">
            {services.map((service, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-lg hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col items-center max-w-xs w-full"
              >
                <div
                  className="text-4xl mb-4 bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  aria-hidden="true"
                >
                  {service.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed text-center">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white" aria-labelledby="categories-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              id="categories-heading"
              className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
            >
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our carefully curated collections
            </p>
          </div>

          {categoriesLoading && (
            <div className="text-center py-12">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
                aria-label="Loading categories"
              ></div>
              <p className="text-gray-600 mt-4">Loading categories...</p>
            </div>
          )}

          {!categoriesLoading && categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No categories available</p>
            </div>
          )}

          {!categoriesLoading && categories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((category, index) => (
                <div
                  key={category.id || index}
                  className="group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                  onClick={() =>
                    navigate(`/products?category=${category.name}`)
                  }
                >
                  <div className="relative overflow-hidden h-60">
                    <img
                      src={
                        category.image ||
                        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=658&q=80"
                      }
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=658&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {category.name}
                    </h3>
                    <p className="text-blue-600 font-semibold mb-2">
                      {category.product_count || 0} Products
                    </p>
                    <p className="text-gray-600 text-sm">
                      {category.description || "Explore our collection"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        className="py-16 bg-gray-50"
        aria-labelledby="testimonials-heading"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              id="testimonials-heading"
              className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
            >
              Customer Review
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              What our customers say about our products and services
            </p>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
                aria-label="Loading testimonials"
              ></div>
              <p className="text-gray-600 mt-4">Loading testimonials...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 text-red-700 p-6 rounded-lg mb-8 text-center max-w-2xl mx-auto">
              {error}
            </div>
          )}

          {!loading && ratings.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-600">No testimonials available yet</p>
            </div>
          )}

          {!loading && ratings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ratings.map((rating) => (
                <article
                  key={rating.id}
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col"
                  itemScope
                  itemType="https://schema.org/Review"
                >
                  {/* Rating Stars */}
                  <div
                    className="flex mb-4 justify-center"
                    aria-label={`Rating: ${rating.rating} out of 5 stars`}
                  >
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < rating.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300 fill-current"
                        }`}
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>

                  {/* Review Content */}
                  <p
                    className="text-gray-700 leading-relaxed mb-4 text-sm flex-grow"
                    itemProp="reviewBody"
                  >
                    {rating.review || "No review text provided"}
                  </p>

                  {/* Product Name (if available) */}
                  {rating.product_name && (
                    <p className="text-xs text-blue-600 mb-2 font-medium">
                      Product: {rating.product_name}
                    </p>
                  )}

                  {/* Reviewer Info and Date */}
                  <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                    <div
                      className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3"
                      aria-hidden="true"
                    >
                      {rating.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <h4
                        className="font-bold text-gray-800 text-sm"
                        itemProp="author"
                      >
                        {rating.full_name || "Anonymous User"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        <time dateTime={rating.created_at}>
                          {new Date(rating.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </time>
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
