# Email Setup Guide for CraveCart

This guide will help you configure Gmail to send automated order confirmation and delivery emails.

## Step 1: Enable 2-Step Verification on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

## Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "CraveCart" as the name
5. Click **Generate**
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

## Step 3: Update .env File

Add these lines to your `backend/.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Important:**
- Use your Gmail address for `EMAIL_USER`
- Use the 16-character App Password (remove spaces) for `EMAIL_APP_PASSWORD`
- Do NOT use your regular Gmail password

## Step 4: Restart Backend Server

After updating `.env`, restart your backend server:

```bash
cd backend
npm start
```

## Testing

1. Place a test order and complete payment → You should receive an order confirmation email
2. In admin panel, change order status to "Delivered" → You should receive a delivery confirmation email

## Troubleshooting

- **"Invalid login" error**: Make sure you're using App Password, not regular password
- **"Email not configured" warning**: Check that both `EMAIL_USER` and `EMAIL_APP_PASSWORD` are set in `.env`
- **No emails received**: Check spam folder, verify email address in order, check backend logs for errors
