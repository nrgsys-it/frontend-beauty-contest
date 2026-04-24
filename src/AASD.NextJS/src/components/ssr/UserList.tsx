import { prisma } from '@/lib/prisma'

export default async function UserList() {
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, name: true, surname: true, email: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4">Recent Users</h3>
      {users.length === 0 ? (
        <p className="text-sm text-gray-400">No users yet</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs flex-shrink-0">
                {u.name[0]}{u.surname[0]}
              </div>
              <div>
                <div className="text-gray-800 font-medium">{u.name} {u.surname}</div>
                <div className="text-gray-400 text-xs">{u.email}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-400 mt-4 pt-3 border-t">
        ⚡ Fetched server-side - zero client JS
      </p>
    </div>
  )
}
