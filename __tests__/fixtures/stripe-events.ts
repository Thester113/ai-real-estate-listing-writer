/**
 * Stripe webhook event fixtures for testing
 */

import type Stripe from 'stripe'

/**
 * Create a base Stripe event structure
 */
function createBaseEvent(type: string, data: Record<string, unknown>): Stripe.Event {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    data: {
      object: data as unknown as Stripe.Event.Data['object'],
      previous_attributes: {},
    },
    api_version: '2023-10-16',
    object: 'event',
    pending_webhooks: 0,
    request: { id: 'req_test', idempotency_key: null },
  } as Stripe.Event
}

export const stripeEvents = {
  // Checkout events
  checkoutCompleted: createBaseEvent('checkout.session.completed', {
    id: 'cs_test_xxx',
    customer: 'cus_test_xxx',
    subscription: 'sub_test_xxx',
    metadata: { userId: 'user-123' },
    mode: 'subscription',
    payment_status: 'paid',
    status: 'complete',
  }),

  checkoutCompletedWithEmail: createBaseEvent('checkout.session.completed', {
    id: 'cs_test_email_xxx',
    customer: 'cus_test_new_xxx',
    customer_email: 'new@test.com',
    subscription: 'sub_test_new_xxx',
    metadata: {},
    mode: 'subscription',
    payment_status: 'paid',
    status: 'complete',
  }),

  checkoutExpired: createBaseEvent('checkout.session.expired', {
    id: 'cs_test_expired_xxx',
    customer: 'cus_test_xxx',
    status: 'expired',
  }),

  // Subscription events
  subscriptionCreated: createBaseEvent('customer.subscription.created', {
    id: 'sub_test_xxx',
    customer: 'cus_test_xxx',
    status: 'active',
    current_period_start: Math.floor(Date.now() / 1000),
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    items: {
      data: [
        {
          price: {
            id: 'price_test_xxx',
            lookup_key: 'pro_monthly',
          },
        },
      ],
    },
  }),

  subscriptionUpdated: createBaseEvent('customer.subscription.updated', {
    id: 'sub_test_xxx',
    customer: 'cus_test_xxx',
    status: 'active',
    items: {
      data: [
        {
          price: {
            id: 'price_test_xxx',
            lookup_key: 'pro_monthly',
          },
        },
      ],
    },
  }),

  subscriptionPastDue: createBaseEvent('customer.subscription.updated', {
    id: 'sub_test_xxx',
    customer: 'cus_test_xxx',
    status: 'past_due',
    items: {
      data: [
        {
          price: {
            id: 'price_test_xxx',
            lookup_key: 'pro_monthly',
          },
        },
      ],
    },
  }),

  subscriptionCanceled: createBaseEvent('customer.subscription.deleted', {
    id: 'sub_test_xxx',
    customer: 'cus_test_xxx',
    status: 'canceled',
  }),

  // Invoice events
  invoicePaymentSucceeded: createBaseEvent('invoice.payment_succeeded', {
    id: 'in_test_xxx',
    customer: 'cus_test_xxx',
    subscription: 'sub_test_xxx',
    amount_paid: 2900,
    status: 'paid',
  }),

  invoicePaymentFailed: createBaseEvent('invoice.payment_failed', {
    id: 'in_test_xxx',
    customer: 'cus_test_xxx',
    subscription: 'sub_test_xxx',
    amount_due: 2900,
    status: 'open',
  }),

  // Customer events
  customerCreated: createBaseEvent('customer.created', {
    id: 'cus_test_xxx',
    email: 'test@test.com',
  }),

  customerDeleted: createBaseEvent('customer.deleted', {
    id: 'cus_test_xxx',
  }),
}

/**
 * Create a custom checkout completed event
 */
export function createCheckoutCompletedEvent(
  customerId: string,
  subscriptionId: string,
  userId?: string
): Stripe.Event {
  return createBaseEvent('checkout.session.completed', {
    id: `cs_test_${Date.now()}`,
    customer: customerId,
    subscription: subscriptionId,
    metadata: userId ? { userId } : {},
    mode: 'subscription',
    payment_status: 'paid',
    status: 'complete',
  })
}

/**
 * Create a custom subscription updated event
 */
export function createSubscriptionUpdatedEvent(
  subscriptionId: string,
  customerId: string,
  status: string
): Stripe.Event {
  return createBaseEvent('customer.subscription.updated', {
    id: subscriptionId,
    customer: customerId,
    status,
    items: {
      data: [
        {
          price: {
            id: 'price_test_xxx',
            lookup_key: 'pro_monthly',
          },
        },
      ],
    },
  })
}

/**
 * Create a custom subscription deleted event
 */
export function createSubscriptionDeletedEvent(
  subscriptionId: string,
  customerId: string
): Stripe.Event {
  return createBaseEvent('customer.subscription.deleted', {
    id: subscriptionId,
    customer: customerId,
    status: 'canceled',
  })
}

/**
 * Webhook event already processed (for idempotency testing)
 */
export const processedWebhookEvent = {
  event_id: stripeEvents.checkoutCompleted.id,
  event_type: stripeEvents.checkoutCompleted.type,
  processed_at: '2025-01-15T12:00:00Z',
}
