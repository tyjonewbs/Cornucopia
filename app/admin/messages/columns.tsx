"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: Date;
};

const getCategoryBadge = (category: string) => {
  const variants = {
    GENERAL: "bg-blue-100 text-blue-800",
    SUPPORT: "bg-orange-100 text-orange-800",
    FEEDBACK: "bg-purple-100 text-purple-800"
  };
  return variants[category as keyof typeof variants] || "bg-gray-100 text-gray-800";
};

const getStatusBadge = (status: string) => {
  const variants = {
    NEW: "bg-green-100 text-green-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    RESOLVED: "bg-blue-100 text-blue-800",
    CLOSED: "bg-gray-100 text-gray-800"
  };
  return variants[status as keyof typeof variants] || "bg-gray-100 text-gray-800";
};

const getPriorityBadge = (priority: string) => {
  const variants = {
    LOW: "bg-gray-100 text-gray-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-red-100 text-red-800"
  };
  return variants[priority as keyof typeof variants] || "bg-gray-100 text-gray-800";
};

export const columns: ColumnDef<ContactSubmission>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <div className="text-sm">{date.toLocaleDateString()}</div>;
    }
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-sm">{row.getValue("email")}</div>
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => {
      const subject = row.getValue("subject") as string;
      return (
        <div className="max-w-md truncate" title={subject}>
          {subject}
        </div>
      );
    }
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      return (
        <Badge className={getCategoryBadge(category)} variant="secondary">
          {category}
        </Badge>
      );
    }
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <Badge className={getPriorityBadge(priority)} variant="secondary">
          {priority}
        </Badge>
      );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge className={getStatusBadge(status)} variant="secondary">
          {status.replace("_", " ")}
        </Badge>
      );
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const message = row.original;
      return (
        <Link href={`/admin/messages/${message.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
        </Link>
      );
    }
  }
];
