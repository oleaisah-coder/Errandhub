const { Resend } = require('resend');
const { pool } = require('../config/database');

// Initialize Resend with API Key from environment variables
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ErrandHub <onboarding@resend.dev>';

// Basic HTML Template Wrapper
const getBaseTemplate = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ErrandHub</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      width: 100%;
      background-color: #f7f9fc;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #eef2f6;
    }
    .header {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      color: rgba(255, 255, 255, 0.8);
      margin: 8px 0 0 0;
      font-size: 14px;
    }
    .content {
      padding: 40px 32px;
      color: #334155;
      line-height: 1.6;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
    }
    .footer p {
      margin: 0;
      color: #64748b;
      font-size: 13px;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      margin-top: 24px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.15);
      transition: background-color 0.2s ease;
    }
    .btn:hover {
      background-color: #1d4ed8;
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-pending { background-color: #fef3c7; color: #d97706; }
    .badge-confirmed { background-color: #dbeafe; color: #1e40af; }
    .badge-assigned { background-color: #e0f2fe; color: #0369a1; }
    .badge-progress { background-color: #e0e7ff; color: #4338ca; }
    .badge-delivered { background-color: #d1fae5; color: #065f46; }
    .badge-cancelled { background-color: #fee2e2; color: #991b1b; }
    
    .table-container {
      margin-top: 24px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 12px 16px;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
    }
    td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .price-row td {
      font-weight: 600;
      background-color: #f8fafc;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>ErrandHub</h1>
        <p>Your errands, done simple.</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ErrandHub Inc. All rights reserved.</p>
        <p style="margin-top: 8px; font-size: 11px; color: #94a3b8;">
          You received this email because you registered on ErrandHub or made a request.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Helper to log or send email via Resend
const sendMail = async ({ to, subject, html }) => {
  if (!resend) {
    console.log('\n==================================================');
    console.log(`[MOCK EMAIL] TO: ${to}`);
    console.log(`[MOCK EMAIL] SUBJECT: ${subject}`);
    console.log('==================================================');
    console.log(`[MOCK EMAIL] HTML preview:\n${html.substring(0, 500)}...\n[Truncated]`);
    console.log('==================================================\n');
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent successfully via Resend. ID: ${data.id || (data.data && data.data.id)}`);
    return { success: true, id: data.id || (data.data && data.data.id) };
  } catch (error) {
    console.error('[EMAIL] Failed to send email via Resend:', error);
    return { success: false, error };
  }
};

/**
 * Send Welcome Email to a newly registered user
 */
const sendWelcomeEmail = async (email, firstName) => {
  const content = `
    <h2 style="font-size: 20px; color: #1e293b; margin-top: 0;">Welcome to ErrandHub, ${firstName}!</h2>
    <p>We are absolutely thrilled to have you join our community. ErrandHub is designed to take the stress out of your daily schedule by connecting you with trusted, verified runners to complete your errands.</p>
    <p>Here is what you can do right now:</p>
    <ul style="padding-left: 20px; color: #475569;">
      <li>Post an errand (shopping, delivery, custom tasks)</li>
      <li>Get matched with professional, available runners</li>
      <li>Track progress in real-time and chat with your runner</li>
    </ul>
    <p>Click the button below to head to your dashboard and create your first errand!</p>
    <div style="text-align: center;">
      <a href="https://errandhub.vercel.app" class="btn">Go to Dashboard</a>
    </div>
    <p style="margin-top: 32px;">If you have any questions or feedback, simply reply to this email. We're here to help!</p>
    <p style="margin-bottom: 0;">Cheers,<br><strong>The ErrandHub Team</strong></p>
  `;
  const html = getBaseTemplate(content);
  return sendMail({ to: email, subject: 'Welcome to ErrandHub! 🚀', html });
};

/**
 * Send Order Creation/Receipt Email
 */
const sendOrderCreatedEmail = async (email, firstName, order) => {
  const badgeClass = `badge-pending`;
  const itemsHtml = order.items && order.items.length > 0 
    ? order.items.map(item => `
        <tr>
          <td>${item.name} ${item.description ? `<br><small style="color: #64748b;">${item.description}</small>` : ''}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">₦${parseFloat(item.estimatedPrice || 0).toLocaleString()}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="text-align: center; color: #64748b;">No specific items specified</td></tr>';

  const content = `
    <h2 style="font-size: 20px; color: #1e293b; margin-top: 0;">Errand Received!</h2>
    <p>Hi ${firstName},</p>
    <p>Thank you for placing an order with ErrandHub. We've received your errand request and it is currently undergoing admin review to verify runner availability and service fees.</p>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; font-size: 16px; color: #0f172a;">Order Details</h3>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Order Number:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">${order.orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Errand Type:</td>
          <td style="padding: 4px 0; text-align: right; text-transform: capitalize; color: #0f172a;">${order.errandType.replace('_', ' ')}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Status:</td>
          <td style="padding: 4px 0; text-align: right;"><span class="badge ${badgeClass}">Awaiting Review</span></td>
        </tr>
      </table>
    </div>

    <h3 style="font-size: 16px; color: #0f172a; margin-top: 24px;">Items List</h3>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Est. Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="price-row">
            <td colspan="2">Delivery Fee</td>
            <td style="text-align: right;">₦${parseFloat(order.deliveryFee || 0).toLocaleString()}</td>
          </tr>
          <tr class="price-row">
            <td colspan="2">Service Fee</td>
            <td style="text-align: right;">₦${parseFloat(order.serviceFee || 0).toLocaleString()}</td>
          </tr>
          <tr class="price-row" style="font-size: 16px; border-top: 2px solid #cbd5e1;">
            <td colspan="2" style="color: #2563eb; font-weight: 700;">Total Estimate</td>
            <td style="text-align: right; color: #2563eb; font-weight: 700;">₦${parseFloat(order.totalAmount || 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="text-align: center;">
      <a href="https://errandhub.vercel.app/orders/${order.id}" class="btn">View Order Details</a>
    </div>
  `;
  const html = getBaseTemplate(content);
  return sendMail({ to: email, subject: `Errand Order Acknowledged - ${order.orderNumber} 📦`, html });
};

/**
 * Send Order Status Update Email
 */
const sendOrderStatusEmail = async (email, firstName, orderNumber, status, statusMessage) => {
  const statusBadges = {
    pending: '<span class="badge badge-pending">Pending</span>',
    PENDING_ADMIN_REVIEW: '<span class="badge badge-pending">Pending Admin Review</span>',
    confirmed: '<span class="badge badge-confirmed">Confirmed</span>',
    runner_assigned: '<span class="badge badge-assigned">Runner Assigned</span>',
    item_purchased: '<span class="badge badge-progress">Items Purchased</span>',
    on_the_way: '<span class="badge badge-progress">On The Way</span>',
    delivered: '<span class="badge badge-delivered">Delivered</span>',
    cancelled: '<span class="badge badge-cancelled">Cancelled</span>',
  };

  const badgeHtml = statusBadges[status] || `<span class="badge badge-progress">${status}</span>`;

  const content = `
    <h2 style="font-size: 20px; color: #1e293b; margin-top: 0;">Order Update: ${status.replace('_', ' ').toUpperCase()}</h2>
    <p>Hi ${firstName},</p>
    <p>Your order status has been updated. Here are the details:</p>
    
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Order Number:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0f172a;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Current Status:</td>
          <td style="padding: 4px 0; text-align: right;">${badgeHtml}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Update:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: 500; color: #1e293b;">${statusMessage}</td>
        </tr>
      </table>
    </div>

    <p>Keep track of your runner and view updates in real-time by clicking the link below.</p>
    <div style="text-align: center;">
      <a href="https://errandhub.vercel.app" class="btn">Track on Dashboard</a>
    </div>
  `;
  const html = getBaseTemplate(content);
  return sendMail({ to: email, subject: `Update on Order ${orderNumber} - ${status.replace('_', ' ').toUpperCase()}`, html });
};

/**
 * Centered method to resolve user details and send email based on notification triggers
 */
const triggerEmailFromNotification = async (userId, title, message) => {
  try {
    const userResult = await pool.query(
      'SELECT email, first_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.warn(`[EMAIL TRIGGER] No user found for ID: ${userId}. Skipping email.`);
      return;
    }

    const { email, first_name: firstName } = userResult.rows[0];

    const content = `
      <h2 style="font-size: 20px; color: #1e293b; margin-top: 0;">${title}</h2>
      <p>Hi ${firstName},</p>
      <p>${message}</p>
      
      <div style="text-align: center;">
        <a href="https://errandhub.vercel.app" class="btn">View ErrandHub</a>
      </div>
    `;
    const html = getBaseTemplate(content);
    return sendMail({ to: email, subject: `${title} 🔔`, html });
  } catch (error) {
    console.error('[EMAIL TRIGGER] Error sending notification email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderCreatedEmail,
  sendOrderStatusEmail,
  triggerEmailFromNotification,
  sendMail,
};
