import Stripe from "stripe";
import { db } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";

let stripeClient = null;
const enumCache = new Map();
let providerColumnCache = null;

const withTransaction = async (handler) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getStripeClient = () => {
  if (!process.env.STRIPE_KEY) {
    throw new ApiError(500, "STRIPE_KEY is missing in environment");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_KEY);
  }

  return stripeClient;
};

const getEnumValues = async (client, tableName, columnName) => {
  const cacheKey = `${tableName}.${columnName}`;
  if (enumCache.has(cacheKey)) {
    return enumCache.get(cacheKey);
  }

  const query = `
    SELECT e.enumlabel
    FROM pg_class c
    JOIN pg_attribute a ON a.attrelid = c.oid
    JOIN pg_type t ON t.oid = a.atttypid
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE c.relname = $1
      AND a.attname = $2
    ORDER BY e.enumsortorder
  `;

  const { rows } = await client.query(query, [tableName, columnName]);
  const values = rows.map((row) => row.enumlabel);
  enumCache.set(cacheKey, values);
  return values;
};

const pickValue = (preferred, supportedValues, fallback = null) => {
  for (const value of preferred) {
    if (supportedValues.includes(value)) {
      return value;
    }
  }

  return fallback ?? supportedValues[0] ?? null;
};

const mapStripeCurrencyToDb = async (client, currency) => {
  const supported = await getEnumValues(client, "payments", "currency");

  if (!supported.length) {
    return currency;
  }

  const normalized = String(currency || "").trim().toUpperCase();

  const direct = supported.find((value) => value.toUpperCase() === normalized);
  if (direct) {
    return direct;
  }

  const aliasMap = {
    USD: "$",
    INR: "INR",
    PKR: "PKR",
  };

  const mapped = aliasMap[normalized] || aliasMap.USD;
  const mappedMatch = supported.find((value) => value.toUpperCase() === mapped.toUpperCase());
  return mappedMatch || supported[0];
};

const mapPaymentStatus = async (client, statusType) => {
  const supported = await getEnumValues(client, "payments", "payment_status");

  if (!supported.length) {
    const fallback = {
      pending: "pending",
      success: "success",
      failed: "failed",
      refunded: "refunded",
    };
    return fallback[statusType] || "pending";
  }

  const mapping = {
    pending: ["pending"],
    success: ["success", "confirmed", "paid"],
    failed: ["failed", "cancelled", "canceled"],
    refunded: ["refunded", "expired"],
  };

  return pickValue(mapping[statusType] || ["pending"], supported);
};

const getProviderColumn = async (client) => {
  if (providerColumnCache !== null) {
    return providerColumnCache;
  }

  const { rows } = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name IN ('provider', 'privider')
      ORDER BY CASE WHEN column_name = 'provider' THEN 0 ELSE 1 END
    `,
  );

  providerColumnCache = rows[0]?.column_name || null;
  return providerColumnCache;
};

const insertPaymentRecord = async (client, payload) => {
  const providerColumn = await getProviderColumn(client);
  const status = await mapPaymentStatus(client, payload.statusType);
  const currency = await mapStripeCurrencyToDb(client, payload.currency);

  const columns = ["booking_id", "amount", "currency", "payment_status"];
  const values = [payload.bookingId, payload.amount, currency, status];

  if (providerColumn) {
    columns.push(providerColumn);

    const providerValues = await getEnumValues(client, "payments", providerColumn);
    const provider = pickValue(["stripe", "razor pay", "razorpay"], providerValues, payload.provider || "stripe");
    values.push(provider);
  }

  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

  const query = `
    INSERT INTO payments (${columns.join(",")})
    VALUES (${placeholders})
    RETURNING *
  `;

  const { rows } = await client.query(query, values);
  return rows[0];
};

const getBookingForUpdate = async (client, bookingId, userId = null) => {
  const params = [bookingId];
  let userClause = "";

  if (userId) {
    userClause = "AND b.user_id = $2";
    params.push(userId);
  }

  const query = `
    SELECT b.id, b.user_id, b.status, b.expires_at, b.event_seat_id, es.seat_status
    FROM bookings b
    JOIN event_seats es ON es.id = b.event_seat_id
    WHERE b.id = $1
      ${userClause}
    FOR UPDATE OF b, es
  `;

  const { rows } = await client.query(query, params);
  return rows[0] || null;
};

const isBookingExpired = (booking) => {
  if (!booking?.expires_at) {
    return false;
  }

  return new Date(booking.expires_at).getTime() < Date.now();
};

const markBookingExpired = async (client, booking) => {
  await client.query(
    `
      UPDATE bookings
      SET status = 'expired'
      WHERE id = $1
    `,
    [booking.id],
  );

  await client.query(
    `
      UPDATE event_seats
      SET seat_status = 'available'
      WHERE id = $1
        AND seat_status = 'reserved'
    `,
    [booking.event_seat_id],
  );
};

const normalizeStripeCurrency = (currencyInput) => {
  const normalized = String(currencyInput || "usd").trim().toLowerCase();

  if (normalized === "$") {
    return "usd";
  }

  if (normalized === "inr" || normalized === "pkr" || normalized === "usd") {
    return normalized;
  }

  return "usd";
};

const ensurePositiveAmount = (amountInput) => {
  const amount = Number(amountInput);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ApiError(400, "Amount must be a positive integer in smallest currency unit");
  }
  return amount;
};

const createPaymentIntent = async (req, res) => {
  const bookingId = req.body?.booking_id || req.params?.booking_id;
  const userId = req.user?.id;
  const amount = ensurePositiveAmount(req.body?.amount);
  const stripeCurrency = normalizeStripeCurrency(req.body?.currency);

  if (!bookingId) {
    throw new ApiError(400, "booking_id is required");
  }

  if (!userId) {
    throw new ApiError(401, "Authorized user is required");
  }

  const stripe = getStripeClient();

  return withTransaction(async (client) => {
    const booking = await getBookingForUpdate(client, bookingId, userId);

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

//     if (isBookingExpired(booking) && booking.status === "pending") {
//       await markBookingExpired(client, booking);
//       throw new ApiError(409, "Booking has expired");
//     }
// a
//     if (booking.status !== "pending") {
//       throw new ApiError(409, `Booking is ${booking.status} and cannot be paid`);
//     }

//     if (booking.seat_status === "booked") {
//       throw new ApiError(409, "Seat is already booked");
//     }

    if (booking.seat_status !== "reserved") {
      await client.query(
        `
          UPDATE event_seats
          SET seat_status = 'reserved'
          WHERE id = $1
        `,
        [booking.event_seat_id],
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: stripeCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        booking_id: booking.id,
        user_id: userId,
        event_seat_id: booking.event_seat_id,
      },
    });

    const payment = await insertPaymentRecord(client, {
      bookingId: booking.id,
      amount,
      currency: stripeCurrency,
      statusType: "pending",
      provider: "stripe",
    });

    return {
      booking_id: booking.id,
      payment,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      payment_intent_status: paymentIntent.status,
    };
  });
};

const updateBookingOnPaymentResult = async ({ client, booking, isSuccess, amount, currency }) => {
  if (isBookingExpired(booking) && booking.status === "pending") {
    await markBookingExpired(client, booking);
  }

  if (isSuccess) {
    if (booking.status !== "confirmed") {
      await client.query(
        `
          UPDATE bookings
          SET status = 'confirmed', confirmed_at = NOW()
          WHERE id = $1
        `,
        [booking.id],
      );

      await client.query(
        `
          UPDATE event_seats
          SET seat_status = 'booked'
          WHERE id = $1
        `,
        [booking.event_seat_id],
      );
    }

    const payment = await insertPaymentRecord(client, {
      bookingId: booking.id,
      amount,
      currency,
      statusType: "success",
      provider: "stripe",
    });

    return {
      booking_id: booking.id,
      booking_status: "confirmed",
      seat_status: "booked",
      payment,
    };
  }

  if (booking.status === "pending") {
    await client.query(
      `
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = $1
      `,
      [booking.id],
    );

    await client.query(
      `
        UPDATE event_seats
        SET seat_status = 'available'
        WHERE id = $1
      `,
      [booking.event_seat_id],
    );
  }

  const payment = await insertPaymentRecord(client, {
    bookingId: booking.id,
    amount,
    currency,
    statusType: "failed",
    provider: "stripe",
  });

  return {
    booking_id: booking.id,
    booking_status: booking.status === "pending" ? "cancelled" : booking.status,
    seat_status: "available",
    payment,
  };
};

const finalizePaymentIntent = async (paymentIntent, userId = null) => {
  const bookingId = paymentIntent?.metadata?.booking_id;
  if (!bookingId) {
    return { ignored: true, reason: "payment_intent_without_booking_metadata" };
  }

  const isSuccess = paymentIntent.status === "succeeded";
  const amount = Number(paymentIntent.amount_received || paymentIntent.amount || 0);
  const currency = paymentIntent.currency || "usd";

  return withTransaction(async (client) => {
    const booking = await getBookingForUpdate(client, bookingId, userId);

    if (!booking) {
      if (userId) {
        throw new ApiError(404, "Booking not found for user");
      }
      return { ignored: true, reason: "booking_not_found" };
    }

    return updateBookingOnPaymentResult({
      client,
      booking,
      isSuccess,
      amount,
      currency,
    });
  });
};

const confirmPayment = async (req, res) => {
  const paymentIntentId = req.body?.payment_intent_id;
  const userId = req.user?.id;

  if (!paymentIntentId) {
    throw new ApiError(400, "payment_intent_id is required");
  }

  if (!userId) {
    throw new ApiError(401, "Authorized user is required");
  }

  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return finalizePaymentIntent(paymentIntent, userId);
};

const cancelPendingBookingPayment = async (req, res) => {
  const bookingId = req.body?.booking_id || req.params?.booking_id;
  const userId = req.user?.id;

  if (!bookingId) {
    throw new ApiError(400, "booking_id is required");
  }

  if (!userId) {
    throw new ApiError(401, "Authorized user is required");
  }

  return withTransaction(async (client) => {
    const booking = await getBookingForUpdate(client, bookingId, userId);

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (booking.status !== "pending") {
      throw new ApiError(409, `Booking is ${booking.status} and cannot be cancelled`);
    }

    await client.query(
      `
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = $1
      `,
      [booking.id],
    );

    await client.query(
      `
        UPDATE event_seats
        SET seat_status = 'available'
        WHERE id = $1
      `,
      [booking.event_seat_id],
    );

    const payment = await insertPaymentRecord(client, {
      bookingId: booking.id,
      amount: 0,
      currency: "usd",
      statusType: "failed",
      provider: "stripe",
    });

    return {
      booking_id: booking.id,
      booking_status: "cancelled",
      seat_status: "available",
      payment,
    };
  });
};

const handleStripeWebhook = async (req, res) => {
  const stripe = getStripeClient();
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event = req.body;

  if (signature && webhookSecret) {
    const payload = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));

    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  if (!event?.type) {
    throw new ApiError(400, "Invalid Stripe webhook payload");
  }

  if (event.type === "payment_intent.succeeded") {
    const result = await finalizePaymentIntent(event.data.object);
    return { received: true, type: event.type, result };
  }

  if (event.type === "payment_intent.payment_failed" || event.type === "payment_intent.canceled") {
    const result = await finalizePaymentIntent(event.data.object);
    return { received: true, type: event.type, result };
  }

  return { received: true, type: event.type, ignored: true };
};

export default {
  createPaymentIntent,
  confirmPayment,
  cancelPendingBookingPayment,
  handleStripeWebhook,
};
