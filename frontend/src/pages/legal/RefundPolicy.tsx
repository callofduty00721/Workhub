import { LegalPage } from "@/components/legal/LegalPage";

export default function RefundPolicy() {
  return (
    <LegalPage title="Refund Policy" updatedAt="22 July 2026">
      <p>
        This policy explains when and how refunds are issued for payments made through MahaHub. It applies to Gig orders, Job/Project
        hires, milestone payments, and hourly payments.
      </p>

      <h2>1. Escrow Protection</h2>
      <p>
        Payments (other than contest prizes) are held in escrow and are not released to the freelancer until you approve the delivered
        work, or a milestone/hourly batch is accepted. This means you're never paying for work you haven't reviewed.
      </p>

      <h2>2. Requesting a Revision</h2>
      <p>
        If delivered work doesn't match what was agreed, you can request a revision instead of a refund, up to the number of revisions
        included in the package. This is the fastest way to resolve most issues.
      </p>

      <h2>3. Raising a Dispute</h2>
      <p>
        If a freelancer doesn't deliver, delivers work that doesn't match the agreed scope, or you're otherwise unable to resolve things
        directly, you can raise a dispute on the payment. A MahaHub admin will review the order details, delivered files, and messages
        between both parties before making a decision.
      </p>
      <ul>
        <li>Disputes should be raised as soon as possible — ideally within 7 days of the issue.</li>
        <li>If a freelancer does not respond to a dispute within 5 business days, MahaHub may resolve it in the client's favor based on
          available evidence.
        </li>
        <li>Admin decisions may result in a full refund, a partial refund, or the payment being released to the freelancer as originally
          agreed.
        </li>
      </ul>

      <h2>4. What's Not Refundable</h2>
      <ul>
        <li>Work that was delivered as agreed and explicitly accepted by the client.</li>
        <li>The platform commission is deducted from the freelancer's share, not added to what the client pays — commission amounts are not
          a separate refundable line item.
        </li>
        <li>Time-entry-based (hourly) payments already accepted for logged hours the client reviewed before paying.</li>
      </ul>

      <h2>5. Refund Method</h2>
      <p>
        Approved refunds are issued to the original payment method via Razorpay. Refund timelines depend on your bank/UPI provider and are
        typically reflected within 5-10 business days of approval.
      </p>

      <h2>6. Contest Prizes</h2>
      <p>
        Contest prize payments are released immediately to the chosen winner once selected, since picking a winner is treated as final
        approval. Contest prizes are not eligible for refund after a winner has been paid.
      </p>

      <h2>7. Contact</h2>
      <p>To raise a dispute or ask about a specific payment, use the Dispute option on that payment, or contact support.</p>
    </LegalPage>
  );
}
