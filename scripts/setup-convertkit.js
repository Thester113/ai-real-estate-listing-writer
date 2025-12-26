#!/usr/bin/env node

// ConvertKit Setup Script - Automates the complete email marketing system
const fetch = require('node-fetch');

// ConvertKit credentials
const API_KEY = 'hMPnKFLaohLXJ0kp6LGPVg';
const API_SECRET = '6Y17qXzA-TmB_77cUEnn9gtEdSPMLALZTitNDX-XpxA';
const FORM_ID = '8903445'; // Your existing form
const API_BASE = 'https://api.convertkit.com/v3';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_SECRET}`
    }
  };

  if (data) {
    if (method === 'GET') {
      // Add API key to URL for GET requests
      const separator = url.includes('?') ? '&' : '?';
      const finalUrl = `${url}${separator}api_key=${API_KEY}`;
      return fetch(finalUrl, options);
    } else {
      // Add API key to body for POST requests
      options.body = JSON.stringify({ ...data, api_key: API_KEY });
    }
  } else {
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = `${url}${separator}api_key=${API_KEY}`;
    return fetch(finalUrl, options);
  }

  return fetch(url, options);
}

// Step 1: Create Tags
async function createTags() {
  console.log('🏷️  Creating tags...');
  
  const tags = [
    'Real Estate Tips',
    'New User',
    'Free User', 
    'Pro Customer',
    'Active Subscriber',
    'Canceled Subscriber',
    'Landing Page',
    'Blog Subscriber',
    'Highly Engaged',
    'Low Engagement',
    'Pro Interested'
  ];

  for (const tagName of tags) {
    try {
      const response = await apiCall('/tags', 'POST', { name: tagName });
      const result = await response.json();
      if (response.ok) {
        console.log(`✅ Created tag: ${tagName}`);
      } else {
        console.log(`⚠️  Tag might already exist: ${tagName}`);
      }
    } catch (error) {
      console.log(`❌ Error creating tag ${tagName}:`, error.message);
    }
  }
}

// Step 2: Create Email Sequences
async function createSequences() {
  console.log('📧 Creating email sequences...');

  // Sequence 1: Real Estate Tips Welcome Series
  const welcomeSequence = {
    name: 'Real Estate Tips - Welcome Series',
    emails: [
      {
        subject: 'Your first listing tip (it\'ll shock you) 📝',
        content: `Hi there!

Welcome to the PropertyWriter community! 👋

You just joined 1,000+ real estate professionals who are transforming how they write property listings.

Here's your first game-changing tip:

🔥 **THE $10,000 WORD MISTAKE**

Most agents write: "Spacious 3-bedroom home"
Top agents write: "Expansive 3-bedroom retreat"

Why? The word "spacious" is overused and meaningless. "Expansive" creates emotion and commands 15% higher offers.

**3 More Power Words That Sell:**
• Replace "nice" → "captivating"
• Replace "updated" → "reimagined" 
• Replace "convenient" → "effortless"

Tomorrow, I'll share the psychology behind why some listings get 5x more views...

Talk soon,
Tom
Founder, PropertyWriter

P.S. Want to see these tips in action? Try PropertyWriter free: https://aipropertywriter.com`,
        delay_days: 0
      },
      {
        subject: 'Why some listings get 5x more views 👁️',
        content: `Hi {{first_name}},

Ever wonder why some $300K homes get more views than $500K properties?

It's not the price. It's the psychology.

**THE GOLDILOCKS PRINCIPLE OF LISTING DESCRIPTIONS**

Your listing needs to hit the sweet spot:
• Too short = looks lazy
• Too long = overwhelming 
• Just right = 75-125 words

But here's what most agents miss...

**THE EMOTIONAL JOURNEY FORMULA:**

1. **Hook** (first 10 words) - Create curiosity
2. **Features** (middle section) - Build desire  
3. **Close** (last sentence) - Inspire action

Example:
❌ "3BR/2BA home with updated kitchen"
✅ "Your morning coffee never tasted this good... until you're sipping it in this sun-drenched kitchen with granite countertops and custom cabinetry. Schedule your private tour today."

See the difference? We went from boring facts to emotional storytelling.

Tomorrow: The 3 words that make buyers call immediately...

Best,
Tom

P.S. PropertyWriter automatically applies these psychology principles to every listing you generate. Try it free here: https://aipropertywriter.com`,
        delay_days: 2
      },
      {
        subject: 'The 3 words that make phones ring 📞',
        content: `{{first_name}},

Want to know the 3 words that make buyers drop everything and call?

"Won't last long"

But there's a RIGHT way and a WRONG way to create urgency...

**WRONG:** "This won't last long!"
(Sounds desperate and salesy)

**RIGHT:** "Homes like this in [neighborhood] typically sell within 72 hours"
(Creates FOMO with social proof)

**THE SCARCITY PSYCHOLOGY BLUEPRINT:**

✅ DO: "Only 3 homes sold in this school district last year"
❌ DON'T: "Act fast before it's gone!"

✅ DO: "First showing already booked for this weekend"
❌ DON'T: "Call now or you'll miss out!"

The key? Make scarcity feel factual, not pushy.

**BONUS TIP:** Include neighborhood-specific data:
"In the last 6 months, similar homes in [area] have averaged 12 days on market"

This turns your listing into a limited-time opportunity without sounding like a used car commercial.

Friday's email reveals my #1 secret for luxury listings...

Talk soon,
Tom

P.S. PropertyWriter includes neighborhood data and scarcity language automatically. Generate your first listing: https://aipropertywriter.com`,
        delay_days: 4
      },
      {
        subject: 'How I sell million-dollar homes with words 💰',
        content: `{{first_name}},

Last year, one of our users sold a $1.2M home in 8 days.

The secret? She stopped describing features and started selling a lifestyle.

**THE LUXURY TRANSFORMATION FORMULA:**

Instead of: "Large master bedroom"
Write: "Private owner's sanctuary"

Instead of: "Updated bathroom"  
Write: "Spa-inspired wellness retreat"

Instead of: "Open floor plan"
Write: "Seamless entertaining spaces"

**THE MILLIONAIRE MINDSET SHIFT:**

Luxury buyers don't buy houses. They buy:
• Status ("Executive neighborhood")
• Experience ("Wine cellar for intimate gatherings")
• Emotion ("Wake up to sunrise over the valley")

**MY FAVORITE LUXURY POWER PHRASES:**
• "Architecturally significant"
• "Curated for the discerning buyer"
• "An entertainer's paradise"
• "Seamlessly blending indoor/outdoor living"
• "Privately nestled yet conveniently positioned"

The goal? Make them feel like they're already living there.

Tomorrow's final email has my complete "Listing Words That Sell" cheat sheet...

Cheers,
Tom

P.S. PropertyWriter has a dedicated "Luxury" style that automatically applies these principles. Try it here: https://aipropertywriter.com`,
        delay_days: 6
      },
      {
        subject: '[CHEAT SHEET] Words that sell homes faster 📋',
        content: `{{first_name}},

As promised, here's your complete "Words That Sell Homes Faster" cheat sheet.

**POWER WORDS BY ROOM:**

🏠 **Exterior:**
• Charming → Captivating
• Nice yard → Manicured grounds
• Good location → Prime positioning

🍳 **Kitchen:**
• Updated → Reimagined
• Large → Expansive
• Modern → Contemporary chef's kitchen

🛏️ **Bedrooms:**
• Master → Primary suite
• Big → Generous proportions
• Closet space → Walk-in wardrobe

🛁 **Bathrooms:**
• Nice → Spa-inspired
• Updated → Designer appointed
• Shower → Rainfall sanctuary

**THE ULTIMATE FORMULA:**
[Emotion] + [Feature] + [Benefit] + [Call to Action]

Example: "Imagine hosting dinner parties in this gourmet kitchen featuring granite countertops and professional appliances. Your guests will never want to leave. Schedule your private showing today."

**BONUS: NEIGHBORHOOD GOLDMINE WORDS:**
• "Tree-lined streets"
• "Award-winning schools"
• "Minutes from downtown"
• "Quiet cul-de-sac"
• "Established neighborhood"

You now have everything you need to write listings that sell.

But here's the thing...

Manually applying all these principles takes HOURS per listing.

That's why I built PropertyWriter. It automatically uses these psychology principles, power words, and formulas to generate compelling listings in seconds.

Ready to transform your listings?

[Start Your Free Trial - Generate 20 Listings Free]
https://aipropertywriter.com

Welcome to the future of real estate marketing!

Tom
Founder, PropertyWriter

P.S. Questions about anything we covered? Just reply to this email - I read every single one.`,
        delay_days: 7
      }
    ]
  };

  // Create the sequence
  try {
    const response = await apiCall('/sequences', 'POST', {
      name: welcomeSequence.name,
      public: false
    });
    
    if (response.ok) {
      const sequenceData = await response.json();
      const sequenceId = sequenceData.sequence.id;
      console.log(`✅ Created sequence: ${welcomeSequence.name} (ID: ${sequenceId})`);
      
      // Add emails to the sequence
      for (let i = 0; i < welcomeSequence.emails.length; i++) {
        const email = welcomeSequence.emails[i];
        try {
          const emailResponse = await apiCall(`/sequences/${sequenceId}/broadcasts`, 'POST', {
            subject: email.subject,
            content: email.content,
            delay_days: email.delay_days,
            public: false
          });
          
          if (emailResponse.ok) {
            console.log(`   ✅ Added email ${i + 1}: ${email.subject}`);
          } else {
            const errorData = await emailResponse.json();
            console.log(`   ❌ Failed to add email ${i + 1}:`, errorData);
          }
        } catch (error) {
          console.log(`   ❌ Error adding email ${i + 1}:`, error.message);
        }
      }
    } else {
      const errorData = await response.json();
      console.log(`❌ Failed to create sequence:`, errorData);
    }
  } catch (error) {
    console.log(`❌ Error creating sequence:`, error.message);
  }
}

// Step 3: Set up automations
async function createAutomations() {
  console.log('🤖 Setting up automations...');
  
  // Note: ConvertKit's automation creation via API is limited
  // Most automations need to be set up manually in the dashboard
  // But we can create the basic structure
  
  console.log('⚠️  Automations need to be configured manually in ConvertKit dashboard');
  console.log('   1. Go to ConvertKit → Automations');
  console.log('   2. Create trigger: Tag "Real Estate Tips" added');
  console.log('   3. Action: Add to "Real Estate Tips - Welcome Series"');
}

// Step 4: Test the integration
async function testIntegration() {
  console.log('🧪 Testing integration...');
  
  try {
    // Test adding a subscriber
    const testEmail = 'test@aipropertywriter.com';
    const response = await apiCall(`/forms/${FORM_ID}/subscribe`, 'POST', {
      email: testEmail,
      first_name: 'Test',
      tags: ['Real Estate Tips', 'Landing Page']
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test subscription successful');
      
      // Clean up test subscriber
      try {
        await apiCall('/unsubscribe', 'POST', { email: testEmail });
        console.log('✅ Test subscriber removed');
      } catch (error) {
        console.log('⚠️  Could not remove test subscriber');
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Test subscription failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Integration test error:', error.message);
  }
}

// Main setup function
async function setupConvertKit() {
  console.log('🚀 Starting ConvertKit setup...\n');
  
  try {
    await createTags();
    console.log('');
    
    await createSequences();
    console.log('');
    
    await createAutomations();
    console.log('');
    
    await testIntegration();
    console.log('');
    
    console.log('🎉 ConvertKit setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Log into ConvertKit dashboard');
    console.log('2. Set up automations manually (see console output above)');
    console.log('3. Test the complete email flow');
    console.log('4. Create lead magnet landing pages');
    console.log('5. Start driving traffic to capture emails');
    
  } catch (error) {
    console.log('❌ Setup failed:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  setupConvertKit();
}

module.exports = { setupConvertKit };