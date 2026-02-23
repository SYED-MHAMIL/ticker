import paymentService from "../services/payment.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const createPaymentIntent = AsyncHandler(async (req, res) => {
  const data = await paymentService.createPaymentIntent(req, res);
  return res.status(201).json(new ApiResponse(201, data, "Payment intent created"));
});

const confirmPayment = AsyncHandler(async (req, res) => {
  const data = await paymentService.confirmPayment(req, res);
  return res.status(200).json(new ApiResponse(200, data, "Payment processed"));
});

const cancelPendingBookingPayment = AsyncHandler(async (req, res) => {
  const data = await paymentService.cancelPendingBookingPayment(req, res);
  return res.status(200).json(new ApiResponse(200, data, "Booking payment cancelled"));
});

const stripeWebhook = AsyncHandler(async (req, res) => {
  const data = await paymentService.handleStripeWebhook(req, res);
  return res.status(200).json(new ApiResponse(200, data, "Webhook processed"));
});

export default {
  createPaymentIntent,
  confirmPayment,
  cancelPendingBookingPayment,
  stripeWebhook,
};
