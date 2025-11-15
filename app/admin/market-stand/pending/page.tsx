import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { columns } from './columns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPendingStands() {
  const stands = await prisma.marketStand.findMany({
    where: {
      status: 'PENDING',
      isActive: true
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return stands
}

export default async function PendingStandsPage() {
  const stands = await getPendingStands()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Market Stands</h1>
          <p className="text-gray-500 mt-1">Review and approve market stand submissions</p>
        </div>
        <div className="text-sm text-gray-500">
          {stands.length} pending
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent>
          {stands.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending market stands to review
            </div>
          ) : (
            <DataTable columns={columns} data={stands} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
