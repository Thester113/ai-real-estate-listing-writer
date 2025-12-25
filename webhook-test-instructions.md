# Webhook Testing Instructions

## Issue Summary
Your webhook gets 200 responses but users aren't being upgraded. The user shows:
- `subscription_status: "active"` ✅ (payment events work)
- `subscription_id: null` ❌ (subscription events don't work)

## Test Steps

### 1. Check Stripe Webhook Events
Go to Stripe Dashboard → Webhooks → Your webhook endpoint and check:
- What events are being sent? Look for recent events
- Are you seeing `customer.subscription.created` or `customer.subscription.updated` events?
- Or only `invoice.payment_succeeded` events?

### 2. Check Webhook Event Types
In Stripe webhook settings, ensure these events are enabled:
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Test Customer Lookup
The enhanced webhook is now deployed with detailed logging. When you:
1. Make a test payment or subscription change
2. Check Vercel function logs (Functions tab → webhook function → logs)
3. Look for these log messages:
   - `🔍 Looking for user with customer_id: cus_XXX`
   - `👤 User lookup result: ...`
   - `❌ User not found` or `✅ Found user by email`

### 4. Manual Database Check
Check your Supabase database:
```sql
SELECT customer_id, email, plan, subscription_status, subscription_id 
FROM profiles 
WHERE customer_id = 'cus_TfgMZPqNV5AsCW';
```

If this returns no results, the customer_id mismatch theory is correct.

### 5. Alternative Customer Check
```sql
SELECT customer_id, email, plan, subscription_status, subscription_id 
FROM profiles 
WHERE email = 'your-test-email@example.com';
```

## Expected Results
If the customer ID mismatch theory is correct:
- Direct customer_id lookup will fail
- Email lookup will succeed 
- Enhanced webhook will automatically fix the customer_id

## Next Steps Based on Results
1. **If no subscription events in Stripe**: Add missing webhook event types
2. **If customer_id mismatch**: Enhanced webhook will fix automatically  
3. **If other issue**: Check Vercel function logs for detailed debugging

The enhanced webhook with customer lookup fallback is now live and should resolve most issues automatically.