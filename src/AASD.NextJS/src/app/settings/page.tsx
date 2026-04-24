import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {[
          { label: 'Profile', desc: 'Manage your account details' },
          { label: 'Notifications', desc: 'Configure notification preferences' },
          { label: 'Theme', desc: 'Light / Dark / System' },
          { label: 'About', desc: 'AASD Beauty Contest — Next.js branch' },
        ].map((item) => (
          <div key={item.label} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
            <div>
              <div className="font-medium text-gray-800">{item.label}</div>
              <div className="text-sm text-gray-500">{item.desc}</div>
            </div>
            <span className="text-gray-400">›</span>
          </div>
        ))}
      </div>
    </div>
  )
}
