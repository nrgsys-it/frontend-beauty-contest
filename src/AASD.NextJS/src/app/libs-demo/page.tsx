import type { Metadata } from 'next'
import MotionDemo from '@/components/libs/MotionDemo'
import ShadcnDemo from '@/components/libs/ShadcnDemo'
import TanStackQueryDemo from '@/components/libs/TanStackQueryDemo'
import ZodDemo from '@/components/libs/ZodDemo'
import ZustandDemo from '@/components/libs/ZustandDemo'
import QueryProvider from '@/components/providers/QueryProvider'

export const metadata: Metadata = { title: 'Libraries Demo' }

export default function LibsDemoPage() {
  return (
    <QueryProvider>
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Libraries Demo</h1>
          <p className="text-gray-500">
            Live demonstrations of the selected React/Next.js ecosystem libraries.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-1">1. Zustand - Global State</h2>
          <p className="text-sm text-gray-500 mb-4">
            ~57k star - ~32M downloads/week - RSC-compatible (client-side)
          </p>
          <ZustandDemo />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-1">2. TanStack Query v5 - Data Fetching</h2>
          <p className="text-sm text-gray-500 mb-4">~49k star - ~49M downloads/week - Client-side cache</p>
          <TanStackQueryDemo />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-1">3. Motion (Framer Motion) - Animations</h2>
          <p className="text-sm text-gray-500 mb-4">~31k star - ~40M downloads/week - Client Component only</p>
          <MotionDemo />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-1">4. shadcn/ui - Component Library</h2>
          <p className="text-sm text-gray-500 mb-4">~78k star - Copy-paste model (not a package) - RSC-first</p>
          <ShadcnDemo />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-1">5. Zod - Schema Validation</h2>
          <p className="text-sm text-gray-500 mb-4">~34k star - ~12M downloads/week - Works everywhere</p>
          <ZodDemo />
        </section>
      </div>
    </QueryProvider>
  )
}
