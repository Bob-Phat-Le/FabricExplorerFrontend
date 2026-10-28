'use client';

const APP_VERSION = '1.0.0';

const SELECT_CLASS = 'w-full text-xs px-3 py-2 rounded-lg border border-slate-300 outline-none';

export function SettingsView() {
  return (
    <section className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">System preferences and account configuration.</p>
      </div>

      <div className="space-y-4">
        {/* General Preferences Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Workspace</label>
              <select className={SELECT_CLASS}>
                <option>Analytics Workspace</option>
                <option>Data Platform</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Environment</label>
              <select className={SELECT_CLASS}>
                <option>Production</option>
                <option>Staging</option>
              </select>
            </div>
          </div>
        </div>

        {/* About Fabric Explorer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            About Fabric Explorer
          </h3>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-slate-800">Version</span>
            <span className="font-mono text-slate-500">{APP_VERSION}</span>
          </div>
          <p className="text-slate-500 text-xs">Microsoft Fabric management, discovery, and ingestion tool.</p>
        </div>
      </div>
    </section>
  );
}
