import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../shared/catchAsync';
import { PaymentService } from './payment.service';

// Mollie posts `id` as application/x-www-form-urlencoded — always respond 200
// quickly so Mollie doesn't retry, even if internal processing has an issue.
const handleWebhook = catchAsync(async (req, res) => {
  const id = req.body.id;
  if (id) await PaymentService.handleWebhook(id);
  res.sendStatus(StatusCodes.OK);
});

export const PaymentController = { handleWebhook };
