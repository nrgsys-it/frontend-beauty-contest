interface Props {
  label: string
  value: number
  icon: string
}

export default function StatsCard({ label, value, icon }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
