import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-text mb-8">Settings</h1>
      <div className="bg-surface rounded-xl border border-border shadow-sm divide-y divide-border">
        {[
          { label: 'Profile', desc: 'Manage your account details' },
          { label: 'Notifications', desc: 'Configure notification preferences' },
          { label: 'Theme', desc: 'Light / Dark / System' },
          { label: 'About', desc: 'AASD Beauty Contest — Next.js branch' },
        ].map((item) => (
          <div key={item.label} className="px-6 py-4 flex items-center justify-between hover:bg-surface-2 cursor-pointer">
            <div>
              <div className="font-medium text-text">{item.label}</div>
              <div className="text-sm text-text-muted">{item.desc}</div>
            </div>
            <span className="text-text-muted">›</span>
          </div>
        ))}
      </div>
    </div>
  )
}
