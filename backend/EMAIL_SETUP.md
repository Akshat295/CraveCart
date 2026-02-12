# Email Setup Guide for CraveCart

This guide will help you configure a production-ready email service to send automated order confirmation and delivery emails.

## Option 1 (recommended on Render): Resend

Resend is a free, production-friendly email API that works well on Render (no blocked SMTP ports).

### Step 1: Create a Resend account

1. Go to: https://resend.com/
2. Sign up and log in
3. Go to **API Keys** and create a new API key

### Step 2: Verify a sender

For quick testing you can use their default domain:

- From: `onboarding@resend.dev`

For production, you should verify your own domain and use something like:

- `no-reply@yourdomain.com`

### Step 3: Update `.env` file

Add these lines to your `backend/.env` file:

```env
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL="CraveCart <onboarding@resend.dev>"
```

> On Render, set the same variables in the backend **Environment** tab.

### Step 4: Restart Backend Server

After updating `.env`, restart your backend server:

```bash
cd backend
npm start
```

### Testing

1. Place a test order and complete payment → You should receive an order confirmation email
2. In admin panel, change order status to "Delivered" → You should receive a delivery confirmation email

### Troubleshooting

- **"Email not configured" warning**: Check that `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set in `.env`
- **No emails received**: Check spam folder, verify email address in order, check backend logs for errors

---

## Option 2 (local dev only): Gmail via Nodemailer

If you are running everything locally and ports are not blocked, you can still use Gmail + Nodemailer as originally documented. On hosts like Render, prefer Resend or another HTTP-based provider.
