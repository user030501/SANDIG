import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { DISABILITY_TYPES, PUROKS, type PwdProfile } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-gray-700 text-sm">{label}</Label>
      {children}
    </div>
  );
}

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
    civilStatus: existing?.civilStatus ?? "Single",
    disabilityType: existing?.disabilityType ?? "Physical",
    pwdIdNumber: existing?.pwdIdNumber ?? "",
    pwdIdStatus: existing?.pwdIdStatus ?? "Active",
    dateRegistered: existing?.dateRegistered ?? "",
    assistiveDevice: existing?.assistiveDevice ?? "",
    householdSize: existing?.householdSize?.toString() ?? "1",
    livingCondition: existing?.livingCondition ?? "",
    incomeBracket: existing?.incomeBracket ?? "",
    supportSituation: existing?.supportSituation ?? "",
    caregiverName: existing?.caregiverName ?? "",
    caregiverRelationship: existing?.caregiverRelationship ?? "",
    caregiverContact: existing?.caregiverContact ?? "",
    caregiverAvailability: existing?.caregiverAvailability ?? "",
    purok: existing?.purok ?? "Purok 1",
  });

  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      civilStatus: existing.civilStatus,
      disabilityType: existing.disabilityType,
      pwdIdNumber: existing.pwdIdNumber,
      pwdIdStatus: existing.pwdIdStatus,
      dateRegistered: existing.dateRegistered,
      assistiveDevice: existing.assistiveDevice,
      householdSize: String(existing.householdSize),
      livingCondition: existing.livingCondition,
      incomeBracket: existing.incomeBracket,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/pwd-profiles/${id}`, form);
      } else {
        await api.post("/pwd-profiles", form);
      }
      setSaved(true);
      setTimeout(() => navigate("/pwd-profiles"), 900);
    } catch (err) {
      // e.g. a duplicate PWD ID number, which the server rejects with 409.
      setSubmitError(err instanceof Error ? err.message : "Could not save the profile.");
    } finally {
      setSubmitting(false);
    }
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

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Profile {isEdit ? "updated" : "saved"} successfully. Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Personal Information">
          <Field label="Full Name">
            <Input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
          </Field>
          <Field label="Date of Birth">
            <Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} required />
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
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street, Purok, Barangay" />
          </Field>
          <Field label="Contact Number">
            <Input value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} placeholder="09XXXXXXXXX" />
          </Field>
        </FormSection>

        <FormSection title="Disability Information">
          <Field label="Type of Disability">
            <select value={form.disabilityType} onChange={(e) => update("disabilityType", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              {DISABILITY_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="PWD ID Number">
            <Input value={form.pwdIdNumber} onChange={(e) => update("pwdIdNumber", e.target.value)} placeholder="PWD-YYYY-XXX" />
          </Field>
          <Field label="PWD ID Status">
            <select value={form.pwdIdStatus} onChange={(e) => update("pwdIdStatus", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              <option>Active</option>
              <option>Expired</option>
              <option>Pending</option>
            </select>
          </Field>
          <Field label="Date Registered">
            <Input type="date" value={form.dateRegistered} onChange={(e) => update("dateRegistered", e.target.value)} />
          </Field>
          <Field label="Assistive Device Used">
            <Input value={form.assistiveDevice} onChange={(e) => update("assistiveDevice", e.target.value)} placeholder="e.g., Wheelchair, Cane, None" />
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
          <Field label="Income Bracket">
            <select value={form.incomeBracket} onChange={(e) => update("incomeBracket", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              {["No income", "Below Minimum Wage", "Minimum Wage", "Above Minimum Wage", "Senior Citizen Pension", "4Ps Beneficiary"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Support Situation">
            <Input value={form.supportSituation} onChange={(e) => update("supportSituation", e.target.value)} placeholder="Describe support situation" />
          </Field>
        </FormSection>

        <FormSection title="Caregiver Information">
          <Field label="Caregiver Name">
            <Input value={form.caregiverName} onChange={(e) => update("caregiverName", e.target.value)} placeholder="Full name or 'None'" />
          </Field>
          <Field label="Relationship">
            <Input value={form.caregiverRelationship} onChange={(e) => update("caregiverRelationship", e.target.value)} placeholder="e.g., Spouse, Parent, Sibling" />
          </Field>
          <Field label="Contact Number">
            <Input value={form.caregiverContact} onChange={(e) => update("caregiverContact", e.target.value)} placeholder="09XXXXXXXXX" />
          </Field>
          <Field label="Availability">
            <select value={form.caregiverAvailability} onChange={(e) => update("caregiverAvailability", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white w-full">
              {["Full-time", "Part-time", "No caregiver"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </FormSection>

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
