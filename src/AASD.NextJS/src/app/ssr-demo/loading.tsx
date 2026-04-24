export default function SsrDemoLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
