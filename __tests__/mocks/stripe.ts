import { vi } from 'vitest'
import type Stripe from 'stripe'

/**
 * Create a mock Stripe client with configurable behavior
 */
export function createMockStripe(overrides: Record<string, unknown> = {}) {
  const stripe = {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test_xxx',
          url: 'https://checkout.stripe.com/test',
          customer: 'cus_test_xxx',
          subscription: 'sub_test_xxx',
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: 'cs_test_xxx',
          customer: 'cus_test_xxx',
          subscription: 'sub_test_xxx',
          status: 'complete',
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/test',
        }),
      },
    },
    customers: {
      create: vi.fn().mockResolvedValue({
        id: 'cus_test_xxx',
        email: 'test@test.com',
      }),
      retrieve: vi.fn().mockResolvedValue({
        id: 'cus_test_xxx',
        email: 'test@test.com',
      }),
      update: vi.fn().mockResolvedValue({
        id: 'cus_test_xxx',
        email: 'test@test.com',
      }),
    },
    subscriptions: {
      retrieve: vi.fn().mockResolvedValue({
        id: 'sub_test_xxx',
        status: 'active',
        customer: 'cus_test_xxx',
        items: {
          data: [{ price: { lookup_key: 'pro_monthly' } }],
        },
      }),
      update: vi.fn().mockResolvedValue({
        id: 'sub_test_xxx',
        status: 'active',
      }),
      cancel: vi.fn().mockResolvedValue({
        id: 'sub_test_xxx',
        status: 'canceled',
      }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    ...overrides,
  }

  return stripe
}

/**
 * Create a mock Stripe event
 */
export function createMockStripeEvent(
  type: string,
  data: Record<string, unknown>
): Stripe.Event {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    data: {
      object: data,
      previous_attributes: {},
    },
    api_version: '2023-10-16',
    object: 'event',
    pending_webhooks: 0,
    request: { id: 'req_test', idempotency_key: null },
  } as Stripe.Event
}

/**
 * Configure webhook to construct a valid event
 */
export function mockWebhookEvent(
  stripe: ReturnType<typeof createMockStripe>,
  event: Stripe.Event
) {
  stripe.webhooks.constructEvent.mockReturnValue(event)
}

/**
 * Configure webhook to throw signature error
 */
export function mockWebhookSignatureError(stripe: ReturnType<typeof createMockStripe>) {
  stripe.webhooks.constructEvent.mockImplementation(() => {
    throw new Error('Invalid signature')
  })
}

// Pre-built event fixtures
export const stripeEventFixtures = {
  checkoutCompleted: (customerId: string, subscriptionId: string, userId: string) =>
    createMockStripeEvent('checkout.session.completed', {
      id: 'cs_test_xxx',
      customer: customerId,
      subscription: subscriptionId,
      metadata: { userId },
      mode: 'subscription',
      payment_status: 'paid',
    }),

  subscriptionCreated: (subscriptionId: string, customerId: string) =>
    createMockStripeEvent('customer.subscription.created', {
      id: subscriptionId,
      customer: customerId,
      status: 'active',
      items: {
        data: [{ price: { lookup_key: 'pro_monthly' } }],
      },
    }),

  subscriptionUpdated: (subscriptionId: string, customerId: string, status: string) =>
    createMockStripeEvent('customer.subscription.updated', {
      id: subscriptionId,
      customer: customerId,
      status,
      items: {
        data: [{ price: { lookup_key: 'pro_monthly' } }],
      },
    }),

  subscriptionDeleted: (subscriptionId: string, customerId: string) =>
    createMockStripeEvent('customer.subscription.deleted', {
      id: subscriptionId,
      customer: customerId,
    }),

  paymentSucceeded: (customerId: string, amount: number) =>
    createMockStripeEvent('invoice.payment_succeeded', {
      customer: customerId,
      amount_paid: amount,
      status: 'paid',
    }),

  paymentFailed: (customerId: string) =>
    createMockStripeEvent('invoice.payment_failed', {
      customer: customerId,
      status: 'open',
    }),
}
