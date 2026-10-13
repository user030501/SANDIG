import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { DISABILITY_TYPES, PUROKS, type PwdProfile } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { ConfirmModal } from "../components/ui/confirm-modal";
import { useToast } from "../components/ui/toast";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  naChecked,
  onNaChange,
  full,
}: {
  label: string;
  children: React.ReactNode;
  naChecked?: boolean;
  onNaChange?: (checked: boolean) => void;
  full?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${full ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center justify-between">
        <Label className="text-gray-700 text-sm">{label}</Label>
        {onNaChange && (
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!naChecked}
              onChange={(e) => onNaChange(e.target.checked)}
              className="rounded border-gray-300"
            />
            N/A
          </label>
        )}
      </div>
      {children}
    </div>
  );
}

const PH_MOBILE_PATTERN = /^09\d{9}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isNa = (value: string) => value.trim().toUpperCase() === "N/A";

function digitsOnlyPhMobile(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

const REQUIRED_FIELDS: Array<{ key: string; label: string }> = [
  { key: "fullName", label: "Full Name" },
  { key: "dateOfBirth", label: "Date of Birth" },
  { key: "address", label: "Address" },
  { key: "pwdIdNumber", label: "PWD ID Number" },
  { key: "dateRegistered", label: "Date Registered" },
];

// Feeds the automatic initial risk assessment (rule engine + Random Forest)
// that runs as soon as a new PWD profile is saved — see handleSubmit.
const INDICATOR_FIELDS = [
  { key: "unresolvedHealthNeed", label: "Unresolved health need" },
  { key: "pendingReferral", label: "Pending referral" },
  { key: "missedCheckup", label: "Missed checkup" },
  { key: "medicationConcern", label: "Medication concern" },
  { key: "treatmentTherapyNeed", label: "Treatment or therapy need" },
  { key: "urgentMedicalCondition", label: "Urgent medical condition" },
] as const;

export function PwdProfileFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";
  const { data: existing } = useApi<PwdProfile>(
    isEdit ? `/pwd-profiles/${id}` : null, [id]
  );

  const [form, setForm] = useState({
    fullName: existing?.fullName ?? "",
    dateOfBirth: existing?.dateOfBirth ?? "",
    sex: existing?.sex ?? "Female",
    address: existing?.address ?? "",
    contactNumber: existing?.contactNumber ?? "",
    householdContactNumber: existing?.householdContactNumber ?? "",
    email: existing?.email ?? "",
    civilStatus: existing?.civilStatus ?? "Single",
    disabilityTypes: existing?.disabilityTypes ?? ["Physical"],
    pwdIdNumber: existing?.pwdIdNumber ?? "",
    pwdIdStatus: existing?.pwdIdStatus ?? "Active",
    dateRegistered: existing?.dateRegistered ?? "",
    assistiveDevice: existing?.assistiveDevice ?? "",
    householdSize: existing?.householdSize?.toString() ?? "",
    livingCondition: existing?.livingCondition ?? "",
    supportSituation: existing?.supportSituation ?? "",
    caregiverName: existing?.caregiverName ?? "",
    caregiverRelationship: existing?.caregiverRelationship ?? "",
    caregiverContact: existing?.caregiverContact ?? "",
    caregiverAvailability: existing?.caregiverAvailability ?? "",
    purok: existing?.purok ?? PUROKS[0],
    unresolvedHealthNeed: false,
    pendingReferral: false,
    missedCheckup: false,
    medicationConcern: false,
    treatmentTherapyNeed: false,
    urgentMedicalCondition: false,
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();

  function fieldClass(key: string) {
    return missingFields.has(key) ? "border-red-400" : "";
  }

  function validate(): string[] {
    const errors: string[] = [];
    const missing = new Set<string>();
    for (const f of REQUIRED_FIELDS) {
      if (!form[f.key as keyof typeof form]?.toString().trim()) missing.add(f.key);
    }
    if (form.disabilityTypes.length === 0) missing.add("disabilityTypes");
    if (missing.size > 0) {
      const labels = REQUIRED_FIELDS.filter((f) => missing.has(f.key)).map((f) => f.label);
      if (missing.has("disabilityTypes")) labels.push("Type of Disability");
      errors.push(`Please fill up: ${labels.join(", ")}.`);
    }
    if (form.contactNumber && !PH_MOBILE_PATTERN.test(form.contactNumber)) {
      errors.push("Contact Number must be a valid Philippine mobile number, e.g. 09171234567.");
    }
    if (
      form.householdContactNumber &&
      !isNa(form.householdContactNumber) &&
      !PH_MOBILE_PATTERN.test(form.householdContactNumber)
    ) {
      errors.push("Household Contact Number must be a valid Philippine mobile number, e.g. 09171234567.");
    }
    if (form.email && !EMAIL_PATTERN.test(form.email)) {
      errors.push("Email Address must be a valid email, e.g. name@example.com.");
    }
    if (form.caregiverContact && !isNa(form.caregiverContact) && !PH_MOBILE_PATTERN.test(form.caregiverContact)) {
      errors.push("Caregiver Contact Number must be a valid Philippine mobile number, e.g. 09171234567.");
    }
    setMissingFields(missing);
    return errors;
  }

  // The record arrives asynchronously, so seed the form once it lands. Mapped
  // explicitly rather than spread: the form holds householdSize as a string for
  // the number input, while the API returns it as a number.
  useEffect(() => {
    if (!existing) return;
    setForm((f) => ({
      ...f,
      fullName: existing.fullName,
      dateOfBirth: existing.dateOfBirth,
      sex: existing.sex,
      address: existing.address,
      contactNumber: existing.contactNumber,
      householdContactNumber: existing.householdContactNumber,
      email: existing.email,
      civilStatus: existing.civilStatus,
      disabilityTypes: existing.disabilityTypes,
      pwdIdNumber: existing.pwdIdNumber,
      pwdIdStatus: existing.pwdIdStatus,
      dateRegistered: existing.dateRegistered,
      assistiveDevice: existing.assistiveDevice,
      householdSize: existing.householdSize?.toString() ?? "",
      livingCondition: existing.livingCondition,
      supportSituation: existing.supportSituation,
      caregiverName: existing.caregiverName,
      caregiverRelationship: existing.caregiverRelationship,
      caregiverContact: existing.caregiverContact,
      caregiverAvailability: existing.caregiverAvailability,
      purok: existing.purok,
    }));
  }, [existing]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleDisability(type: string) {
    setForm((f) => ({
      ...f,
      disabilityTypes: f.disabilityTypes.includes(type)
        ? f.disabilityTypes.filter((t) => t !== type)
        : [...f.disabilityTypes, type],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const errors = validate();
    if (errors.length > 0) {
      setSubmitError(errors.join(" "));
      return;
    }

    const { unresolvedHealthNeed, pendingReferral, missedCheckup, medicationConcern, treatmentTherapyNeed, urgentMedicalCondition, ...rest } = form;
    const payload = {
      ...rest,
      indicators: {
        unresolvedHealthNeed,
        pendingReferral,
        missedCheckup,
        medicationConcern,
        treatmentTherapyNeed,
        urgentMedicalCondition,
      },
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/pwd-profiles/${id}`, payload);
      } else {
        await api.post("/pwd-profiles", payload);
      }
      toast.notify(
        isEdit ? "Profile updated successfully." : "PWD profile saved and automatically risk-assessed.",
        "success"
      );
      setConfirmOpen(true);
    } catch (err) {
      // e.g. a duplicate PWD ID number, which the server rejects with 409.
      const message = err instanceof Error ? err.message : "Could not save the profile.";
      setSubmitError(message);
      toast.notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  // Editing lands back on the profile's own view, which fetches fresh on
  // mount, so the just-saved changes show immediately. Adding a brand new
  // profile has no view yet to return to, so that case still goes to the list.
  function handleConfirmClose() {
    setConfirmOpen(false);
    navigate(isEdit ? `/pwd-profiles/${id}` : "/pwd-profiles");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/pwd-profiles")}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit PWD Profile" : "Add PWD Profile"}</h1>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={isEdit ? "Profile Updated" : "PWD Profile Saved"}
        onClose={handleConfirmClose}
      >
        {isEdit
          ? "The profile changes have been saved."
          : "The profile has been registered, and an initial risk assessment (rule-based score and Random Forest prediction) was run automatically."}
      </ConfirmModal>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Personal Information">
          <Field label="Full Name">
            <Input
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className={fieldClass("fullName")}
            />
          </Field>
          <Field label="Date of Birth">
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className={fieldClass("dateOfBirth")}
            />
          </Field>
          <Field label="Sex">
            <select value={form.sex} onChange={(e) => update("sex", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              <option>Female</option>
              <option>Male</option>
            </select>
          </Field>
          <Field label="Civil Status">
            <select value={form.civilStatus} onChange={(e) => update("civilStatus", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              {["Single", "Married", "Widowed", "Separated", "Annulled"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Purok / Zone">
            <select value={form.purok} onChange={(e) => update("purok", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              {PUROKS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Address">
            <Input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Street, Purok, Barangay"
              className={fieldClass("address")}
            />
          </Field>
          <Field label="Contact Number">
            <Input
              value={form.contactNumber}
              onChange={(e) => update("contactNumber", digitsOnlyPhMobile(e.target.value))}
              placeholder="09XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
            />
          </Field>
          <Field label="Email Address">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="name@example.com"
            />
          </Field>
        </FormSection>

        <FormSection title="Disability Information">
          <Field label="Type of Disability" full>
            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-lg p-3 ${missingFields.has("disabilityTypes") ? "border-red-400" : "border-gray-200"}`}>
              {DISABILITY_TYPES.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.disabilityTypes.includes(d)}
                    onChange={() => toggleDisability(d)}
                    className="rounded border-gray-300"
                  />
                  {d}
                </label>
              ))}
            </div>
          </Field>
          <Field label="PWD ID Number">
            <Input
              value={form.pwdIdNumber}
              onChange={(e) => update("pwdIdNumber", e.target.value)}
              placeholder="PWD-YYYY-XXX"
              className={fieldClass("pwdIdNumber")}
            />
          </Field>
          <Field label="PWD ID Status">
            <select value={form.pwdIdStatus} onChange={(e) => update("pwdIdStatus", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              <option>Active</option>
              <option>Expired</option>
              <option>Pending</option>
            </select>
          </Field>
          <Field label="Date Registered">
            <Input
              type="date"
              value={form.dateRegistered}
              onChange={(e) => update("dateRegistered", e.target.value)}
              className={fieldClass("dateRegistered")}
            />
          </Field>
          <Field
            label="Assistive Device Used"
            naChecked={isNa(form.assistiveDevice)}
            onNaChange={(checked) => update("assistiveDevice", checked ? "N/A" : "")}
          >
            <Input
              value={form.assistiveDevice}
              onChange={(e) => update("assistiveDevice", e.target.value)}
              placeholder="e.g., Wheelchair, Cane"
              disabled={isNa(form.assistiveDevice)}
            />
          </Field>
        </FormSection>

        <FormSection title="Household Information">
          <Field label="Household Size">
            <Input type="number" min="1" value={form.householdSize} onChange={(e) => update("householdSize", e.target.value)} />
          </Field>
          <Field label="Living Condition">
            <select value={form.livingCondition} onChange={(e) => update("livingCondition", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              {["Own home", "Renting", "Living with relatives", "Informal settler"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field
            label="Household Contact Number"
            naChecked={isNa(form.householdContactNumber)}
            onNaChange={(checked) => update("householdContactNumber", checked ? "N/A" : "")}
          >
            <Input
              value={form.householdContactNumber}
              onChange={(e) => update("householdContactNumber", digitsOnlyPhMobile(e.target.value))}
              placeholder="09XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
              disabled={isNa(form.householdContactNumber)}
            />
          </Field>
          <Field
            label="Support Situation"
            naChecked={isNa(form.supportSituation)}
            onNaChange={(checked) => update("supportSituation", checked ? "N/A" : "")}
          >
            <Input
              value={form.supportSituation}
              onChange={(e) => update("supportSituation", e.target.value)}
              placeholder="Describe support situation"
              disabled={isNa(form.supportSituation)}
            />
          </Field>
        </FormSection>

        <FormSection title="Caregiver Information">
          <Field
            label="Caregiver Name"
            naChecked={isNa(form.caregiverName)}
            onNaChange={(checked) => update("caregiverName", checked ? "N/A" : "")}
          >
            <Input
              value={form.caregiverName}
              onChange={(e) => update("caregiverName", e.target.value)}
              placeholder="Full name"
              disabled={isNa(form.caregiverName)}
            />
          </Field>
          <Field
            label="Relationship"
            naChecked={isNa(form.caregiverRelationship)}
            onNaChange={(checked) => update("caregiverRelationship", checked ? "N/A" : "")}
          >
            <Input
              value={form.caregiverRelationship}
              onChange={(e) => update("caregiverRelationship", e.target.value)}
              placeholder="e.g., Spouse, Parent, Sibling"
              disabled={isNa(form.caregiverRelationship)}
            />
          </Field>
          <Field
            label="Contact Number"
            naChecked={isNa(form.caregiverContact)}
            onNaChange={(checked) => update("caregiverContact", checked ? "N/A" : "")}
          >
            <Input
              value={form.caregiverContact}
              onChange={(e) => update("caregiverContact", digitsOnlyPhMobile(e.target.value))}
              placeholder="09XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
              disabled={isNa(form.caregiverContact)}
            />
          </Field>
          <Field label="Availability">
            <select value={form.caregiverAvailability} onChange={(e) => update("caregiverAvailability", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              {["Full-time", "Part-time", "No caregiver"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </FormSection>

        {!isEdit && (
          <FormSection title="Initial Risk Indicators">
            <p className="sm:col-span-2 -mt-1 mb-1 text-xs text-gray-500">
              Used to automatically compute this PWD's initial risk assessment (rule-based score and Random
              Forest prediction) as soon as the profile is saved — no separate assessment needed to get a
              first risk level.
            </p>
            {INDICATOR_FIELDS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                {label}
              </label>
            ))}
          </FormSection>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate("/pwd-profiles")}
            className="px-5 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800">
            <Save size={15} /> Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
