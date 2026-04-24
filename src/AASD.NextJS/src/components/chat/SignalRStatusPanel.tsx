'use client'

import { useTranslations } from 'next-intl'
import { useChatStore } from '@/lib/store'
import type { RealtimeStatus } from '@/lib/types'

const STATUS_STYLE: Record<RealtimeStatus, { color: string; pulse: boolean }> = {
  connecting:   { color: 'bg-amber-400',   pulse: true  },
  connected:    { color: 'bg-emerald-500', pulse: false },
  reconnecting: { color: 'bg-amber-400',   pulse: true  },
  disconnected: { color: 'bg-gray-400',    pulse: false },
  error:        { color: 'bg-red-500',     pulse: false },
}

function StatusDot({ status, label }: { status: RealtimeStatus; label: string }) {
  const cfg = STATUS_STYLE[status] ?? STATUS_STYLE.disconnected
  return (
    <span className="flex items-center gap-1.5">
      <span className={`relative flex h-2.5 w-2.5 ${cfg.pulse ? 'animate-pulse' : ''}`}>
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.color} ${cfg.pulse ? 'animate-ping' : ''}`}
        />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.color}`} />
      </span>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </span>
  )
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function SignalRStatusPanel() {
  const t = useTranslations('chat')
  const wsStatus = useChatStore((s) => s.wsStatus)
  const wsStatusHistory = useChatStore((s) => s.wsStatusHistory)

  const statusLabels: Record<RealtimeStatus, string> = {
    connecting:   t('signalr.connecting'),
    connected:    t('signalr.connected'),
    reconnecting: t('signalr.reconnecting'),
    disconnected: t('signalr.disconnected'),
    error:        t('signalr.error'),
  }

  const recentHistory = wsStatusHistory.slice(-5).reverse()

  return (
    <div className="border-b border-gray-200 px-3 py-2 bg-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {t('signalr.label')}
        </span>
        <StatusDot status={wsStatus} label={statusLabels[wsStatus]} />
      </div>

      {recentHistory.length > 0 && (
        <details className="relative">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none list-none">
            {t('signalr.history')} ▾
          </summary>
          <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
            <div className="text-xs font-semibold text-gray-400 mb-1.5">
              {t('signalr.recentTransitions')}
            </div>
            <ul className="space-y-1">
              {recentHistory.map((entry, i) => {
                const cfg = STATUS_STYLE[entry.status] ?? STATUS_STYLE.disconnected
                const label = statusLabels[entry.status] ?? entry.status
                return (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.color}`} />
                    <span className="text-gray-700">{label}</span>
                    <span className="text-gray-400 ml-auto">{formatTime(entry.timestamp)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </details>
      )}
    </div>
  )
}
