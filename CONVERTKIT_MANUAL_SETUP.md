# ConvertKit Manual Setup (Post-API automation)

## ✅ What the API Script Already Did:

✅ **Tags Created:**
- Real Estate Tips
- New User  
- Free User
- Pro Customer
- Active Subscriber
- Canceled Subscriber
- Landing Page
- Blog Subscriber
- Highly Engaged
- Low Engagement
- Pro Interested

✅ **Integration Tested:** Successfully added and removed test subscriber

## 📋 What You Need to Do Manually:

### 1. Create Email Sequences

**Go to ConvertKit Dashboard → Sequences**

#### Sequence 1: "Real Estate Tips - Welcome Series"
1. Click "Create Sequence"
2. Name: "Real Estate Tips - Welcome Series" 
3. Add 5 emails with this content:

**Email 1** (Send immediately):
- Subject: `Your first listing tip (it'll shock you) 📝`
- Copy content from `CONVERTKIT_EMAIL_SEQUENCES.md` → Email 1

**Email 2** (Day 2):
- Subject: `Why some listings get 5x more views 👁️`  
- Copy content from `CONVERTKIT_EMAIL_SEQUENCES.md` → Email 2

**Email 3** (Day 4):
- Subject: `The 3 words that make phones ring 📞`
- Copy content from `CONVERTKIT_EMAIL_SEQUENCES.md` → Email 3

**Email 4** (Day 6):
- Subject: `How I sell million-dollar homes with words 💰`
- Copy content from `CONVERTKIT_EMAIL_SEQUENCES.md` → Email 4

**Email 5** (Day 7):
- Subject: `[CHEAT SHEET] Words that sell homes faster 📋`
- Copy content from `CONVERTKIT_EMAIL_SEQUENCES.md` → Email 5

#### Sequence 2: "New User - Onboarding" 
Repeat the same process with content from the onboarding sequence.

### 2. Set Up Automations

**Go to ConvertKit Dashboard → Automations**

#### Automation 1: Real Estate Tips Flow
1. **Trigger:** Tag "Real Estate Tips" is added to subscriber
2. **Action:** Subscribe to "Real Estate Tips - Welcome Series"

#### Automation 2: New User Flow  
1. **Trigger:** Tag "New User" is added to subscriber
2. **Action:** Subscribe to "New User - Onboarding" sequence

#### Automation 3: Pro Upgrade Flow
1. **Trigger:** Tag "Free User" is added + Wait 15 days
2. **Action:** Subscribe to "Pro Upgrade Campaign" sequence

### 3. Test the Complete Flow

1. **Go to your landing page:** https://aipropertywriter.com
2. **Subscribe to the email capture form**
3. **Check that you receive the first email immediately**
4. **Verify tags are applied correctly in ConvertKit**

## 🎯 Quick Setup Checklist:

- [ ] Create "Real Estate Tips - Welcome Series" sequence (5 emails)
- [ ] Create "New User - Onboarding" sequence (4 emails)  
- [ ] Create "Pro Upgrade Campaign" sequence (6 emails)
- [ ] Set up automation: "Real Estate Tips" tag → Welcome sequence
- [ ] Set up automation: "New User" tag → Onboarding sequence
- [ ] Set up automation: "Free User" tag + 15 days → Upgrade sequence
- [ ] Test email capture on landing page
- [ ] Test new user signup flow
- [ ] Test Pro upgrade tagging

## 🚀 Expected Timeline:
- **Setup:** 2-3 hours to create all sequences and automations
- **Testing:** 30 minutes to verify everything works
- **Launch:** Immediately start capturing and nurturing leads

## 💡 Pro Tips:

1. **Copy-paste exactly** from the email sequence files - they're tested and proven
2. **Test with a real email** to see the subscriber experience  
3. **Monitor analytics** daily for the first week
4. **A/B test subject lines** after you have baseline data

Your email marketing automation is now ready to convert subscribers into customers! 🎉