import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import type { PwdProfile } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import {
  RISK_INDICATORS, MAX_RISK_SCORE, computeRuleBasedScore, emptyIndicators, bandFor,
  type RiskIndicators,
} from "../data/riskModel";
import { RiskBadge } from "../components/StatusBadge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-gray-700 text-sm">{label}</Label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </Field>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={label}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-700"
      />
      <label htmlFor={label} className="text-sm text-gray-700">{label}</label>
    </div>
  );
}

export function WelfareAssessmentPage() {
  const { pwdId } = useParams();
  const navigate = useNavigate();

  // Reached via /assessments/new/:pwdId the PWD is known; via /assessments/new
  // it is not, and the Administrator must pick one explicitly. Never fall back
  // to an arbitrary profile — that silently files the assessment against the
  // wrong person.
  const [selectedId, setSelectedId] = useState(pwdId ?? "");
  const { data: profileData } = useApi<PwdProfile[]>("/pwd-profiles");
  const profiles = profileData ?? [];
  const profile = profiles.find((p) => p.id === selectedId) ?? null;
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    // Health
    healthConcern: "",
    checkupAttendance: "Regular",
    therapyAttendance: "Regular",
    medicationAccess: "Accessible",
    // Assistive device
    deviceType: profile?.assistiveDevice ?? "",
    deviceCondition: "Good",
    needsRepair: false,
    needsReplacement: false,
    // Needs
    urgentNeed: "",
    remarks: "",
    recommendedAction: "",
  });

  /** Selecting a PWD also prefills the device field from their profile. */
  function selectPwd(id: string) {
    setSelectedId(id);
    const picked = profiles.find((p) => p.id === id);
    setForm((f) => ({ ...f, deviceType: picked?.assistiveDevice ?? "" }));
  }

  // The six scoring indicators — these produce the rule-based score.
  const [indicators, setIndicators] = useState<RiskIndicators>(emptyIndicators);
  const live = computeRuleBasedScore(indicators);
  const liveBand = bandFor(live.level);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      // The server recomputes the score from `indicators`; the live preview
      // above is display only and is deliberately not sent as a score.
      await api.post("/assessments", { pwdId: profile.id, ...form, indicators });
      setSaved(true);
      setTimeout(() => navigate(`/pwd-profiles/${profile.id}`), 900);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save the assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welfare Assessment</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profile
              ? `For: ${profile.fullName} — ${profile.pwdIdNumber}`
              : "Select the PWD being assessed to begin"}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {submitError}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Assessment saved successfully. Redirecting…
        </div>
      )}

      {/* PWD selector — only shown when the route did not name one */}
      {!pwdId && (
        <div
          className="bg-white rounded-xl border-2 p-6"
          style={{ borderColor: profile ? "#e5e7eb" : "#fed7aa" }}
        >
          <Label className="text-gray-700 text-sm">
            Assessing PWD <span className="text-red-600">*</span>
          </Label>
          <select
            value={selectedId}
            onChange={(e) => selectPwd(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full mt-1 sm:max-w-md"
          >
            <option value="">— Select a PWD —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} — {p.pwdIdNumber}
              </option>
            ))}
          </select>
          {!profile && (
            <p className="text-xs text-orange-600 mt-2">
              Choose a PWD to begin. The assessment form stays locked until one is selected.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset disabled={!profile} className="border-0 p-0 m-0 space-y-5 disabled:opacity-50">
        <Section title="Health">
          <Field label="Health Concern" full>
            <Input
              value={form.healthConcern}
              onChange={(e) => update("healthConcern", e.target.value)}
              placeholder="Describe any health concerns"
            />
          </Field>
          <SelectField label="Checkup Attendance" value={form.checkupAttendance} onChange={(v) => update("checkupAttendance", v)} options={["Regular", "Irregular", "None in past 6 months", "None in past year"]} />
          <SelectField label="Therapy Attendance" value={form.therapyAttendance} onChange={(v) => update("therapyAttendance", v)} options={["Regular", "Irregular", "None", "N/A"]} />
          <SelectField label="Medication Access" value={form.medicationAccess} onChange={(v) => update("medicationAccess", v)} options={["Accessible", "Difficult — no transport", "Cannot afford", "None needed"]} />
        </Section>

        <Section title="Assistive Device">
          <Field label="Device Type">
            <Input value={form.deviceType} onChange={(e) => update("deviceType", e.target.value)} placeholder="e.g., Wheelchair, Cane, None" />
          </Field>
          <SelectField label="Device Condition" value={form.deviceCondition} onChange={(v) => update("deviceCondition", v)} options={["Good", "Worn", "Damaged", "Broken", "N/A"]} />
          <div className="sm:col-span-2 flex gap-6 mt-1">
            <CheckboxField label="Needs Repair" checked={form.needsRepair} onChange={(v) => update("needsRepair", v)} />
            <CheckboxField label="Needs Replacement" checked={form.needsReplacement} onChange={(v) => update("needsReplacement", v)} />
          </div>
        </Section>

        {/* Risk indicators — drive the rule-based score */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1 pb-2 border-b border-gray-100">
            Risk Scoring Indicators
          </h3>
          <p className="text-xs text-gray-400 mt-2 mb-4">
            Tick each indicator present. The rule-based score updates automatically —
            Low 0–4 · Moderate 5–8 · High 9 and above.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RISK_INDICATORS.map((ind) => (
              <label
                key={ind.key}
                title={ind.description}
                className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                  indicators[ind.key]
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={indicators[ind.key]}
                  onChange={(e) =>
                    setIndicators((prev) => ({ ...prev, [ind.key]: e.target.checked }))
                  }
                  className="w-4 h-4 mt-0.5 accent-red-600"
                />
                <span className="flex-1">
                  <span className="text-sm text-gray-800">{ind.label}</span>
                  {ind.doubleWeighted && (
                    <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                      ×2 — triggers immediate review
                    </span>
                  )}
                  <span className="block text-xs text-gray-400 mt-0.5">{ind.description}</span>
                </span>
                <span className="text-xs font-medium text-gray-500 tabular-nums">+{ind.weight}</span>
              </label>
            ))}
          </div>

          {/* Live rule-based result */}
          <div
            className="mt-4 rounded-xl border p-4 flex items-center justify-between"
            style={{ backgroundColor: liveBand.bg, borderColor: liveBand.border }}
          >
            <div>
              <div className="text-xs text-gray-500">Rule-Based Score</div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: liveBand.color }}>
                {live.score}
                <span className="text-sm font-medium text-gray-400"> / {MAX_RISK_SCORE}</span>
              </div>
            </div>
            <div className="text-right">
              <RiskBadge level={live.level} />
              {live.triggersImmediateReview && (
                <div className="text-xs text-orange-600 font-medium mt-1.5">
                  Immediate review required
                </div>
              )}
            </div>
          </div>
        </div>

        <Section title="Needs and Remarks">
          <Field label="Urgent Need" full>
            <Input value={form.urgentNeed} onChange={(e) => update("urgentNeed", e.target.value)} placeholder="Describe most urgent need" />
          </Field>
          <Field label="Assessment Remarks" full>
            <textarea
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
              placeholder="Additional remarks or observations"
              rows={3}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full resize-none"
            />
          </Field>
          <Field label="Recommended Action" full>
            <Input value={form.recommendedAction} onChange={(e) => update("recommendedAction", e.target.value)} placeholder="e.g., Refer to BHC, Coordinate with CSWD" />
          </Field>
          <Field label="Resulting Risk Level" full>
            <div className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
              <RiskBadge level={live.level} />
              <span className="text-xs text-gray-400">
                Computed from the indicators above ({live.score}/{MAX_RISK_SCORE}). The final level
                is set by the Administrator on the case review screen.
              </span>
            </div>
          </Field>
        </Section>
        </fieldset>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            disabled={!profile || submitting}
            className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={15} /> {submitting ? "Saving…" : "Save Assessment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
