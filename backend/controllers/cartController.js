import userModel from "../models/UserModel.js";

// ADD TO CART
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ FIX
    const { itemId } = req.body;

    let userData = await userModel.findById(userId);

    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || {};

    cartData[itemId] = (cartData[itemId] || 0) + 1;

    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Added to cart", cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// REMOVE FROM CART
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.body;

    let userData = await userModel.findById(userId);

    let cartData = userData.cartData || {};

    if (cartData[itemId] > 1) {
      cartData[itemId] -= 1;
    } else {
      delete cartData[itemId];
    }

    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Removed from cart", cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// GET CART
export const getcart = async (req, res) => {
  try {
    const userId = req.user.userId;

    let userData = await userModel.findById(userId);

    res.json({ success: true, cartData: userData.cartData || {} });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};
