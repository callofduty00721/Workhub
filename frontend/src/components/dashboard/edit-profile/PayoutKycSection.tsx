import { isAxiosError } from "axios";
import type { UseMutationResult } from "@tanstack/react-query";
import { Loader2, FileText, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { SelfieCapture } from "@/components/shared/SelfieCapture";
import type { WithdrawalMethod, User } from "@/types";
import { VerificationStatusPill } from "./shared";
import { PhoneVerificationSection } from "./PhoneVerificationSection";

type VoidMutation = UseMutationResult<unknown, unknown, void, unknown>;
type Doc = { url: string; name: string };

export function PayoutKycSection({
  user,
  payoutMethod,
  setPayoutMethod,
  payoutUpiId,
  setPayoutUpiId,
  payoutBankAccountHolder,
  setPayoutBankAccountHolder,
  payoutBankAccountNumber,
  setPayoutBankAccountNumber,
  payoutBankIfsc,
  setPayoutBankIfsc,
  resendEmailMutation,
  kycDocuments,
  setKycDocuments,
  kycMutation,
  faceSelfie,
  setFaceSelfie,
  faceVerificationMutation,
  addressDocuments,
  setAddressDocuments,
  addressVerificationMutation,
  bankVerificationDocuments,
  setBankVerificationDocuments,
  bankVerificationMutation,
}: {
  user: User;
  payoutMethod: WithdrawalMethod;
  setPayoutMethod: (v: WithdrawalMethod) => void;
  payoutUpiId: string;
  setPayoutUpiId: (v: string) => void;
  payoutBankAccountHolder: string;
  setPayoutBankAccountHolder: (v: string) => void;
  payoutBankAccountNumber: string;
  setPayoutBankAccountNumber: (v: string) => void;
  payoutBankIfsc: string;
  setPayoutBankIfsc: (v: string) => void;
  resendEmailMutation: VoidMutation;
  kycDocuments: Doc[];
  setKycDocuments: (updater: (prev: Doc[]) => Doc[]) => void;
  kycMutation: VoidMutation;
  faceSelfie: string;
  setFaceSelfie: (v: string) => void;
  faceVerificationMutation: VoidMutation;
  addressDocuments: Doc[];
  setAddressDocuments: (updater: (prev: Doc[]) => Doc[]) => void;
  addressVerificationMutation: VoidMutation;
  bankVerificationDocuments: Doc[];
  setBankVerificationDocuments: (updater: (prev: Doc[]) => Doc[]) => void;
  bankVerificationMutation: VoidMutation;
}) {
  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <h3 className="text-sm font-semibold">Payout Details</h3>
            <p className="text-xs text-muted-foreground">Save your UPI ID or bank details so you don&apos;t need to re-enter them every time you withdraw.</p>
          </div>
          <div className="space-y-2">
            <Label>Preferred Method</Label>
            <Select value={payoutMethod} onValueChange={(v) => setPayoutMethod(v as WithdrawalMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {payoutMethod === "upi" ? (
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input value={payoutUpiId} onChange={(e) => setPayoutUpiId(e.target.value)} placeholder="yourname@upi" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input value={payoutBankAccountHolder} onChange={(e) => setPayoutBankAccountHolder(e.target.value)} placeholder="As per bank records" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input value={payoutBankAccountNumber} onChange={(e) => setPayoutBankAccountNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input value={payoutBankIfsc} onChange={(e) => setPayoutBankIfsc(e.target.value.toUpperCase())} placeholder="ABCD0123456" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card id="kyc">
        <CardContent className="space-y-4 p-5">
          <div>
            <h3 className="text-sm font-semibold">Verification</h3>
            <p className="text-xs text-muted-foreground">Build trust with clients and unlock withdrawals by verifying your identity.</p>
          </div>

          {/* Email */}
          <div className="space-y-2 border-b border-border pb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Email</p>
              <VerificationStatusPill verified={user.isEmailVerified} />
            </div>
            {!user.isEmailVerified && (
              <>
                <p className="text-xs text-muted-foreground">Check your inbox for a verification link, or resend it below.</p>
                <Button type="button" variant="outline" size="sm" disabled={resendEmailMutation.isPending} onClick={() => resendEmailMutation.mutate()}>
                  {resendEmailMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Resend Verification Email
                </Button>
                {resendEmailMutation.isSuccess && <p className="text-xs text-success">Email sent — check your inbox.</p>}
              </>
            )}
          </div>

          {/* Mobile */}
          <PhoneVerificationSection user={user} />

          {/* Government ID (KYC) */}
          <div className="space-y-2 border-b border-border pb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Government ID</p>
              <VerificationStatusPill status={user.kycStatus} />
            </div>
            {user.kycStatus === "rejected" && user.kycReviewNote && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">Reason: {user.kycReviewNote}</p>
            )}
            {(user.kycStatus === "unverified" || user.kycStatus === "rejected" || !user.kycStatus) && (
              <>
                <p className="text-xs text-muted-foreground">
                  Upload a government-issued ID (Aadhaar, PAN, passport, or driving licence) as an image or PDF.
                </p>
                <div className="space-y-2">
                  {kycDocuments.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                      <button type="button" onClick={() => setKycDocuments((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-3.5 w-3.5 text-danger" />
                      </button>
                    </div>
                  ))}
                  <FileUpload
                    folder="document"
                    accept="image/png,image/jpeg,application/pdf"
                    label="Upload ID document"
                    onUploaded={(url, fileName) => setKycDocuments((prev) => [...prev, { url, name: fileName }])}
                  />
                </div>
                {kycMutation.isError && (
                  <p className="text-xs text-danger">
                    {isAxiosError(kycMutation.error) ? kycMutation.error.response?.data?.message : "Something went wrong."}
                  </p>
                )}
                {kycMutation.isSuccess && <p className="text-xs text-success">Submitted for review.</p>}
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  disabled={kycDocuments.length === 0 || kycMutation.isPending}
                  onClick={() => kycMutation.mutate()}
                >
                  {kycMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit for Verification
                </Button>
              </>
            )}
          </div>

          {/* Face Verification */}
          <div className="space-y-2 border-b border-border pb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Face Verification</p>
              <VerificationStatusPill status={user.faceVerificationStatus} />
            </div>
            {user.faceVerificationStatus === "rejected" && user.faceVerificationReviewNote && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">Reason: {user.faceVerificationReviewNote}</p>
            )}
            {(user.faceVerificationStatus === "unverified" || user.faceVerificationStatus === "rejected" || !user.faceVerificationStatus) && (
              <>
                <p className="text-xs text-muted-foreground">Upload a clear, well-lit selfie so we can confirm your ID document matches your face.</p>
                {faceSelfie ? (
                  <div className="flex items-center gap-3">
                    <img src={faceSelfie} alt="Selfie preview" className="h-20 w-20 rounded-lg border border-border object-cover" />
                    <button type="button" onClick={() => setFaceSelfie("")} className="text-xs text-danger hover:underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelfieCapture folder="document" onCaptured={(url) => setFaceSelfie(url)} />
                    <FileUpload folder="document" accept="image/png,image/jpeg" label="Upload selfie" onUploaded={(url) => setFaceSelfie(url)} />
                  </div>
                )}
                {faceVerificationMutation.isError && (
                  <p className="text-xs text-danger">
                    {isAxiosError(faceVerificationMutation.error) ? faceVerificationMutation.error.response?.data?.message : "Something went wrong."}
                  </p>
                )}
                {faceVerificationMutation.isSuccess && <p className="text-xs text-success">Submitted for review.</p>}
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  disabled={!faceSelfie || faceVerificationMutation.isPending}
                  onClick={() => faceVerificationMutation.mutate()}
                >
                  {faceVerificationMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit for Verification
                </Button>
              </>
            )}
          </div>

          {/* Address Verification */}
          <div className="space-y-2 border-b border-border pb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Address Verification</p>
              <VerificationStatusPill status={user.addressVerificationStatus} />
            </div>
            {user.addressVerificationStatus === "rejected" && user.addressVerificationReviewNote && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">Reason: {user.addressVerificationReviewNote}</p>
            )}
            {(user.addressVerificationStatus === "unverified" || user.addressVerificationStatus === "rejected" || !user.addressVerificationStatus) && (
              <>
                <p className="text-xs text-muted-foreground">Upload a utility bill, rental agreement, or bank statement showing your current address.</p>
                <div className="space-y-2">
                  {addressDocuments.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                      <button type="button" onClick={() => setAddressDocuments((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-3.5 w-3.5 text-danger" />
                      </button>
                    </div>
                  ))}
                  <FileUpload
                    folder="document"
                    accept="image/png,image/jpeg,application/pdf"
                    label="Upload address proof"
                    onUploaded={(url, fileName) => setAddressDocuments((prev) => [...prev, { url, name: fileName }])}
                  />
                </div>
                {addressVerificationMutation.isError && (
                  <p className="text-xs text-danger">
                    {isAxiosError(addressVerificationMutation.error) ? addressVerificationMutation.error.response?.data?.message : "Something went wrong."}
                  </p>
                )}
                {addressVerificationMutation.isSuccess && <p className="text-xs text-success">Submitted for review.</p>}
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  disabled={addressDocuments.length === 0 || addressVerificationMutation.isPending}
                  onClick={() => addressVerificationMutation.mutate()}
                >
                  {addressVerificationMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit for Verification
                </Button>
              </>
            )}
          </div>

          {/* Bank Verification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Bank Verification</p>
              <VerificationStatusPill status={user.bankVerificationStatus} />
            </div>
            {user.bankVerificationStatus === "rejected" && user.bankVerificationReviewNote && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">Reason: {user.bankVerificationReviewNote}</p>
            )}
            {(user.bankVerificationStatus === "unverified" || user.bankVerificationStatus === "rejected" || !user.bankVerificationStatus) && (
              <>
                <p className="text-xs text-muted-foreground">Upload a cancelled cheque, passbook photo, or bank statement matching your payout details above.</p>
                <div className="space-y-2">
                  {bankVerificationDocuments.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                      <button type="button" onClick={() => setBankVerificationDocuments((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-3.5 w-3.5 text-danger" />
                      </button>
                    </div>
                  ))}
                  <FileUpload
                    folder="document"
                    accept="image/png,image/jpeg,application/pdf"
                    label="Upload bank proof"
                    onUploaded={(url, fileName) => setBankVerificationDocuments((prev) => [...prev, { url, name: fileName }])}
                  />
                </div>
                {bankVerificationMutation.isError && (
                  <p className="text-xs text-danger">
                    {isAxiosError(bankVerificationMutation.error) ? bankVerificationMutation.error.response?.data?.message : "Something went wrong."}
                  </p>
                )}
                {bankVerificationMutation.isSuccess && <p className="text-xs text-success">Submitted for review.</p>}
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  disabled={bankVerificationDocuments.length === 0 || bankVerificationMutation.isPending}
                  onClick={() => bankVerificationMutation.mutate()}
                >
                  {bankVerificationMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit for Verification
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
