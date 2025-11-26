import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderDetails {
  orderId: string;
  customerEmail?: string;
  amount: number;
  musicStyle?: string;
  mood?: string;
  lyrics?: string;
  voiceType?: string;
  songTitle?: string;
  createdAt: Date;
}

export async function sendOrderNotification(order: OrderDetails): Promise<boolean> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  
  if (!resend) {
    console.log('[Email] Resend API key not configured, skipping notification');
    return false;
  }
  
  if (!adminEmail) {
    console.log('[Email] Admin notification email not configured, skipping notification');
    return false;
  }

  const formattedAmount = (order.amount / 100).toFixed(2);
  const orderDate = new Date(order.createdAt).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .order-info { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .order-info h2 { margin-top: 0; color: #667eea; font-size: 18px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #6b7280; }
    .value { font-weight: 500; color: #111827; }
    .amount { font-size: 24px; color: #059669; font-weight: bold; }
    .lyrics-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 15px; border-radius: 0 8px 8px 0; }
    .lyrics-box h3 { margin: 0 0 10px 0; color: #92400e; font-size: 14px; }
    .lyrics-content { white-space: pre-wrap; color: #78350f; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 新订单通知 / New Order Notification</h1>
    </div>
    <div class="content">
      <div class="order-info">
        <h2>订单信息 / Order Details</h2>
        <div class="info-row">
          <span class="label">订单编号 / Order ID:</span>
          <span class="value">${order.orderId.slice(0, 8).toUpperCase()}</span>
        </div>
        <div class="info-row">
          <span class="label">下单时间 / Order Time:</span>
          <span class="value">${orderDate}</span>
        </div>
        <div class="info-row">
          <span class="label">订单金额 / Amount:</span>
          <span class="value amount">¥${formattedAmount}</span>
        </div>
      </div>
      
      <div class="order-info">
        <h2>音乐需求 / Music Requirements</h2>
        ${order.songTitle ? `
        <div class="info-row">
          <span class="label">歌曲标题 / Song Title:</span>
          <span class="value">${order.songTitle}</span>
        </div>
        ` : ''}
        ${order.musicStyle ? `
        <div class="info-row">
          <span class="label">音乐风格 / Style:</span>
          <span class="value">${order.musicStyle}</span>
        </div>
        ` : ''}
        ${order.mood ? `
        <div class="info-row">
          <span class="label">情感氛围 / Mood:</span>
          <span class="value">${order.mood}</span>
        </div>
        ` : ''}
        ${order.voiceType ? `
        <div class="info-row">
          <span class="label">声音类型 / Voice Type:</span>
          <span class="value">${order.voiceType === 'male' ? '男声 Male' : order.voiceType === 'female' ? '女声 Female' : order.voiceType}</span>
        </div>
        ` : ''}
        ${order.lyrics ? `
        <div class="lyrics-box">
          <h3>歌词/关键词 / Lyrics/Keywords:</h3>
          <div class="lyrics-content">${order.lyrics}</div>
        </div>
        ` : ''}
      </div>
      
      <div style="text-align: center;">
        <a href="https://www.musicsforyou.com/admin/orders/${order.orderId}" class="cta-button">
          查看订单详情 / View Order Details
        </a>
      </div>
    </div>
    <div class="footer">
      <p>音为你 | Your Melody - 让每一段旋律都为你而奏</p>
      <p>此邮件由系统自动发送，请勿直接回复</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Your Melody <onboarding@resend.dev>',
      to: [adminEmail],
      subject: `🎵 新订单通知 - ¥${formattedAmount} - #${order.orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    if (error) {
      console.error('[Email] Failed to send notification:', error);
      return false;
    }

    console.log('[Email] Order notification sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('[Email] Error sending notification:', error);
    return false;
  }
}

export async function sendOrderStatusUpdate(
  customerEmail: string,
  orderId: string,
  newStatus: string,
  musicFileUrl?: string
): Promise<boolean> {
  if (!resend) {
    console.log('[Email] Resend API key not configured, skipping notification');
    return false;
  }

  const statusMessages: Record<string, { zh: string; en: string; color: string }> = {
    processing: { zh: '制作中', en: 'In Production', color: '#3b82f6' },
    completed: { zh: '已完成', en: 'Completed', color: '#10b981' },
    cancelled: { zh: '已取消', en: 'Cancelled', color: '#ef4444' },
  };

  const status = statusMessages[newStatus];
  if (!status) return false;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
    .status-badge { display: inline-block; background: ${status.color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 订单状态更新 / Order Status Update</h1>
    </div>
    <div class="content" style="text-align: center;">
      <p>您的订单 <strong>#${orderId.slice(0, 8).toUpperCase()}</strong> 状态已更新</p>
      <p>Your order status has been updated</p>
      <div class="status-badge">${status.zh} / ${status.en}</div>
      ${newStatus === 'completed' && musicFileUrl ? `
      <p style="margin-top: 20px;">您的定制音乐已完成！请登录网站下载。</p>
      <p>Your custom music is ready! Please log in to download.</p>
      ` : ''}
      <a href="https://www.musicsforyou.com/orders" class="cta-button">
        查看订单 / View Order
      </a>
    </div>
    <div class="footer">
      <p>音为你 | Your Melody</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Your Melody <onboarding@resend.dev>',
      to: [customerEmail],
      subject: `🎵 订单状态更新 - ${status.zh} / ${status.en} - #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    if (error) {
      console.error('[Email] Failed to send status update:', error);
      return false;
    }

    console.log('[Email] Status update sent successfully:', data?.id);
    return true;
  } catch (error) {
    console.error('[Email] Error sending status update:', error);
    return false;
  }
}
