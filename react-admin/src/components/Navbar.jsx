import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import axiosClient from "../axiosClient";
import { Menu, X } from "lucide-react";

export default function Navbar({ toggleSidebar, isSidebarOpen }) {
  const [admin, setAdmin] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const fetchAdmin = useCallback(async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setAdmin(null);
      return;
    }

    try {
      const response = await axiosClient.get("/admin/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAdmin(response.data.admin); // Access admin data from response.data.admin
    } catch (error) {
      console.error("Failed to fetch admin:", error);

      if (
        error.response &&
        (error.response.status === 401 || error.response.status === 403)
      ) {
        localStorage.removeItem("access_token");
        setAdmin(null);
        navigate("/login");
      }
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        await axiosClient.post(
          "/admin/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      localStorage.removeItem("access_token");
      setAdmin(null);
      navigate("/login");
    }
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target)
    ) {
      setShowNotifications(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchAdmin]);

  // Mock notifications data
  useEffect(() => {
    setNotifications([
      {
        id: 1,
        message: "New booking from Ahmad Rahman",
        time: "2 minutes ago",
        unread: true,
      },
      {
        id: 2,
        message: "Payment successful for order #1234",
        time: "10 minutes ago",
        unread: true,
      },
    ]);
  }, []);

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              {admin ? (
                <div>
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {admin?.full_name?.charAt(0).toUpperCase() || "A"}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {admin?.full_name || "Admin"}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[160px]">
                        {admin?.email || "admin@example.com"}
                      </p>
                    </div>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {admin?.full_name || "Admin"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {admin?.email || "admin@example.com"}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>

                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Navbar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool,
};
