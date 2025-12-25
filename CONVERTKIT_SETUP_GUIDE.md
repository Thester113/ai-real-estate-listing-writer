# ConvertKit Complete Setup Guide

## 🎯 Step-by-Step ConvertKit Configuration

Follow this guide to set up your complete email marketing automation system.

---

## 📋 STEP 1: Create Tags

Login to your ConvertKit dashboard and create these tags:

### Primary Tags:
- **Real Estate Tips** (Landing page subscribers)
- **New User** (App signups)
- **Free User** (Active free users)  
- **Pro Customer** (Paid subscribers)
- **Active Subscriber** (Current paying customers)
- **Canceled Subscriber** (Former customers)

### Source Tags:
- **Landing Page** (Organic lead magnets)
- **Blog Subscriber** (Content marketing)
- **Referral** (Word of mouth)
- **Social Media** (Instagram/Facebook)
- **Partner** (Strategic partnerships)

### Engagement Tags:
- **Highly Engaged** (High email engagement)
- **Low Engagement** (Need re-engagement)
- **Trial User** (Free trial active)
- **Power User** (Heavy platform usage)

---

## 📧 STEP 2: Create Email Sequences

### Sequence 1: Real Estate Tips Welcome Series
**Name:** "Real Estate Tips - Welcome Series"
**Trigger:** Tag "Real Estate Tips" added

**Emails to Create:**
1. **Welcome + Instant Value** (Send immediately)
2. **Psychology Behind Winning Listings** (Day 2)  
3. **The Urgency Formula** (Day 4)
4. **Luxury Listing Secrets** (Day 6)
5. **Complete Cheat Sheet** (Day 7)

### Sequence 2: New User Onboarding  
**Name:** "New User - Onboarding"
**Trigger:** Tag "New User" added

**Emails to Create:**
1. **Welcome + Quick Start** (Send immediately)
2. **Pro Features Preview** (Day 3)
3. **Success Stories** (Day 7)  
4. **Tips & Best Practices** (Day 10)

### Sequence 3: Pro Upgrade Campaign
**Name:** "Free to Pro - Upgrade Campaign"  
**Trigger:** Tag "Free User" added + Wait 15 days

**Emails to Create:**
1. **Time Audit** (Day 15)
2. **ROI Calculator** (Day 18)
3. **Feature Deep Dive** (Day 21)
4. **Social Proof** (Day 25)
5. **Objection Handler** (Day 30)
6. **Final Offer** (Day 35)

---

## 🎯 STEP 3: Create Forms

### Form 1: Landing Page Lead Magnet
**Name:** "Real Estate Tips - Landing Page"
**Style:** Inline form
**CTA:** "Send Me Tips"
**Thank You Message:** "Check your email! Your guide is on the way."

**Form Settings:**
- Add tag: "Real Estate Tips"
- Add tag: "Landing Page"
- Redirect to: Thank you page
- Double opt-in: Enabled

### Form 2: App Signup Integration
**Name:** "New User - App Signup"
**Type:** API integration (handled by our code)

**Automation:**
- Add tag: "New User"
- Add tag: "Free User"
- Remove tag: "Trial User" (if exists)

### Form 3: Blog Sidebar
**Name:** "Blog - Weekly Tips"
**Style:** Sticky bar or popup
**Trigger:** Time on page >30 seconds

---

## 🤖 STEP 4: Set Up Automations

### Automation 1: Lead Magnet Flow
**Name:** "Lead Magnet → Welcome Series"

**Trigger:** Form submitted (Lead magnet forms)
**Actions:**
1. Send immediate email with download link
2. Add tag "Real Estate Tips"  
3. Wait 7 days
4. Add tag "Potential Customer"

### Automation 2: User Lifecycle Management
**Name:** "User Lifecycle - Free to Pro"

**Rules:**
- If tagged "New User" → Start onboarding sequence
- If tagged "Pro Customer" → Remove all upgrade sequences  
- If tagged "Canceled Subscriber" → Start win-back sequence

### Automation 3: Engagement Scoring
**Name:** "Engagement Tracking"

**Triggers:**
- High email engagement (3+ opens in 7 days) → Add "Highly Engaged"
- Low engagement (0 opens in 14 days) → Add "Low Engagement"
- Multiple clicks on Pro features → Add "Pro Interested"

---

## 📊 STEP 5: Create Segments

### Segment 1: Ready to Upgrade
**Criteria:**
- Has tag "Free User"
- Has tag "Highly Engaged"  
- Signed up >14 days ago
- No tag "Pro Customer"

**Use:** Target with Pro upgrade campaigns

### Segment 2: At-Risk Users
**Criteria:**
- Has tag "Free User"
- Has tag "Low Engagement"
- Signed up >30 days ago
- Last activity >14 days ago

**Use:** Re-engagement campaigns

### Segment 3: Power Users
**Criteria:**
- Has tag "Pro Customer"
- Has tag "Highly Engaged"
- Customer >90 days

**Use:** Case studies, testimonials, referral requests

---

## 🎨 STEP 6: Create Broadcast Templates

### Template 1: Weekly Newsletter
**Subject Line Formula:** "[TIP] {Specific Benefit} in {Timeframe}"
**Example:** "[TIP] Write luxury listings that sell in 48 hours"

**Structure:**
1. Personal greeting
2. One actionable tip
3. Real example/case study
4. Soft CTA to PropertyWriter
5. P.S. with additional value

### Template 2: Feature Announcement
**Structure:**
1. What's new
2. Why it matters  
3. How to use it
4. User feedback/results
5. Try it now CTA

### Template 3: Success Story
**Structure:**
1. Meet the agent
2. Their challenge
3. How PropertyWriter helped
4. Specific results
5. Your turn CTA

---

## ⚙️ STEP 7: Integration Settings

### Webhook Configuration
**Endpoint:** https://aipropertywriter.com/api/convertkit/webhook
**Events to Track:**
- subscriber.subscriber_activate
- subscriber.subscriber_unsubscribe  
- subscriber.tag_add
- subscriber.tag_remove

### API Integration Testing
**Test Calls:**
1. Add subscriber via API
2. Add tags via API
3. Remove tags via API  
4. Unsubscribe via API

---

## 📈 STEP 8: Analytics Setup

### Key Metrics to Track:

**Email Performance:**
- Open rates by sequence
- Click rates by email
- Unsubscribe rates
- Conversion rates (free to pro)

**Subscriber Growth:**
- New subscribers by source
- List growth rate
- Segment distribution
- Churn rate

**Revenue Metrics:**
- Revenue per subscriber
- Customer lifetime value
- Attribution by email sequence
- ROI by campaign

### ConvertKit Reporting:
- Enable revenue tracking
- Set up custom fields for:
  - Plan type
  - Signup date
  - Last activity
  - Revenue value

---

## 🎯 STEP 9: Launch Checklist

### Pre-Launch (Week 1):
- [ ] All tags created
- [ ] All sequences written and scheduled
- [ ] All forms created and tested
- [ ] All automations configured
- [ ] Webhook integration tested

### Launch Week (Week 2):
- [ ] Enable forms on website
- [ ] Test complete user journey
- [ ] Monitor deliverability rates
- [ ] Check automation triggers
- [ ] Send first broadcast

### Post-Launch (Week 3):
- [ ] Review analytics
- [ ] A/B test subject lines
- [ ] Optimize low-performing emails
- [ ] Collect feedback
- [ ] Scale successful campaigns

---

## 🚀 Success Metrics (30 Days)

### Email List Growth:
- **Target:** 500+ new subscribers
- **Sources:** 70% landing page, 20% app signups, 10% other

### Engagement Rates:
- **Open Rate:** 35%+ (Real estate average: 25%)
- **Click Rate:** 8%+ (Industry average: 5%)  
- **Unsubscribe:** <2% (Acceptable: <5%)

### Conversion Metrics:
- **Email to Free Trial:** 15%+
- **Free Trial to Paid:** 10%+
- **Email to Paid (Direct):** 3%+

### Revenue Attribution:
- **Target:** 25% of new customers from email
- **Email Revenue:** $2,000+ MRR from email subscribers
- **ROI:** 10:1 (Revenue vs. ConvertKit costs)

---

## 💡 Pro Tips

### Email Best Practices:
1. **Send Consistently:** Same day/time each week
2. **Personalize:** Use first name and behavioral data
3. **Mobile Optimize:** 70% open emails on mobile
4. **Test Everything:** Subject lines, send times, CTAs

### Content Strategy:
1. **80/20 Rule:** 80% value, 20% promotion
2. **Story-Driven:** Use customer success stories
3. **Actionable:** Every email should have one clear takeaway
4. **Exclusive:** Offer email-only content and deals

### List Management:
1. **Clean Regularly:** Remove inactive subscribers quarterly
2. **Segment Heavily:** More targeted = better results
3. **Re-engagement:** Win back inactive subscribers before removing
4. **Sunset Policy:** Remove non-engaged after 6 months

This complete setup will create a professional email marketing system that nurtures leads and converts them into paying customers!