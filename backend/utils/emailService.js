import dotenv from "dotenv";

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CraveCart <onboarding@resend.dev>";

const sendViaResend = async ({ to, subject, html, text }) => {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured. Skipping email send.");
    return { success: false, message: "Email not configured" };
  }

  if (!to) {
    console.warn("[Email] No recipient email provided");
    return { success: false, message: "No email address" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Email] Resend API error:", data);
      return { success: false, message: data.message || "Failed to send email" };
    }

    console.log("[Email] Email sent via Resend:", {
      to,
      id: data.id,
    });

    return { success: true, id: data.id };
  } catch (error) {
    console.error("[Email] Resend request failed:", error);
    return { success: false, error: error.message };
  }
};

// Email template for order confirmation
const getOrderConfirmationEmail = (order, userName) => {
  const itemsList = order.items
    .map(
      (item) =>
        `  • ${item.name} x${item.quantity || item.qty || 1} - ₹${item.price}`
    )
    .join("\n");

  return {
    subject: `Order Confirmed - Order #${order._id.toString().slice(-8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #F37254; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
            .status-badge { display: inline-block; padding: 5px 10px; background-color: #e6ffed; color: #2e7d32; border-radius: 3px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍔 CraveCart</h1>
              <h2>Order Confirmed!</h2>
            </div>
            <div class="content">
              <p>Hello ${userName || "Customer"},</p>
              <p>Thank you for your order! We've received your payment and your order is being processed.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${order._id.toString().slice(-8)}</p>
                <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleString()}</p>
                <p><strong>Payment Status:</strong> <span class="status-badge">Paid</span></p>
                
                <h4>Items Ordered:</h4>
                <pre style="font-family: Arial; white-space: pre-wrap;">${itemsList}</pre>
                
                <p><strong>Total Amount:</strong> ₹${order.amount}</p>
                
                <h4>Delivery Address:</h4>
                <p>
                  ${order.address?.firstName || ""} ${order.address?.lastName || ""}<br>
                  ${order.address?.street || ""}<br>
                  ${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.zipCode || ""}<br>
                  ${order.address?.country || ""}<br>
                  Phone: ${order.address?.phone || ""}
                </p>
              </div>
              
              <p>We'll notify you once your order is out for delivery!</p>
              <p>Thank you for choosing CraveCart!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CraveCart. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Order Confirmed - Order #${order._id.toString().slice(-8)}

Hello ${userName || "Customer"},

Thank you for your order! We've received your payment and your order is being processed.

Order Details:
Order ID: ${order._id.toString().slice(-8)}
Order Date: ${new Date(order.date).toLocaleString()}
Payment Status: Paid

Items Ordered:
${itemsList}

Total Amount: ₹${order.amount}

Delivery Address:
${order.address?.firstName || ""} ${order.address?.lastName || ""}
${order.address?.street || ""}
${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.zipCode || ""}
${order.address?.country || ""}
Phone: ${order.address?.phone || ""}

We'll notify you once your order is out for delivery!

Thank you for choosing CraveCart!
    `,
  };
};

// Email template for delivery confirmation
const getDeliveryConfirmationEmail = (order, userName) => {
  const itemsList = order.items
    .map(
      (item) =>
        `  • ${item.name} x${item.quantity || item.qty || 1} - ₹${item.price}`
    )
    .join("\n");

  return {
    subject: `Order Delivered - Order #${order._id.toString().slice(-8)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2e7d32; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
            .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
            .status-badge { display: inline-block; padding: 5px 10px; background-color: #e6ffed; color: #2e7d32; border-radius: 3px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍔 CraveCart</h1>
              <h2>Order Delivered! 🎉</h2>
            </div>
            <div class="content">
              <p>Hello ${userName || "Customer"},</p>
              <p>Great news! Your order has been successfully delivered.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> ${order._id.toString().slice(-8)}</p>
                <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleString()}</p>
                <p><strong>Delivery Status:</strong> <span class="status-badge">Delivered</span></p>
                
                <h4>Items Delivered:</h4>
                <pre style="font-family: Arial; white-space: pre-wrap;">${itemsList}</pre>
                
                <p><strong>Total Amount:</strong> ₹${order.amount}</p>
                
                <h4>Delivered To:</h4>
                <p>
                  ${order.address?.firstName || ""} ${order.address?.lastName || ""}<br>
                  ${order.address?.street || ""}<br>
                  ${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.zipCode || ""}<br>
                  ${order.address?.country || ""}<br>
                  Phone: ${order.address?.phone || ""}
                </p>
              </div>
              
              <p>We hope you enjoyed your meal! If you have any feedback, please let us know.</p>
              <p>Thank you for choosing CraveCart!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CraveCart. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Order Delivered - Order #${order._id.toString().slice(-8)}

Hello ${userName || "Customer"},

Great news! Your order has been successfully delivered.

Order Details:
Order ID: ${order._id.toString().slice(-8)}
Order Date: ${new Date(order.date).toLocaleString()}
Delivery Status: Delivered

Items Delivered:
${itemsList}

Total Amount: ₹${order.amount}

Delivered To:
${order.address?.firstName || ""} ${order.address?.lastName || ""}
${order.address?.street || ""}
${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.zipCode || ""}
${order.address?.country || ""}
Phone: ${order.address?.phone || ""}

We hope you enjoyed your meal! If you have any feedback, please let us know.

Thank you for choosing CraveCart!
    `,
  };
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (order, userEmail, userName) => {
  const emailContent = getOrderConfirmationEmail(order, userName);
  return sendViaResend({
    to: userEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
};

// Send delivery confirmation email
export const sendDeliveryConfirmationEmail = async (order, userEmail, userName) => {
  const emailContent = getDeliveryConfirmationEmail(order, userName);
  return sendViaResend({
    to: userEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
};
