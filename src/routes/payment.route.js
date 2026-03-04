import { Router } from "express";
import paymentController from "../controllers/payment.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const paymentRouter = Router();

paymentRouter.post("/intent/:booking_id",verifyUser, paymentController.createPaymentIntent);
paymentRouter.post("/confirm", verifyUser, paymentController.confirmPayment);
paymentRouter.post("/cancel", verifyUser, paymentController.cancelPendingBookingPayment);
paymentRouter.post("/webhook",verifyUser, paymentController.stripeWebhook);

export { paymentRouter };
 