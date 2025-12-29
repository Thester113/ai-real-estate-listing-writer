import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
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
            <h1 className="text-xl font-bold">Terms of Service</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card border rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using AI Real Estate Listing Writer ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you disagree with any part of these terms, you may not access the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p className="mb-4">
              AI Real Estate Listing Writer is a web-based application that uses artificial intelligence to generate real estate listing descriptions. 
              The Service allows users to input property details and receive AI-generated marketing copy for real estate listings.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Use</h2>
            <p className="mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Generate content that is defamatory, obscene, or offensive</li>
              <li>Attempt to reverse engineer or hack the Service</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Subscription and Billing</h2>
            <p className="mb-4">
              The Service offers both free and paid subscription plans. By subscribing to a paid plan:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>You agree to pay all applicable fees</li>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are provided according to our refund policy</li>
              <li>We may change pricing with 30 days notice</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Content and Intellectual Property</h2>
            <p className="mb-4">
              You retain ownership of the property information you input. The AI-generated content is provided for your use, 
              but you are responsible for reviewing and verifying all generated content before use.
            </p>
            <p className="mb-4">
              The Service, including its software, design, and proprietary algorithms, is owned by us and protected by 
              intellectual property laws.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Privacy and Data</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
              use, and protect your information.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Disclaimers</h2>
            <p className="mb-4">
              The Service is provided "as is" without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>The accuracy or completeness of generated content</li>
              <li>Uninterrupted or error-free operation</li>
              <li>That the Service will meet your specific requirements</li>
              <li>That generated content will result in sales or leads</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages arising out of your use of the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account at any time for violation of these Terms. 
              Upon termination, your right to use the Service will cease immediately.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes. 
              Continued use of the Service constitutes acceptance of the modified Terms.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of California, 
              without regard to its conflict of law provisions.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p><strong>Email:</strong> support@aipropertywriter.com</p>
              <p><strong>Address:</strong> AI Real Estate Listing Writer, 123 Innovation Drive, San Francisco, CA 94105</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}