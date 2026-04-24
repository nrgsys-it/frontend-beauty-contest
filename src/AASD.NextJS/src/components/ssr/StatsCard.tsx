import { ServerRenderBadge } from '@/components/ui/RenderBadge'

interface Props {
  label: string
  value: number
  icon: string
}

export default function StatsCard({ label, value, icon }: Props) {
  return (
    <div className="bg-surface rounded-xl border border-border p-6 text-center shadow-sm">
      <div className="flex justify-center mb-3">
        <ServerRenderBadge label="SSR" />
      </div>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-text">{value}</div>
      <div className="text-sm text-text-muted mt-1">{label}</div>
    </div>
  )
}
