import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../Context/StoreContext";

const MyOrders = () => {
  const { url, token, setToken, tokenLoading } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      // Wait for token to finish loading from localStorage before checking
      if (tokenLoading) {
        return;
      }

      console.log("[MyOrders] token in context:", token);
      if (!token) {
        setError("Please login to view your orders.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${url}/api/order/user`, {
          headers: {
            token,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        console.log("[MyOrders] /api/order/user response:", data);

        // Handle auth errors: clear bad token and ask user to login again
        if (response.status === 401 || data.message === "Invalid token" || data.message === "Not authorized! Login again") {
          localStorage.removeItem("token");
          setToken("");
          setError("Session expired or invalid. Please login again.");
          return;
        }

        if (!data.success) {
          setError(data.message || "Failed to load orders.");
        } else {
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("[MyOrders] Failed to fetch orders", err);
        setError("Something went wrong while loading your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [url, token, tokenLoading]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleString();
  };

  const getPaymentStatusClass = (paid) => {
    return paid ? "status-paid" : "status-pending";
  };

  const getPaymentStatusLabel = (paid) => {
    return paid ? "Paid" : "Pending";
  };

  const getDeliveryStatusClass = (status) => {
    const s = status || "Food Processing";
    if (s === "Delivered") return "delivery-delivered";
    if (s === "Out for delivery") return "delivery-out";
    return "delivery-processing";
  };

  return (
    <div className="my-orders">
      <h2>My Orders</h2>

      {loading && <p className="my-orders-info">Loading your orders...</p>}
      {!loading && error && <p className="my-orders-error">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p className="my-orders-info">You have not placed any orders yet.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="my-orders-list">
          {orders.map((order) => (
            <div className="my-orders-card" key={order._id}>
              <div className="my-orders-header">
                <span className="my-orders-id">
                  Order ID: {order._id.slice(-8)}
                </span>
                <span
                  className={`my-orders-status ${getPaymentStatusClass(
                    order.payment
                  )}`}
                >
                  {getPaymentStatusLabel(order.payment)}
                </span>
              </div>

              <div className="my-orders-body">
                <div className="my-orders-section">
                  <h4>Items</h4>
                  <ul>
                    {order.items?.map((item, index) => (
                      <li key={index}>
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">
                          x{item.quantity || item.qty || 1}
                        </span>
                        <span className="item-price">₹{item.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="my-orders-section">
                  <h4>Amount</h4>
                  <p className="my-orders-amount">₹{order.amount}</p>
                  <p className="my-orders-date">{formatDate(order.date)}</p>
                </div>

                <div className="my-orders-section">
                  <h4>Delivery</h4>
                  {order.address ? (
                    <p className="my-orders-address">
                      {order.address.firstName} {order.address.lastName}
                      <br />
                      {order.address.street}
                      <br />
                      {order.address.city}, {order.address.state} -{" "}
                      {order.address.zipCode}
                      <br />
                      {order.address.country}
                      <br />
                      Phone: {order.address.phone}
                    </p>
                  ) : (
                    <p className="my-orders-address">-</p>
                  )}
                </div>
              </div>

              <div className="my-orders-footer">
                <span className={`my-orders-status-text ${getDeliveryStatusClass(order.status)}`}>
                  Status: {order.status || "Food Processing"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
