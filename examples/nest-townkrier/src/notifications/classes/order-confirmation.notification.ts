import {
  Notification,
  NotificationChannel,
  NotificationPriority,
} from 'townkrier-core';

/**
 * Order confirmation notification
 */
export class OrderConfirmationNotification extends Notification {
  constructor(
    private orderId: string,
    private orderTotal: number,
    private itemCount: number,
    private userName: string,
  ) {
    super();
    this.priority = NotificationPriority.HIGH;
  }

  via(): NotificationChannel[] {
    return [NotificationChannel.EMAIL];
  }

  toEmail() {
    return {
      subject: `Order Confirmation - #${this.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4CAF50; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Order Confirmed!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${this.userName},</p>
            <p style="color: #666;">
              Thank you for your order! We've received your payment and your order is being processed.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0; color: #666;">Order ID:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold;">${this.orderId}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 10px 0; color: #666;">Items:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold;">${this.itemCount}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666;">Total:</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #4CAF50; font-size: 18px;">
                    $${this.orderTotal.toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
            <p style="color: #666;">
              We'll send you another notification when your order ships. You can track your order 
              status in your account dashboard.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://yourapp.com/orders/${this.orderId}" 
                 style="background: #4CAF50; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                View Order Details
              </a>
            </div>
          </div>
        </div>
      `,
      text: `Order #${this.orderId} confirmed! Total: $${this.orderTotal.toFixed(2)}. 
      ${this.itemCount} items. We'll notify you when it ships.`,
    };
  }
}
