import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Send } from "lucide-react";
import { REFERRED_OFFICES, REFERRAL_REASONS, type PwdProfile } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-gray-700 text-sm">{label}</Label>
      {children}
    </div>
  );
}

const selectCls = "border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full";

export function CreateReferralPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    pwdId: "",
    identifiedNeed: "",
    referralReason: REFERRAL_REASONS[0],
    referredOffice: REFERRED_OFFICES[0],
    receiverName: "",
    referralDate: new Date().toISOString().split("T")[0],
    followUpDate: "",
    priorityLevel: "Moderate Risk",
    outcome: "",
    remarks: "",
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.post("/referrals", form);
      setSaved(true);
      setTimeout(() => navigate("/referrals"), 900);
    } catch (err) {
      // The server refuses when the PWD's latest assessment is unconfirmed
      // (FR-10/FR-11), so surface that rather than silently succeeding.
      setSubmitError(err instanceof Error ? err.message : "Could not create the referral.");
    } finally {
      setSubmitting(false);
    }
  }

  const { data: profileData } = useApi<PwdProfile[]>("/pwd-profiles");
  const profiles = profileData ?? [];
  const selectedPwd = profiles.find((p) => p.id === form.pwdId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/referrals")}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Referral</h1>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Referral submitted successfully. Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">
            Referral Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Field label="PWD Name" full>
              <select
                value={form.pwdId}
                onChange={(e) => update("pwdId", e.target.value)}
                className={selectCls}
                required
              >
                <option value="">— Select a PWD —</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName} — {p.pwdIdNumber}</option>
                ))}
              </select>
            </Field>

            {selectedPwd && (
              <div
                className="sm:col-span-2 rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#EEF0FF", color: "#2142A6" }}
              >
                <span className="font-medium">Disability:</span> {selectedPwd.disabilityType}
                &nbsp;·&nbsp;
                <span className="font-medium">Risk:</span> {selectedPwd.riskStatus}
                &nbsp;·&nbsp;
                <span className="font-medium">Purok:</span> {selectedPwd.purok}
              </div>
            )}

            <Field label="Priority Level">
              <select value={form.priorityLevel} onChange={(e) => update("priorityLevel", e.target.value)} className={selectCls}>
                <option>Low Risk</option>
                <option>Moderate Risk</option>
                <option>High Risk</option>
              </select>
            </Field>

            <Field label="Identified Need" full>
              <Input
                value={form.identifiedNeed}
                onChange={(e) => update("identifiedNeed", e.target.value)}
                placeholder="e.g., Wheelchair repair, Medical assistance"
                required
              />
            </Field>

            <Field label="Referral Reason">
              <select value={form.referralReason} onChange={(e) => update("referralReason", e.target.value)} className={selectCls}>
                {REFERRAL_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>

            <Field label="Referred Office">
              <select value={form.referredOffice} onChange={(e) => update("referredOffice", e.target.value)} className={selectCls}>
                {REFERRED_OFFICES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>

            <Field label="Receiver / Contact Person">
              <Input
                value={form.receiverName}
                onChange={(e) => update("receiverName", e.target.value)}
                placeholder="e.g., BHC Nurse-in-Charge, Dr. Santos"
              />
            </Field>

            <Field label="Referral Date">
              <Input type="date" value={form.referralDate} onChange={(e) => update("referralDate", e.target.value)} required />
            </Field>

            <Field label="Follow-Up Date">
              <Input type="date" value={form.followUpDate} onChange={(e) => update("followUpDate", e.target.value)} />
            </Field>

            <Field label="Expected Outcome" full>
              <Input
                value={form.outcome}
                onChange={(e) => update("outcome", e.target.value)}
                placeholder="e.g., PWD to receive therapy at BHC within 2 weeks"
              />
            </Field>

            <Field label="Remarks" full>
              <textarea
                value={form.remarks}
                onChange={(e) => update("remarks", e.target.value)}
                placeholder="Additional notes or special instructions"
                rows={2}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full resize-none"
              />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button
            type="button"
            onClick={() => navigate("/referrals")}
            className="px-5 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" className="flex items-center gap-2" style={{ backgroundColor: "#2142A6" }}>
            <Send size={15} /> Submit Referral
          </Button>
        </div>
      </form>
    </div>
  );
}
