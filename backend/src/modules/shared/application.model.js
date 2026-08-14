import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    // Polymorphic — an application is against a Job (salaried), a Project
    // (bid-based), or a Campaign (brand/influencer brief); onModel picks
    // which collection `job` populates from. Kept the field named "job"
    // rather than renaming, since payment/contract/milestone code across the
    // app already reads `application.job` and only ever needs
    // employer/title/companyName off of it — all three models shape those
    // fields identically, so no other code has to change per model.
    onModel: { type: String, enum: ["Job", "Project", "Campaign"], default: "Job" },
    job: { type: mongoose.Schema.Types.ObjectId, refPath: "onModel", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // "invited" means the poster created this application by directly
    // inviting the applicant (see campaign.controller.js's inviteToCampaign)
    // rather than the applicant finding and applying to an open posting
    // themselves — everything downstream (edit, withdraw, hire, pay) works
    // identically either way, this is purely who-initiated-it provenance.
    origin: { type: String, enum: ["applied", "invited"], default: "applied" },
    coverLetter: { type: String, default: "" },
    resumeUrl: { type: String, default: "" },
    // Only meaningful for freelance/contract-type jobs — the bid the
    // freelancer is proposing, distinct from the job's posted salary range.
    proposedRate: { type: Number, default: 0 },
    deliveryDays: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "interview", "rejected", "hired", "withdrawn"],
      default: "applied",
    },
    withdrawnAt: { type: Date },
    // Set whenever the freelancer edits coverLetter/proposedRate/deliveryDays
    // after submitting — only allowed while status is still "applied", so
    // this never fires once the employer has acted on the proposal.
    lastEditedAt: { type: Date },
    // Set the first time the employer/client opens this job/project's
    // applicant list — lets the freelancer see "Viewed" vs "Sent" for a
    // still-"applied" proposal, distinct from an explicit status change.
    viewedAt: { type: Date },
    // Set once the employer schedules a real interview slot (distinct from
    // status:"interview", which is just a stage label) — the applicant then
    // confirms it, which is what "Upcoming Interviews" is actually built from.
    interview: {
      scheduledAt: { type: Date },
      mode: { type: String, enum: ["video", "in_person", "phone"], default: "video" },
      meetingLink: { type: String, default: "" },
      location: { type: String, default: "" },
      note: { type: String, default: "" },
      status: { type: String, enum: ["scheduled", "confirmed", "cancelled"], default: "scheduled" },
    },
    // Lightweight e-signature: a plain-text agreement generated once the
    // freelancer is hired, which both sides must "sign" (type their name)
    // before any payment can be made against this application.
    contract: {
      text: { type: String, default: "" },
      employerSignedAt: { type: Date },
      employerSignatureName: { type: String, default: "" },
      freelancerSignedAt: { type: Date },
      freelancerSignatureName: { type: String, default: "" },
    },
    // Set once the campaign poster pays a facilitation fee to settle this
    // hire off-platform (see createOffPlatformFacilitationPayment) — the
    // deal amount itself is never handled by GrowHive for these, so there's
    // no escrow/dispute protection on it. Mutually exclusive with a normal
    // createCampaignPayment on the same application (checked in both
    // controllers) — a hire is settled one way or the other, not both.
    offPlatformSettledAt: { type: Date },
    // Set when the employer asks the applicant to revise their proposedRate
    // (see requestRateChange in job.controller.js) — bumps status back to
    // "applied" so editApplication's existing guard allows the edit again.
    // `requestedAt` is what "pending" actually means — editApplication clears
    // just that field (not the whole object) when the applicant responds, so
    // always check negotiationRequest?.requestedAt, never the object itself
    // (message/suggestedRate below keep their own values/defaults even once
    // resolved, same as `interview`/`contract` elsewhere in this schema).
    negotiationRequest: {
      message: { type: String, default: "" },
      suggestedRate: { type: Number },
      requestedAt: { type: Date },
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
