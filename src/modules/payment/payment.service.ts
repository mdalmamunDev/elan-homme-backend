import { Payment } from './payment.model';
import { Subscription } from '../subscription/subscription.model';
import { Magazine } from '../magazine/magazine.model';
import { mollieClient } from '../../helpers/mollie';
import { addPeriod } from '../subscription/subscription.service';

// Called by Mollie's webhook with just the payment id — always re-fetch from Mollie,
// never trust the webhook body itself (per Mollie's integration guidelines).
const handleWebhook = async (mollieId: string) => {
  const payment = await Payment.findOne({ mollieId });
  if (!payment) return; // not one of ours — ignore

  const molliePayment = await mollieClient.payments.get(mollieId);
  const isPaid = molliePayment.status === 'paid';

  payment.status = molliePayment.status as any;
  payment.method = molliePayment.method || undefined;
  if (isPaid) payment.paidAt = new Date();
  await payment.save();

  const subscription = await Subscription.findById(payment.subscriptionId);
  if (!subscription) return;

  const magazine = await Magazine.findById(subscription.magazineId);
  const magazineTitle = magazine?.title || 'your magazine';

  if (isPaid) {
    if (payment.type === 'first') {
      subscription.status = 'active';
      subscription.startDate = new Date();
      subscription.endDate = addPeriod(new Date(), subscription.period);

      // First payments on a customer set up a mandate for future recurring charges —
      // fetch it (it's an async relation in this SDK version, not a plain property).
      const mandate = await molliePayment.getMandate();
      if (mandate) subscription.mollieMandateId = mandate.id;

      await subscription.save();

      // const successTpl = EmailTemplates.paymentSuccess(subscription.payer.name, magazineTitle);
      // await sendEmail(subscription.payer.email, successTpl.subject, successTpl.html);

      if (subscription.orderType === 'gift' && subscription.recipient) {
        // const payerTpl = EmailTemplates.giftToPayer(subscription.payer.name, subscription.recipient.name, magazineTitle);
        // await sendEmail(subscription.payer.email, payerTpl.subject, payerTpl.html);
        // const giftTpl = EmailTemplates.giftToRecipient(subscription.recipient.name, subscription.payer.name, magazineTitle);
        // await sendEmail(subscription.recipient.email, giftTpl.subject, giftTpl.html);
      }
    } else {
      // renewal payment succeeded — extend the subscription
      subscription.status = 'active';
      subscription.endDate = addPeriod(subscription.endDate || new Date(), subscription.period);
      subscription.renewalReminderSent = false;
      await subscription.save();

      // const successTpl = EmailTemplates.paymentSuccess(subscription.payer.name, magazineTitle);
      // await sendEmail(subscription.payer.email, successTpl.subject, successTpl.html);
    }
  } else if (['failed', 'expired', 'canceled'].includes(molliePayment.status)) {
    // const failedTpl = EmailTemplates.paymentFailed(subscription.payer.name, magazineTitle);
    // await sendEmail(subscription.payer.email, failedTpl.subject, failedTpl.html);
  }
};

export const PaymentService = { handleWebhook };
