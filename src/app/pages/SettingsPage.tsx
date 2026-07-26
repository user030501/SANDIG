export function SettingsPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">System Name</h3>
          <input defaultValue="SANDIG" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">Barangay Name</h3>
          <input defaultValue="Barangay New Pandan" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">Municipality / City</h3>
          <input defaultValue="" placeholder="Enter municipality" className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs" />
        </div>
        <button className="px-5 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}
