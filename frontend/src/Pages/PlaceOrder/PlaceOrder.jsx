import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PlaceOrder.css";
import { StoreContext } from "../../Context/StoreContext";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    cartItems,
    food_list,
    token,
    url,
    setCartItems,
  } = useContext(StoreContext);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });

  const deliveryFee = getTotalCartAmount() === 0 ? 0 : 2;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.info("Please login to place an order.");
      return;
    }

    const amount = getTotalCartAmount() + deliveryFee;

    if (amount <= 0) {
      toast.info("Your cart is empty.");
      return;
    }

    // Build items array from cart
    const items = food_list
      .filter((food) => cartItems[food._id] > 0)
      .map((food) => ({
        itemId: food._id,
        name: food.name,
        quantity: cartItems[food._id],
        price: food.price,
      }));

    if (items.length === 0) {
      toast.info("No items in cart.");
      return;
    }

    const address = { ...formData };

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay SDK. Please try again.");
        return;
      }

      const response = await axios.post(
        `${url}/api/order/place`,
        {
          items,
          amount,
          address,
        },
        {
          headers: { token },
        }
      );

      if (!response.data.success) {
        toast.error(response.data.message || "Failed to create order");
        return;
      }

      const { razorpayOrder, orderId, keyId } = response.data;

      const options = {
        key: keyId, // from backend
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "CraveCart",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: async function (paymentResponse) {
          try {
            const verifyRes = await axios.post(
              `${url}/api/order/verify`,
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                orderId,
              },
              {
                headers: { token },
              }
            );

            if (verifyRes.data.success) {
              console.log(
                "Payment verified. Updated order from server:",
                verifyRes.data.order
              );
              setCartItems({});
              navigate("/myorders");
            } else {
              console.warn(
                "Payment verification failed:",
                verifyRes.data.message
              );
              toast.error(verifyRes.data.message || "Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            toast.error("Payment verification error. Please contact support.");
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#F37254",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while processing your order.");
    }
  };

  return (
    <form className="place-order" onSubmit={handlePlaceOrder}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>

        <div className="multi-fields">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="street"
          placeholder="Street"
          value={formData.street}
          onChange={handleChange}
          required
        />

        <div className="multi-fields">
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
            required
          />
        </div>

        <div className="multi-fields">
          <input
            type="text"
            name="zipCode"
            placeholder="Zip Code"
            value={formData.zipCode}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={handleChange}
            required
          />
        </div>

        <input
          type="text"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>

          <div className="cart-total-details">
            <p>Subtotal</p>
            <p>&#8377;{getTotalCartAmount()}</p>
          </div>
          <hr />

          <div className="cart-total-details">
            <p>Delivery fee</p>
            <p>&#8377;{deliveryFee}</p>
          </div>
          <hr />

          <div className="cart-total-details">
            <b>Total</b>
            <b>&#8377;{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
          </div>

          <button type="submit">Proceed to Payment</button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
