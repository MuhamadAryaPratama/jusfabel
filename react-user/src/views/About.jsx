import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosClient from "../axiosClient";
import { useNavigate } from "react-router-dom";

function About() {
  const [cartCount, setCartCount] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);

    const fetchUserData = async () => {
      if (token) {
        try {
          const response = await axiosClient.post("/auth/me");
          setUserData(response.data);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          if (error.response?.status === 401) {
            handleLogout();
          }
        }
      }
    };

    const fetchCartCount = async () => {
      if (!token) {
        setCartCount(0);
        return;
      }

      try {
        const response = await axiosClient.get("/cart");
        const totalCartCount = response.data.data.reduce(
          (total, item) => total + item.jumlah,
          0
        );
        setCartCount(totalCartCount);
      } catch (error) {
        console.error("Failed to fetch cart count:", error);
        if (error.response?.status === 401) {
          handleLogout();
        }
      }
    };

    fetchUserData();
    fetchCartCount();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    setCartCount(0);
    setUserData(null);
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

    try {
      const response = await axiosClient.post("/suggestions", {
        user_id: userData.id,
        content: suggestion,
      });

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
      if (error.response?.status === 401) {
        handleLogout();
        const confirmLogin = window.confirm(
          "Sesi Anda telah berakhir. Apakah Anda ingin login kembali?"
        );
        if (confirmLogin) {
          navigate("/login");
        }
      } else {
        setSubmitStatus({
          type: "error",
          message: "Maaf, terjadi kesalahan. Silakan coba lagi.",
        });
        setTimeout(() => setSubmitStatus(null), 3000);
      }
    }
  };

  return (
    <>
      <Navbar cartCount={cartCount} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">Tentang AutoCare</h1>
              <p className="text-lg mb-8 text-blue-100">
                Kami adalah bengkel service kendaraan terpercaya yang hadir
                untuk memberikan layanan perawatan kendaraan terbaik di
                Indonesia. Dengan teknisi berpengalaman dan peralatan modern,
                kami siap menjamin kendaraan Anda selalu dalam kondisi prima.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/layanan")}
                  className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-600 transition duration-200"
                >
                  Hubungi Kami
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-96 h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                  </svg>
                  <p className="text-center">Image Placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-2">5+</h3>
              <p className="text-gray-600">Tahun Berpengalaman</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-2">10K+</h3>
              <p className="text-gray-600">Service Selesai</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-2">20+</h3>
              <p className="text-gray-600">Teknisi Bersertifikat</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold mb-2">98%</h3>
              <p className="text-gray-600">Kepuasan Pelanggan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Perjalanan Kami</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Bagaimana AutoCare berkembang dari sebuah bengkel kecil menjadi
              service kendaraan terpercaya
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                  </svg>
                  <p>Image Placeholder</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="space-y-8">
                <div className="border-l-4 border-blue-600 pl-6">
                  <h3 className="text-xl font-bold mb-2">2018 - Awal Mula</h3>
                  <p className="text-gray-600">
                    AutoCare dimulai sebagai bengkel kecil dengan hanya 3
                    teknisi yang berfokus pada service rutin dan ganti oli.
                    Dengan komitmen kualitas yang tinggi, kami mulai mendapatkan
                    kepercayaan dari pelanggan.
                  </p>
                </div>
                <div className="border-l-4 border-blue-600 pl-6">
                  <h3 className="text-xl font-bold mb-2">
                    2020 - Pengembangan Layanan
                  </h3>
                  <p className="text-gray-600">
                    Kami mulai memperluas layanan dengan menambahkan tune up
                    mesin, service AC, dan layanan darurat. Teknisi kami
                    bertambah menjadi 10 orang berpengalaman.
                  </p>
                </div>
                <div className="border-l-4 border-blue-600 pl-6">
                  <h3 className="text-xl font-bold mb-2">
                    2022 - Transformasi Digital
                  </h3>
                  <p className="text-gray-600">
                    AutoCare meluncurkan platform service kendaraan online
                    pertama yang memungkinkan pelanggan booking service dari
                    rumah dan teknisi datang ke lokasi mereka.
                  </p>
                </div>
                <div className="border-l-4 border-blue-600 pl-6">
                  <h3 className="text-xl font-bold mb-2">2024 - Saat Ini</h3>
                  <p className="text-gray-600">
                    Kini AutoCare memiliki lebih dari 20 teknisi bersertifikat
                    dan telah melayani lebih dari 10.000 service kendaraan
                    dengan tingkat kepuasan pelanggan 98%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-blue-600 text-white p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-4">Visi Kami</h2>
              <p className="text-blue-100 text-lg">
                Menjadi penyedia layanan service kendaraan terpercaya dan
                terdepan di Indonesia dengan mengutamakan kualitas, kepercayaan,
                dan kepuasan pelanggan.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h2 className="text-3xl font-bold mb-6">Misi Kami</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-700">
                    Memberikan pelayanan service kendaraan berkualitas tinggi
                    dengan harga terjangkau
                  </p>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-700">
                    Mengembangkan teknisi yang memiliki integritas, keahlian,
                    dan dedikasi pada kepuasan pelanggan
                  </p>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-700">
                    Berinovasi terus-menerus dalam metode dan teknologi untuk
                    memberikan pengalaman service terbaik
                  </p>
                </div>
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-700">
                    Membangun hubungan jangka panjang dengan pelanggan
                    berdasarkan kepercayaan dan kualitas layanan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Nilai-Nilai Kami</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Prinsip yang kami pegang dalam memberikan pelayanan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Kualitas Terbaik</h3>
              <p className="text-gray-600">
                Kami selalu mengutamakan kualitas layanan dan spare part yang
                digunakan.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Customer First</h3>
              <p className="text-gray-600">
                Kepuasan pelanggan adalah prioritas utama kami dalam setiap
                service.
              </p>
            </div>
            <div className="text-center p-8 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Inovasi Terus-menerus</h3>
              <p className="text-gray-600">
                Kami terus berinovasi untuk memberikan solusi terbaik pada
                kendaraan Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default About;
