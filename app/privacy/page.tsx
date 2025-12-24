import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-bold">Privacy Policy</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card border rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p className="mb-4">
              AI Real Estate Listing Writer ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
            <p className="mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Name and email address when you create an account</li>
              <li>Payment information for subscription services</li>
              <li>Property details you input for listing generation</li>
              <li>Communications with our support team</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <p className="mb-4">When you use our Service, we automatically collect:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage patterns and preferences</li>
              <li>Log data including access times and pages viewed</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Cookies and Tracking Technologies</h3>
            <p className="mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage, 
              and provide personalized content.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information to:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Provide and maintain our Service</li>
              <li>Generate AI-powered listing descriptions</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service-related communications</li>
              <li>Improve our Service and develop new features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="mb-4">We do not sell your personal information. We may share information in the following circumstances:</p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Service Providers</h3>
            <p className="mb-4">
              We work with trusted third-party providers to operate our Service, including:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Cloud hosting providers (Vercel)</li>
              <li>Database providers (Supabase)</li>
              <li>Payment processors (Stripe)</li>
              <li>AI service providers (OpenAI)</li>
              <li>Analytics providers (PostHog)</li>
              <li>Email service providers (ConvertKit)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Legal Requirements</h3>
            <p className="mb-4">
              We may disclose information if required by law or in response to valid requests by public authorities.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Business Transfers</h3>
            <p className="mb-4">
              In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Secure coding practices</li>
            </ul>
            <p className="mb-4">
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to provide the Service and fulfill legal obligations. 
              Specific retention periods include:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Account information: Until account deletion</li>
              <li>Generated listings: 2 years after creation</li>
              <li>Usage data: 1 year for analytics purposes</li>
              <li>Payment records: As required by law</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights and Choices</h2>
            <p className="mb-4">You have the following rights regarding your personal information:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Access and review your information</li>
              <li>Update or correct inaccurate data</li>
              <li>Delete your account and associated data</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of promotional communications</li>
              <li>Withdraw consent where applicable</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us using the information provided below.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. 
              We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Children's Privacy</h2>
            <p className="mb-4">
              Our Service is not intended for children under 13 years of age. We do not knowingly collect personal 
              information from children under 13.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Third-Party Links</h2>
            <p className="mb-4">
              Our Service may contain links to third-party websites. We are not responsible for the privacy practices 
              of these external sites.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p><strong>Email:</strong> privacy@airealestatelistings.com</p>
              <p><strong>Address:</strong> AI Real Estate Listing Writer, 123 Innovation Drive, San Francisco, CA 94105</p>
              <p><strong>Data Protection Officer:</strong> dpo@airealestatelistings.com</p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">13. State-Specific Rights</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">California Residents (CCPA)</h3>
            <p className="mb-4">
              California residents have additional rights under the California Consumer Privacy Act, including:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">European Residents (GDPR)</h3>
            <p className="mb-4">
              If you are located in the European Economic Area, you have additional rights under the General Data Protection Regulation.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}