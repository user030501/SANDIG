# Plan: Rename "User Management" → "Account Settings"

## Context

The manuscript defines a single-user system (one Administrator / Assigned PWD Coordinator). The label "User Management" implies multi-user administration, which contradicts the single-user design already implemented. Replacing it with "Account Settings" accurately reflects what the page does: edit profile + change password for one account.

## Files to Change

| File | Change |
|---|---|
| `src/app/components/Sidebar.tsx` line ~37 | `label: "User Management"` → `"Account Settings"`, `path: "/users"` → `"/account-settings"` |
| `src/app/pages/UserManagementPage.tsx` line ~51 | `<h1>User Management</h1>` → `<h1>Account Settings</h1>` |
| `src/app/App.tsx` line ~46 | Route `path="/users"` → `path="/account-settings"` |

No other source files reference the `/users` route or "User Management" string. The markdown spec file is a static document and does not need to change.

## Verification

- Sidebar shows "Account Settings" (Administrator role only)
- Clicking it routes to `/account-settings`
- Page heading reads "Account Settings"

---

# Plan: TINGOG Prototype — PWD Welfare Monitoring and Referral System

## Context

The user needs a fully working prototype of **TINGOG** (Timely Identification of Needs, Gaps, Outreach, and Guidance), a PWD Welfare Monitoring and Referral System for Barangay New Pandan. The spec is defined in `src/imports/pasted_text/tingog-prototype-fig4.md` and covers 13 screens, 5 user roles, and a sidebar navigation.

The project uses React + TypeScript, Tailwind CSS v4, React Router, shadcn/ui components (already installed in `src/app/components/ui/`), Recharts, and Lucide React. No @make-kits design system is present.

---

## Approach

### Routing
Use `react-router` (already installed as `react-router@7.13.0`) with client-side routing. Each screen is a route. The app wraps everything in a `BrowserRouter` inside `App.tsx`.

Route structure:
```
/ → Login
/dashboard
/users            (admin only)
/pwd-profiles
/pwd-profiles/:id
/pwd-profiles/:id/edit
/pwd-profiles/new
/assessments/new/:pwdId
/at-risk
/referrals
/referrals/new
/reports
/audit-logs       (admin only)
/mobile-update    (BHW role)
```

### Auth / Role Simulation
Store the logged-in user and role in a React Context (`AuthContext`). The Login page sets this on submit. Sidebar navigation filters items by role. No real backend — all mock.

### Mock Data
A `src/app/data/mockData.ts` file holds:
- PWD profiles (10–15 records)
- Assessments
- Referrals
- At-risk cases
- Users
- Audit logs

### Layout
- `AppLayout` component: sidebar (collapsible) + top bar + main content area
- Sidebar items filtered by role (per spec)
- Login page has no sidebar (split left/right layout)

### Color System
Override/extend the theme in `src/styles/theme.css` with TINGOG brand colors:
- Primary: blue-800 (`#1e40af`) — government/civic feel
- Risk badges: green / amber / orange / red
- Status badges: amber / blue / green / gray

---

## Files to Create/Modify

### Modified
- `src/app/App.tsx` — Router setup, AuthContext provider, route definitions

### Created
- `src/app/context/AuthContext.tsx` — role/user state
- `src/app/data/mockData.ts` — all mock data
- `src/app/components/AppLayout.tsx` — sidebar + layout shell
- `src/app/components/Sidebar.tsx` — nav items filtered by role
- `src/app/components/StatusBadge.tsx` — reusable risk/status badge
- `src/app/pages/LoginPage.tsx` — split layout login with error state
- `src/app/pages/DashboardPage.tsx` — summary cards + Recharts charts
- `src/app/pages/UserManagementPage.tsx` — user list + add user modal
- `src/app/pages/PwdProfilesPage.tsx` — searchable/filterable list
- `src/app/pages/PwdProfileViewPage.tsx` — full profile view with tabs
- `src/app/pages/PwdProfileFormPage.tsx` — add/edit form (4 sections)
- `src/app/pages/WelfareAssessmentPage.tsx` — assessment form (6 sections)
- `src/app/pages/AtRiskCasesPage.tsx` — flagged cases list
- `src/app/pages/ReferralTrackingPage.tsx` — referral list + status
- `src/app/pages/CreateReferralPage.tsx` — referral form
- `src/app/pages/ReportsPage.tsx` — report type selector + filters + export buttons
- `src/app/pages/AuditLogsPage.tsx` — log table
- `src/app/pages/MobileCaseUpdatePage.tsx` — mobile-friendly 1-col layout

### Reused shadcn/ui Components
- `src/app/components/ui/button.tsx`
- `src/app/components/ui/input.tsx`
- `src/app/components/ui/card.tsx`
- `src/app/components/ui/table.tsx`
- `src/app/components/ui/dialog.tsx`
- `src/app/components/ui/select.tsx`
- `src/app/components/ui/badge.tsx`
- `src/app/components/ui/tabs.tsx`
- `src/app/components/ui/label.tsx`
- `src/app/components/ui/textarea.tsx`
- `src/app/components/ui/checkbox.tsx`

---

## Key Design Decisions

1. **Role switcher on login**: Demo credentials shown as clickable role cards so the reviewer can easily switch roles without typing.
2. **Recharts on Dashboard**: BarChart for unmet needs, PieChart for referral status.
3. **Sidebar role filtering**: Items shown/hidden per the spec table (e.g., Audit Logs only for Admin).
4. **Risk color tags**: Consistently applied via `StatusBadge` component — green/amber/orange/red.
5. **No real routing guards**: If user navigates directly, they get a redirect back to login only if `AuthContext` has no user.

---

## Verification

1. Open the preview — Login page loads with two-column layout.
2. Click role cards or type credentials to log in as each of the 5 roles.
3. Verify sidebar shows correct items per role.
4. Navigate through each page and verify data renders.
5. Open the Dashboard and confirm charts render using Recharts.
6. Open User Management as Admin; confirm it's hidden for other roles.
7. Test the Add PWD form and Welfare Assessment form for all sections.
8. On a narrow viewport, confirm Mobile Case Update is usable.
