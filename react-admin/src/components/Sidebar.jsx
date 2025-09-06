import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  Calendar,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  MessageSquare,
  FileText,
  Package,
  DollarSign,
  Ruler,
  Star,
  BarChart3,
} from "lucide-react";
import Logo from "../assets/jusfabel-logo.png"; // Logo yang diimpor dari asset

export default function Sidebar() {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleMenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const isActive = (path) => location.pathname === path;
  const isParentActive = (paths) =>
    paths.some((path) => location.pathname.startsWith(path));

  const menuItems = [
    {
      key: "main",
      title: "Main Navigation",
      items: [
        {
          path: "/",
          label: "Dashboard",
          icon: Home,
          isActive: isActive("/"),
        },
      ],
    },
    {
      key: "product",
      title: "Product Management",
      items: [
        {
          key: "produk",
          label: "Produk",
          icon: Package,
          submenu: [
            { path: "/products", label: "Semua Produk" },
            { path: "/categories", label: "Kategori Produk" },
          ],
        },
      ],
    },
    {
      key: "transactions",
      title: "Transactions",
      items: [
        {
          path: "/transactions",
          label: "Riwayat Transaksi",
          icon: DollarSign,
          isActive: isActive("/transactions"),
        },
        {
          key: "rating",
          label: "Rating Produk",
          icon: Star,
          submenu: [{ path: "/ratings", label: "Semua Rating" }],
        },
      ],
    },
    {
      key: "reports",
      title: "Laporan",
      items: [
        {
          key: "laporan",
          label: "Laporan Penjualan",
          icon: BarChart3,
          submenu: [{ path: "/reports/sales", label: "Laporan Penjualan" }],
        },
      ],
    },
    {
      key: "customer",
      title: "Customer Management",
      items: [
        {
          key: "pelanggan",
          label: "Pelanggan",
          icon: Users,
          submenu: [{ path: "/customer/semua", label: "Semua Pelanggan" }],
        },
      ],
    },
  ];

  const filteredMenuItems = menuItems
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.submenu &&
            item.submenu.some((sub) =>
              sub.label.toLowerCase().includes(searchTerm.toLowerCase())
            ))
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo - Diperbaiki untuk menggunakan logo dari asset */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <img
            src={Logo}
            alt="JusFabel Logo"
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="font-semibold text-gray-900">JusFabel Admin</h1>
            <p className="text-xs text-gray-500">Management Panel</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          {filteredMenuItems.map((section) => (
            <div key={section.key} className="mb-6">
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div key={item.key || item.path}>
                    {item.submenu ? (
                      <div>
                        <button
                          onClick={() => toggleMenu(item.key)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                            isParentActive(item.submenu.map((sub) => sub.path))
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                          </div>
                          {expandedMenus[item.key] ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        {expandedMenus[item.key] && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                                  isActive(subItem.path)
                                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                          item.isActive
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
