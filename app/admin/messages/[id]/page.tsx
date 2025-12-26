"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Calendar, User, Tag } from 'lucide-react';
import { updateContactStatus, updateContactPriority, addAdminNotes } from '@/app/actions/contact';

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  userId: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

export default function MessageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [message, setMessage] = useState<ContactSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const fetchMessage = async () => {
    try {
      const response = await fetch(`/api/admin/messages/${id}`);
      if (!response.ok) throw new Error('Failed to fetch message');
      const data = await response.json();
      setMessage(data);
      setNotes(data.adminNotes || '');
    } catch (error) {
      toast.error('Failed to load message');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    const result = await updateContactStatus(id, newStatus as any);
    if (result.success) {
      toast.success('Status updated successfully');
      fetchMessage();
    } else {
      toast.error(result.error || 'Failed to update status');
    }
    setSaving(false);
  };

  const handlePriorityChange = async (newPriority: string) => {
    setSaving(true);
    const result = await updateContactPriority(id, newPriority as any);
    if (result.success) {
      toast.success('Priority updated successfully');
      fetchMessage();
    } else {
      toast.error(result.error || 'Failed to update priority');
    }
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    const result = await addAdminNotes(id, notes);
    if (result.success) {
      toast.success('Notes saved successfully');
      fetchMessage();
    } else {
      toast.error(result.error || 'Failed to save notes');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!message) {
    return <div className="text-center py-16">Message not found</div>;
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      GENERAL: "bg-blue-100 text-blue-800",
      SUPPORT: "bg-orange-100 text-orange-800",
      FEEDBACK: "bg-purple-100 text-purple-800"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      NEW: "bg-green-100 text-green-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      RESOLVED: "bg-blue-100 text-blue-800",
      CLOSED: "bg-gray-100 text-gray-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-red-100 text-red-800"
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Message Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl">{message.subject}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getCategoryColor(message.category)} variant="secondary">
                        {message.category}
                      </Badge>
                      <Badge className={getStatusColor(message.status)} variant="secondary">
                        {message.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(message.priority)} variant="secondary">
                        {message.priority} Priority
                      </Badge>
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{message.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${message.email}`} className="text-blue-600 hover:underline">
                    {message.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Message:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
              <CardDescription>Internal notes (not visible to user)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this message..."
                rows={6}
              />
              <Button onClick={handleSaveNotes} disabled={saving}>
                {saving ? 'Saving...' : 'Save Notes'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={message.status} onValueChange={handleStatusChange} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={message.priority} onValueChange={handlePriorityChange} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          {message.user && (
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{' '}
                    {message.user.firstName} {message.user.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{' '}
                    <a href={`mailto:${message.user.email}`} className="text-blue-600 hover:underline">
                      {message.user.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
