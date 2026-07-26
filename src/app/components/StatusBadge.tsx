import type { RiskLevel, ReferralStatus } from "../data/mockData";

const RISK_CLASSES: Record<RiskLevel, string> = {
  "Low Risk": "bg-green-100 text-green-800 border-green-200",
  "Moderate Risk": "bg-amber-100 text-amber-800 border-amber-200",
  "High Risk": "bg-red-100 text-red-800 border-red-200",
};

const REFERRAL_CLASSES: Record<ReferralStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  Received: "bg-sky-100 text-sky-800 border-sky-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Escalated: "bg-orange-100 text-orange-800 border-orange-200",
  Cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${RISK_CLASSES[level]}`}>
      {level}
    </span>
  );
}

export function ReferralBadge({ status }: { status: ReferralStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${REFERRAL_CLASSES[status]}`}>
      {status}
    </span>
  );
}

export function PwdIdBadge({ status }: { status: string }) {
  const cls =
    status === "Active"
      ? "bg-green-100 text-green-800 border-green-200"
      : status === "Expired"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-amber-100 text-amber-800 border-amber-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
}
