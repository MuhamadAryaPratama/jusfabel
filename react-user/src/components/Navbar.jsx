import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../axiosClient";
import {
  CalendarIcon,
  StarIcon,
  ShoppingCartIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import Logo from "../assets/jusfabel-logo.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch user information
  const fetchUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await axiosClient.get("/auth/me");

      if (response.data.success) {
        setUser(response.data.user);
        // Setelah mendapatkan user, ambil data cart dan wishlist
        fetchCartCount();
        fetchWishlistCount();
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        setUser(null);
        setCartCount(0);
        setWishlistCount(0);
      }
    }
  };

  // Fetch cart count
  const fetchCartCount = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const response = await axiosClient.get("/cart/summary");

      if (response.data.success) {
        setCartCount(response.data.data.total_quantity || 0);
      }
    } catch (error) {
      console.error("Failed to fetch cart count:", error);
      // Jika error 401 (unauthorized), hapus token dan reset state
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        setUser(null);
        setCartCount(0);
        setWishlistCount(0);
      } else {
        setCartCount(0);
      }
    }
  };

  // Fetch wishlist count
  const fetchWishlistCount = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setWishlistCount(0);
      return;
    }

    try {
      const response = await axiosClient.get("/wishlist");

      if (response.data.success) {
        setWishlistCount(response.data.pagination.totalItems || 0);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist count:", error);
      // Jika error 401 (unauthorized), hapus token dan reset state
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        setUser(null);
        setWishlistCount(0);
      } else {
        setWishlistCount(0);
      }
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      setUser(null);
      setCartCount(0);
      setWishlistCount(0);
      navigate("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    fetchUser();

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white font-sans w-full m-0 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div>
            <Link to="/">
              <img src={Logo} alt="Jus ta Bel Logo" className="h-16" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center space-x-8">
            <Link
              to="/"
              className="text-gray-800 text-lg font-medium hover:text-orange-600 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/list-products"
              className="text-gray-800 text-lg font-medium hover:text-orange-600 transition-colors"
            >
              Product
            </Link>
            <Link
              to="/categories"
              className="text-gray-800 text-lg font-medium hover:text-orange-600 transition-colors"
            >
              Kategori
            </Link>
            <Link
              to="/reviews"
              className="text-gray-800 text-lg font-medium hover:text-orange-600 transition-colors flex items-center"
            >
              <StarIcon className="h-5 w-5 mr-1" />
              Review
            </Link>
          </div>

          {/* User Actions */}
          <div className="hidden md:flex md:items-center space-x-6">
            {/* Shopping Cart Icon with Count - Only show if user is logged in */}
            {user && (
              <Link
                to="/cart"
                className="relative text-gray-800 hover:text-orange-600 transition-colors"
                title="Shopping Cart"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist Icon with Count - Only show if user is logged in */}
            {user && (
              <Link
                to="/wishlist"
                className="relative text-gray-800 hover:text-orange-600 transition-colors"
                title="Wishlist"
              >
                <HeartIcon className="h-6 w-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div
                className="relative flex items-center space-x-4"
                ref={dropdownRef}
              >
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-gray-800 text-sm font-medium hover:text-orange-600"
                  aria-expanded={isDropdownOpen}
                >
                  <span className="mr-1">{user.full_name || user.name}</span>
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-white shadow-lg rounded-lg py-2 w-48 z-50 border border-gray-200">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>

                    {/* Mengubah Wishlist menjadi Riwayat Transaksi */}
                    <Link
                      to="/transaction-history"
                      className="block px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Riwayat Transaksi
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 text-sm hover:bg-gray-100 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-gray-800 text-lg font-medium hover:text-orange-600 transition-colors"
              >
                Masuk
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div
            className="md:hidden cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-gray-200">
          <div className="flex flex-col px-4 py-3 space-y-3">
            <Link
              to="/"
              className="text-gray-800 font-medium hover:text-orange-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/list-products"
              className="text-gray-800 font-medium hover:text-orange-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Product
            </Link>
            <Link
              to="/categories"
              className="text-gray-800 font-medium hover:text-orange-600 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Kategori
            </Link>
            <Link
              to="/reviews"
              className="text-gray-800 font-medium hover:text-orange-600 py-2 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <StarIcon className="h-5 w-5 mr-2" />
              Review
            </Link>

            {/* Shopping Cart in Mobile Menu - Only show if user is logged in */}
            {user && (
              <Link
                to="/cart"
                className="text-gray-800 font-medium hover:text-orange-600 py-2 flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Keranjang
                {cartCount > 0 && (
                  <span className="ml-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist in Mobile Menu with Count - Only show if user is logged in */}
            {user && (
              <Link
                to="/wishlist"
                className="text-gray-800 font-medium hover:text-orange-600 py-2 flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <HeartIcon className="h-5 w-5 mr-2" />
                Wishlist
                {wishlistCount > 0 && (
                  <span className="ml-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-gray-800 font-medium hover:text-orange-600 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>

                {/* Menambahkan Riwayat Transaksi di mobile menu */}
                <Link
                  to="/transaction-history"
                  className="text-gray-800 font-medium hover:text-orange-600 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Riwayat Transaksi
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-gray-800 font-medium hover:text-orange-600 py-2 text-left"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-gray-800 font-medium hover:text-orange-600 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;
