"use client"

import { ColumnDef } from "@tanstack/react-table"

type ProducerStat = {
  id: string
  standName: string
  ownerName: string
  products: number
  totalOrders: number
  revenue: number
  averageRating: number | null
  totalReviews: number
}

export const producerColumns: ColumnDef<ProducerStat>[] = [
  {
    accessorKey: "standName",
    header: "Market Stand",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.standName}</span>
        <span className="text-sm text-gray-500">{row.original.ownerName}</span>
      </div>
    )
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.products}</div>
    )
  },
  {
    accessorKey: "totalOrders",
    header: "Orders",
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.totalOrders}</div>
    )
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: ({ row }) => {
      const revenue = row.original.revenue
      return (
        <div className="font-medium text-green-600">
          ${(revenue / 100).toFixed(2)}
        </div>
      )
    }
  },
  {
    accessorKey: "averageRating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.original.averageRating
      const reviews = row.original.totalReviews
      if (!rating || reviews === 0) {
        return <span className="text-sm text-gray-400">No reviews</span>
      }
      return (
        <div className="text-sm">
          {rating.toFixed(1)}/5 <span className="text-gray-500">({reviews})</span>
        </div>
      )
    }
  }
]
