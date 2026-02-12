import React, { useEffect, useState } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/admin_assets/assets";

const ORDER_STATUSES = ["Food Processing", "Out for delivery", "Delivered"];

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/order/list`);
      console.log("[Admin] /api/order/list response:", response.data);

      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("[Admin] Failed to fetch orders", error);
      toast.error("Something went wrong while loading orders");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleString();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      console.log("[Admin] Updating status", { orderId, newStatus });
      const response = await axios.patch(`${url}/api/order/status`, {
        orderId,
        status: newStatus,
      });
      console.log("[Admin] Status update response:", response.data);
      if (response.data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderId ? { ...o, status: newStatus } : o
          )
        );
        toast.success("Status updated");
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("[Admin] Failed to update status", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update status";
      console.error("[Admin] Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  return (
    <div className="orders add flex-col">
      <p>Orders</p>

      <div className="orders-table header">
        <b>Order</b>
        <b>Items</b>
        <b>Amount</b>
        <b>Payment</b>
        <b>Status</b>
        <b>Date</b>
      </div>

      {orders.map((order) => (
        <div key={order._id} className="orders-table">
          <div className="orders-order-id">
            <img src={assets.parcel_icon} alt="" />
            <span>{order._id.slice(-8)}</span>
          </div>

          <div className="orders-items">
            {order.items?.map((item, index) => (
              <span key={index}>
                {item.name} x{item.quantity || item.qty || 1}
                {index < order.items.length - 1 && ", "}
              </span>
            ))}
          </div>

          <div className="orders-amount">₹{order.amount}</div>

          <div className={`orders-payment ${order.payment ? "paid" : "pending"}`}>
            {order.payment ? "Paid" : "Pending"}
          </div>

          <div className="orders-status">
            <select
              className="orders-status-select"
              value={order.status || "Food Processing"}
              onChange={(e) => handleStatusChange(order._id, e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="orders-date">{formatDate(order.date)}</div>
        </div>
      ))}

      {orders.length === 0 && (
        <p className="orders-empty">No orders found yet.</p>
      )}
    </div>
  );
};

export default Orders;
