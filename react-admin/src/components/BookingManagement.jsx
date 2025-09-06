import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Calendar,
  Car,
  Clock,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  User,
  Wrench,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  AlertTriangle,
} from "lucide-react";

const BookingManagement = ({
  isDashboardView = false,
  limit = 10,
  showFilters = true,
}) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    setIsAdmin(userRole === "admin");
    fetchBookings();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let url = isAdmin
        ? `/api/bookings?page=${currentPage}&limit=${limit}`
        : `/api/bookings/my-bookings?page=${currentPage}&limit=${limit}`;

      if (searchTerm) url += `&search=${searchTerm}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Safe access to response data with fallbacks
      const responseData = response.data || {};
      const bookingsData = responseData.data || responseData.bookings || [];
      const paginationData = responseData.pagination || {};

      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setTotalPages(paginationData.totalPages || 1);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch bookings");
      console.error("Error fetching bookings:", err);
      // Set empty array on error to prevent undefined access
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, action) => {
    try {
      setLoading(true);
      let response;

      if (action === "accept") {
        response = await axios.put(
          `/api/bookings/${id}/accept`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else if (action === "reject") {
        response = await axios.put(
          `/api/bookings/${id}/reject`,
          { reason: rejectionReason },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else if (action === "cancel") {
        response = await axios.put(
          `/api/bookings/${id}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      fetchBookings();
      setShowModal(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to update booking status"
      );
      console.error("Error updating booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`/api/bookings/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete booking");
      console.error("Error deleting booking:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = async (id) => {
    try {
      const response = await axios.get(`/api/bookings/${id}/download-ticket`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to download ticket");
      console.error("Error downloading ticket:", err);
    }
  };

  const openModal = (booking, action) => {
    setSelectedBooking(booking);
    setModalAction(action);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setModalAction("");
    setRejectionReason("");
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" /> Pending
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" /> Rejected
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-4 h-4 mr-1" /> Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-4 h-4 mr-1" /> Unknown
          </span>
        );
    }
  };

  // Safe check for bookings array
  const safeBookings = Array.isArray(bookings) ? bookings : [];

  return (
    <div className={isDashboardView ? "" : "container mx-auto px-4 py-8"}>
      {!isDashboardView && (
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Ticket className="w-8 h-8 mr-2" />
          {isAdmin ? "Booking Management" : "My Bookings"}
        </h1>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {showFilters && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by name, plate or queue code"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="text-gray-500" />
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : safeBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {safeBookings.map((booking) => (
                  <tr key={booking?.id || Math.random()}>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking?.user_name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking?.user_email || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Car className="h-5 w-5 text-gray-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking?.merek || "N/A"} {booking?.model || ""} (
                            {booking?.tahun || "N/A"})
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking?.nomer_plat || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Wrench className="h-5 w-5 text-gray-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking?.jenis_service || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${booking?.service_harga || "0"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                        <div className="text-sm text-gray-900">
                          {booking?.tanggal_service
                            ? new Date(
                                booking.tanggal_service
                              ).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(booking?.status || "unknown")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {booking?.status === "accepted" && (
                          <button
                            onClick={() => downloadTicket(booking.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                            title="Download Ticket"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        )}

                        {isAdmin && booking?.status === "pending" && (
                          <>
                            <button
                              onClick={() => openModal(booking, "accept")}
                              className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50"
                              title="Accept Booking"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openModal(booking, "reject")}
                              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                              title="Reject Booking"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </>
                        )}

                        {!isAdmin &&
                          ["pending", "accepted"].includes(booking?.status) && (
                            <button
                              onClick={() => openModal(booking, "cancel")}
                              className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50"
                              title="Cancel Booking"
                            >
                              <AlertCircle className="h-5 w-5" />
                            </button>
                          )}

                        {["pending", "rejected", "canceled"].includes(
                          booking?.status
                        ) && (
                          <button
                            onClick={() => handleDelete(booking?.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                            title="Delete Booking"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal for actions */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {modalAction === "accept" && "Accept Booking"}
                {modalAction === "reject" && "Reject Booking"}
                {modalAction === "cancel" && "Cancel Booking"}
              </h3>

              {modalAction === "accept" && (
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to accept this booking? A queue code
                  will be generated.
                </p>
              )}

              {modalAction === "reject" && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Please provide a reason for rejection:
                  </p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                  />
                </div>
              )}

              {modalAction === "cancel" && (
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to cancel this booking?
                </p>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    modalAction === "accept"
                      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      : modalAction === "reject"
                      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                      : "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                  }`}
                  onClick={() =>
                    handleStatusUpdate(selectedBooking?.id, modalAction)
                  }
                  disabled={modalAction === "reject" && !rejectionReason}
                >
                  {modalAction === "accept" && "Accept"}
                  {modalAction === "reject" && "Reject"}
                  {modalAction === "cancel" && "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
