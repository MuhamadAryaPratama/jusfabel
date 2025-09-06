import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axiosClient from "../axiosClient";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axiosClient.get("/admin/orders");
      setOrders(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized access. Please login as admin.");
        localStorage.removeItem("access_token");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to fetch orders. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axiosClient.put(`/admin/orders/${id}/status`, {
        status: newStatus,
      });
      fetchOrders();
      setError(null);
    } catch (err) {
      console.error("Error updating order status:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized access. Please login as admin.");
        localStorage.removeItem("access_token");
      } else {
        alert(
          err.response?.data?.message ||
            "Failed to update order status. Please try again later."
        );
      }
    }
  };

  const formatCurrency = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatus = (order) => {
    if (!order.payment) return "Belum Bayar";
    return order.payment.payment_status === "completed"
      ? "Sudah Bayar"
      : "Menunggu Pembayaran";
  };

  if (error === "Unauthorized access. Please login as admin.") {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                No
              </th>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                Order Date
              </th>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                Customer
              </th>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                Items
              </th>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                Amount
              </th>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                Contact
              </th>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                Payment
              </th>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                Status
              </th>
              <th className="py-3 px-4 border-b font-medium text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order, index) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-center">{index + 1}</td>
                <td className="py-3 px-4">{formatDate(order.created_at)}</td>
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{order.name}</div>
                  <div className="text-sm text-gray-500">{order.address}</div>
                  <div className="text-xs text-gray-500">
                    User: {order.user?.name || "N/A"}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">{order.food_name}</div>
                </td>
                <td className="py-3 px-4 font-medium">
                  {formatCurrency(order.total_amount)}
                </td>
                <td className="py-3 px-4">
                  <div className="text-sm">{order.phone}</div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getPaymentStatus(order) === "Sudah Bayar"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {getPaymentStatus(order)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusUpdate(order.id, e.target.value)
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No orders found.</p>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
