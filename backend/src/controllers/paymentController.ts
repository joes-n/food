import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../server';
import { PaymentStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (order.customerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized',
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order.id,
        customerId: userId,
      },
    });

    // Create or update payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        paymentMethod: 'card',
        paymentStatus: 'pending',
        paymentIntentId: paymentIntent.id,
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error: any) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent',
    });
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update payment status in database
    const payment = await prisma.payment.update({
      where: { paymentIntentId },
      data: {
        paymentStatus: paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
        transactionId: paymentIntent.id,
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null,
      },
      include: {
        order: true,
      },
    });

    // Update order payment status
    if (paymentIntent.status === 'succeeded') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'completed',
        },
      });
    }

    res.json({
      success: true,
      data: payment,
      message: paymentIntent.status === 'succeeded' ? 'Payment successful' : 'Payment failed',
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm payment',
    });
  }
};

export const processRefund = async (req: Request, res: Response) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Only admins can process refunds
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to process refunds',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || !order.payment) {
      return res.status(404).json({
        success: false,
        error: 'Order or payment not found',
      });
    }

    if (order.payment.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot refund unpaid order',
      });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.payment.paymentIntentId || undefined,
      reason: reason as Stripe.RefundCreateParams.Reason,
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        paymentStatus: 'refunded',
        refundedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: refund,
      message: 'Refund processed successfully',
    });
  } catch (error: any) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process refund',
    });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({
      success: false,
      error: 'Missing signature or webhook secret',
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      webhookSecret
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { paymentIntentId: paymentIntent.id },
    data: {
      paymentStatus: 'completed',
      paidAt: new Date(),
    },
  });

  const payment = await prisma.payment.findFirst({
    where: { paymentIntentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'completed',
      },
    });
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { paymentIntentId: paymentIntent.id },
    data: {
      paymentStatus: 'failed',
    },
  });

  const payment = await prisma.payment.findFirst({
    where: { paymentIntentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'failed',
      },
    });
  }
}
