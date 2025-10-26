import {
  Notification,
  NotificationChannel,
  NotificationPriority,
} from '@townkrier/core';

/**
 * Payment received notification
 */
export class PaymentReceivedNotification extends Notification {
  constructor(
    private amount: number,
    private currency: string,
    private transactionId: string,
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
      subject: `Payment Received - ${this.currency} ${this.amount.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">💰 Payment Received</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hi ${this.userName},</p>
            <p style="color: #666;">
              Great news! We've successfully received your payment.
            </p>
            <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <div style="font-size: 48px; font-weight: bold; color: #11998e; margin: 20px 0;">
                ${this.currency} ${this.amount.toFixed(2)}
              </div>
              <p style="color: #999; margin: 5px 0;">Transaction ID</p>
              <p style="color: #666; font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px;">
                ${this.transactionId}
              </p>
            </div>
            <div style="background: #D1F2EB; border-left: 4px solid #11998e; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #0E6655;">
                ✅ Your payment has been processed successfully. You should see this amount reflected 
                in your account shortly.
              </p>
            </div>
            <p style="color: #666;">
              A receipt has been generated and is available in your account. You can download it anytime 
              from your transaction history.
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://yourapp.com/transactions/${this.transactionId}" 
                 style="background: #11998e; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                View Transaction
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you have any questions about this payment, please contact our support team.
            </p>
          </div>
        </div>
      `,
      text: `Payment received: ${this.currency} ${this.amount.toFixed(2)}. 
      Transaction ID: ${this.transactionId}. 
      Your payment has been processed successfully.`,
    };
  }
}
