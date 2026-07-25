import { LegalPage } from "@/components/legal/LegalPage";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updatedAt="22 July 2026">
      <p>
        This Privacy Policy explains what information MahaHub collects, how we use it, and the choices you have. By using MahaHub, you
        agree to the practices described here.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account information:</strong> name, email, password (hashed), role, profile details you choose to add (bio, skills, portfolio, experience, education).</li>
        <li><strong>Verification information:</strong> KYC documents (ID proof) submitted for withdrawal eligibility, reviewed by MahaHub admins only.</li>
        <li><strong>Payment information:</strong> processed directly by Razorpay; MahaHub stores payment records (amount, status, commission) but not your card/bank credentials.</li>
        <li><strong>Payout details:</strong> UPI ID or bank account details you save for withdrawals.</li>
        <li><strong>Content you create:</strong> gig listings, job postings, messages, attachments, reviews, and portfolio items.</li>
        <li><strong>Usage data:</strong> pages viewed, gigs/profiles visited, and access logs for private/NDA-gated projects (who viewed or accepted an NDA, and when).</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To operate the marketplace — matching freelancers with clients, processing payments, and enabling messaging.</li>
        <li>To verify identity before allowing withdrawals (KYC).</li>
        <li>To enforce access control on private and NDA-protected projects, including maintaining an audit log of who accessed what and when.</li>
        <li>To send notifications about applications, orders, payments, and messages.</li>
        <li>To detect fraud, resolve disputes, and enforce our Terms of Service.</li>
      </ul>

      <h2>3. Where Your Data Is Stored</h2>
      <p>
        Profile images, gig covers, and gig videos are stored via Cloudinary. Documents, resumes, pitch decks, and chat/project
        attachments are stored via Cloudflare R2. Confidential project attachments are only ever accessed through short-lived, signed
        links generated on request — they are not exposed as permanent public URLs.
      </p>

      <h2>4. Who Can See Your Information</h2>
      <ul>
        <li>Your public profile (name, headline, skills, portfolio, ratings) is visible to anyone browsing the Platform, unless you're on a private/invite-only project.</li>
        <li>KYC documents are visible only to MahaHub admins reviewing your verification.</li>
        <li>Private/NDA project details and attachments are visible only to the client, the freelancers they've invited, and admins.</li>
        <li>We do not sell your personal information to third parties.</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>
        We retain account and transaction data for as long as your account is active and as needed to comply with legal, tax, and dispute
        resolution obligations. Attachments on private/NDA projects become inaccessible through the Platform 7 days after posting, as a
        confidentiality measure.
      </p>

      <h2>6. Your Choices</h2>
      <ul>
        <li>You can edit or remove most profile information from your account settings at any time.</li>
        <li>You can request account deletion by contacting support; some records (e.g. completed payment history) may be retained as required by law.</li>
      </ul>

      <h2>7. Security</h2>
      <p>
        We use industry-standard measures including encrypted transport (HTTPS/TLS) and access-controlled storage. No system is 100%
        secure, and we encourage you to use a strong, unique password.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>We may update this Privacy Policy periodically. We'll update the "Last updated" date above when we do.</p>

      <h2>9. Contact</h2>
      <p>For privacy questions or data requests, contact the support contact listed on the Platform.</p>
    </LegalPage>
  );
}
