import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Contact() {
  const [suggestion, setSuggestion] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [reviewSubmitStatus, setReviewSubmitStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    const initializeData = async () => {
      setIsLoading(true);

      if (token) {
        try {
          const userResponse = await axios.get(
            "http://localhost:5000/api/auth/me",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (userResponse.data.success) {
            setIsLoggedIn(true);
            setUserData(userResponse.data.user);
          } else {
            setIsLoggedIn(false);
            setUserData(null);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          if (error.response?.status === 401) {
            handleLogout();
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }

      setIsLoading(false);
    };

    initializeData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserData(null);
    setSuggestion("");
    setRating(0);
    setReview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      const confirmLogin = window.confirm(
        "Anda harus login terlebih dahulu untuk memberikan saran. Apakah Anda ingin login sekarang?"
      );
      if (confirmLogin) {
        navigate("/login");
      }
      return;
    }

    if (!suggestion.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Saran tidak boleh kosong.",
      });
      setTimeout(() => setSubmitStatus(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/saran",
        {
          message: suggestion.trim(),
          userId: userData.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setSubmitStatus({
          type: "success",
          message: "Terima kasih! Saran Anda telah berhasil dikirim.",
        });
        setSuggestion("");
        setTimeout(() => setSubmitStatus(null), 3000);
      }
    } catch (error) {
      console.error("Failed to submit suggestion:", error);
      let errorMessage = "Maaf, terjadi kesalahan. Silakan coba lagi.";

      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          handleLogout();
          const confirmLogin = window.confirm(
            "Sesi Anda telah berakhir. Apakah Anda ingin login kembali?"
          );
          if (confirmLogin) {
            navigate("/login");
          }
          return;
        }
      }

      setSubmitStatus({
        type: "error",
        message: errorMessage,
      });
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  const handleSuggestionChange = (e) => {
    setSuggestion(e.target.value);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      const confirmLogin = window.confirm(
        "Anda harus login terlebih dahulu untuk memberikan review. Apakah Anda ingin login sekarang?"
      );
      if (confirmLogin) {
        navigate("/login");
      }
      return;
    }

    if (rating === 0) {
      setReviewSubmitStatus({
        type: "error",
        message: "Silakan berikan rating.",
      });
      setTimeout(() => setReviewSubmitStatus(null), 3000);
      return;
    }

    if (!review.trim()) {
      setReviewSubmitStatus({
        type: "error",
        message: "Review tidak boleh kosong.",
      });
      setTimeout(() => setReviewSubmitStatus(null), 3000);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/ratings",
        {
          rating: rating,
          review: review.trim(),
          userId: userData.id,
          user_id: userData.id, // Some APIs expect user_id instead of userId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setReviewSubmitStatus({
          type: "success",
          message: "Terima kasih! Review Anda telah berhasil dikirim.",
        });
        setRating(0);
        setReview("");
        setTimeout(() => setReviewSubmitStatus(null), 3000);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      let errorMessage = "Maaf, terjadi kesalahan. Silakan coba lagi.";

      if (error.response) {
        console.error("Error response data:", error.response.data); // Log the error details

        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          handleLogout();
          const confirmLogin = window.confirm(
            "Sesi Anda telah berakhir. Apakah Anda ingin login kembali?"
          );
          if (confirmLogin) {
            navigate("/login");
          }
          return;
        } else if (error.response.status === 400) {
          // More detailed error message for 400 errors
          if (error.response.data.errors) {
            errorMessage = Object.values(error.response.data.errors)
              .map((err) => (Array.isArray(err) ? err.join(", ") : err))
              .join(", ");
          } else {
            errorMessage =
              "Data yang dikirim tidak valid. Silakan periksa kembali.";
          }
        }
      }

      setReviewSubmitStatus({
        type: "error",
        message: errorMessage,
      });
      setTimeout(() => setReviewSubmitStatus(null), 3000);
    }
  };

  return (
    <>
      <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Hubungi Kami</h1>
            <p className="text-lg text-blue-100">
              Kami siap membantu Anda dengan layanan terbaik. Jangan ragu untuk
              menghubungi kami melalui berbagai cara di bawah ini.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Cards */}
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-gray-600 mb-2">
                Kirim email untuk pertanyaan detail
              </p>
              <p className="text-blue-600 font-semibold">info@autocare.id</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Telepon</h3>
              <p className="text-gray-600 mb-2">Hubungi kami langsung</p>
              <p className="text-blue-600 font-semibold">+62 21 1234 5678</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Lokasi</h3>
              <p className="text-gray-600 mb-2">Kunjungi bengkel kami</p>
              <p className="text-blue-600 font-semibold">
                Jl. Sudirman No. 123
              </p>
              <p className="text-gray-600">Jakarta Pusat, Indonesia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Lokasi Kami</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meskipun kami memiliki layanan di lokasi Anda, Anda juga bisa
              mengunjungi kantor pusat kami
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Map Placeholder */}
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg
                  className="w-20 h-20 mx-auto mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <p className="text-lg">Map Placeholder</p>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">Kantor Pusat</h3>
                <p className="text-gray-600 mb-2">
                  Jl. Sudirman No. 123, Jakarta Pusat, Indonesia
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4">Jam Operasional</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Senin - Jumat:</span>
                    <span className="font-semibold">08.00 - 17.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sabtu:</span>
                    <span className="font-semibold">08.00 - 15.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minggu:</span>
                    <span className="font-semibold">
                      Tutup (kecuali layanan darurat)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4">Kontak</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    <span className="text-gray-600">+62 21 1234 5678</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    <span className="text-gray-600">info@autocare.id</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rating and Review Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Beri Rating dan Review
              </h2>
              <p className="text-gray-600">
                Bagikan pengalaman Anda menggunakan layanan kami
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-6">Tulis Review Anda</h3>

                {isLoading && (
                  <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
                    Memuat data pengguna...
                  </div>
                )}

                {!isLoading && !isLoggedIn && (
                  <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
                    Silakan login terlebih dahulu untuk memberikan review.
                  </div>
                )}

                {reviewSubmitStatus && (
                  <div
                    className={`mb-6 p-4 rounded-lg ${
                      reviewSubmitStatus.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {reviewSubmitStatus.message}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rating
                    </label>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          className={`text-3xl focus:outline-none ${
                            star <= (hover || rating)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          onClick={() => setRating(star)} // star sudah integer
                          onMouseEnter={() => setHover(star)}
                          onMouseLeave={() => setHover(rating)}
                          disabled={!isLoggedIn || isLoading}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-2 text-gray-600">
                        {rating > 0 ? `${rating} bintang` : "Pilih rating"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      htmlFor="review"
                    >
                      Review Anda
                    </label>
                    <textarea
                      id="review"
                      name="review"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        !isLoggedIn
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      rows="5"
                      placeholder={
                        isLoggedIn
                          ? "Bagikan pengalaman Anda menggunakan layanan kami..."
                          : "Silakan login terlebih dahulu untuk memberikan review"
                      }
                      required
                      disabled={!isLoggedIn || isLoading}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isLoggedIn && !isLoading && rating > 0 && review.trim()
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={
                      !isLoggedIn || isLoading || rating === 0 || !review.trim()
                    }
                  >
                    {isLoading
                      ? "Memuat..."
                      : isLoggedIn
                      ? "Kirim Review"
                      : "Login untuk Kirim Review"}
                  </button>
                </form>
              </div>

              <div className="bg-blue-600 text-white p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-6">
                  Mengapa Memberikan Review?
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 mr-4 mt-1 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold mb-1">
                        Bantu Kami Berkembang
                      </h4>
                      <p className="text-blue-100 text-sm">
                        Review Anda membantu kami meningkatkan kualitas layanan
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 mr-4 mt-1 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold mb-1">
                        Bantu Pengguna Lain
                      </h4>
                      <p className="text-blue-100 text-sm">
                        Pengalaman Anda dapat membantu calon pelanggan lain
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 mr-4 mt-1 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold mb-1">Transparansi</h4>
                      <p className="text-blue-100 text-sm">
                        Kami menghargai semua masukan, baik positif maupun
                        negatif
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 mr-4 mt-1 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold mb-1">Hadiah</h4>
                      <p className="text-blue-100 text-sm">
                        Review terpilih akan mendapatkan hadiah menarik
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-blue-500">
                  <h4 className="font-semibold mb-4">Review Terbaru</h4>
                  <div className="space-y-4">
                    <div className="bg-blue-700 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                        <span className="ml-2 text-sm">- Budi</span>
                      </div>
                      <p className="text-blue-100 text-sm">
                        "Pelayanan sangat memuaskan, teknisi profesional dan
                        harga transparan."
                      </p>
                    </div>
                    <div className="bg-blue-700 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(4)].map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                          <span>☆</span>
                        </div>
                        <span className="ml-2 text-sm">- Ani</span>
                      </div>
                      <p className="text-blue-100 text-sm">
                        "Hasil service memuaskan, hanya saja waktu tunggu agak
                        lama."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Suggestion Form */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Berikan Saran Anda
            </h2>

            {isLoading && (
              <div className="mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
                Memuat data pengguna...
              </div>
            )}

            {!isLoading && !isLoggedIn && (
              <div className="mb-6 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
                Silakan login terlebih dahulu untuk memberikan saran.
              </div>
            )}

            {!isLoading && isLoggedIn && userData && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                Selamat datang, {userData.full_name || userData.name || "User"}!
                Anda dapat memberikan saran di bawah ini.
              </div>
            )}

            {submitStatus && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  submitStatus.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  htmlFor="suggestion"
                >
                  Pesan Saran
                </label>
                <textarea
                  id="suggestion"
                  name="suggestion"
                  value={suggestion}
                  onChange={handleSuggestionChange}
                  className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    !isLoggedIn ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                  rows="5"
                  placeholder={
                    isLoggedIn
                      ? "Tulis saran Anda di sini..."
                      : "Silakan login terlebih dahulu untuk memberikan saran"
                  }
                  required
                  disabled={!isLoggedIn || isLoading}
                ></textarea>
              </div>
              <button
                type="submit"
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isLoggedIn && !isLoading
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!isLoggedIn || isLoading}
              >
                {isLoading
                  ? "Memuat..."
                  : isLoggedIn
                  ? "Kirim Saran"
                  : "Login untuk Kirim Saran"}
              </button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default Contact;
