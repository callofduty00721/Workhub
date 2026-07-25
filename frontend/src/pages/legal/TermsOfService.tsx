import { LegalPage } from "@/components/legal/LegalPage";

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" updatedAt="22 July 2026">
      <p>
        These Terms of Service ("Terms") govern your access to and use of MahaHub (the "Platform"), operated by MahaHub. By creating an
        account or using the Platform, you agree to these Terms. If you do not agree, do not use the Platform.
      </p>

      <h2>1. Who Can Use MahaHub</h2>
      <p>
        You must be at least 18 years old and capable of entering into a binding contract to use MahaHub. By registering, you confirm the
        information you provide is accurate and that you'll keep it up to date.
      </p>

      <h2>2. Account Roles</h2>
      <p>
        MahaHub supports multiple account types — Freelancer, Client, Employer, Founder, Investor, Mentor, and Partner. Each role has
        access to features relevant to it. You are responsible for all activity under your account and for keeping your credentials
        secure.
      </p>

      <h2>3. Gigs, Projects, and Jobs</h2>
      <ul>
        <li>Freelancers may list Gigs (fixed-scope services) with optional package tiers, or bid on Projects and Jobs posted by Clients/Employers.</li>
        <li>Clients and Employers are responsible for the accuracy of job/project postings and for paying for work they've agreed to.</li>
        <li>Private/invite-only projects and NDA-gated postings are visible only to invited freelancers, and accepting an NDA is a binding agreement to keep the project's details confidential.</li>
      </ul>

      <h2>4. Payments, Escrow, and Platform Commission</h2>
      <ul>
        <li>Payments are processed through Razorpay. MahaHub does not store your card or bank details.</li>
        <li>Funds paid for a Gig order or Job hire are held in escrow until the client approves and releases the work, or a milestone/hourly
          payment is accepted.
        </li>
        <li>MahaHub deducts a platform commission (a percentage of the gross amount, set by MahaHub and shown to freelancers on each payment)
          before crediting a freelancer's wallet. Clients pay the price they agreed to; the commission does not add to what the client pays.
        </li>
        <li>Withdrawals require identity verification (KYC) and are subject to processing time.</li>
      </ul>

      <h2>5. Revisions, Disputes, and Refunds</h2>
      <p>
        Each package/order includes a defined number of revisions. If a client and freelancer cannot agree on delivered work, either party
        may raise a dispute, which MahaHub's admin team will review. See our{" "}
        <a href="/refund" className="text-primary hover:underline">
          Refund Policy
        </a>{" "}
        for details on how disputed payments are resolved.
      </p>

      <h2>6. Confidential Projects and Content</h2>
      <p>
        Attachments on private or NDA-gated projects are access-controlled and time-limited. You agree not to attempt to bypass these
        controls, redistribute confidential files, or share access credentials/links with anyone not authorized on the project.
      </p>

      <h2>7. Prohibited Conduct</h2>
      <ul>
        <li>Circumventing the Platform to pay or be paid outside MahaHub for work initiated on MahaHub.</li>
        <li>Posting fraudulent, infringing, or misleading listings, reviews, or portfolio items.</li>
        <li>Harassment, discrimination, or abusive behavior toward other users.</li>
        <li>Uploading malware, or content that violates applicable law or third-party rights.</li>
      </ul>

      <h2>8. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these Terms, engage in fraud, or pose a risk to other users. You may close your
        account at any time; obligations for work already in progress or funds already held in escrow survive account closure.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        MahaHub is a marketplace connecting independent parties. We are not a party to the contracts formed between freelancers and
        clients/employers, and we do not guarantee the quality, legality, or outcome of any work. To the extent permitted by law, MahaHub's
        liability is limited to the platform commission earned on the transaction in question.
      </p>

      <h2>10. Changes to These Terms</h2>
      <p>We may update these Terms from time to time. Continued use of the Platform after changes take effect constitutes acceptance.</p>

      <h2>11. Contact</h2>
      <p>Questions about these Terms can be sent to the support contact listed on the Platform.</p>
    </LegalPage>
  );
}
