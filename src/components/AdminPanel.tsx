import ChatPanel from './ChatPanel';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, FileText, BookOpen, CheckCircle, XCircle, Eye, Video, Bell } from 'lucide-react';
import JitsiMeeting from './JitsiMeeting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, Bar } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Submission {
  id: string;
  teacher: string;
  type: 'lesson-plan' | 'exam';
  subject: string;
  grade: string;
  title: string;
  submitted: string;
  status: 'pending' | 'approved' | 'rejected';
  content: string;
}
function AdminPanel() {
  // Staff and submissions state
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [subError, setSubError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Notifications state
  // Add Staff Modal State
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [addStaffForm, setAddStaffForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastSubmissionIds, setLastSubmissionIds] = useState<string[]>([]);
  const [lastMessageIds, setLastMessageIds] = useState<string[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unreadNotificationIds');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  // Save unreadIds to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('unreadNotificationIds', JSON.stringify(unreadIds));
  }, [unreadIds]);

  // Mark new notifications as unread
  useEffect(() => {
    if (notifications.length > 0) {
      const newUnread = notifications
        .filter((n) => !unreadIds.includes(n.id))
        .map((n) => n.id);
      if (newUnread.length > 0) {
        setUnreadIds((prev) => [...newUnread, ...prev]);
      }
    }
  }, [notifications]);
  // Poll for new messages every 30 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:4000/api/messages', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          const newIds = data.map((m: any) => m.id?.toString() ?? '');
          // Find new messages
          const newOnes = data.filter((m: any) => !lastMessageIds.includes(m.id?.toString() ?? ''));
          if (lastMessageIds.length > 0 && newOnes.length > 0) {
            setNotifications((prev) => [
              ...newOnes.map((m: any) => ({
                id: `msg-${m.id}`,
                type: 'message',
                message: `New message from ${m.sender || 'Unknown'}`,
                time: new Date().toLocaleTimeString()
              })),
              ...prev
            ]);
          }
          setLastMessageIds(newIds);
        }
      } catch {}
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [lastMessageIds]);
  // Poll for new submissions every 30 seconds
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/submissions');
        const data = await res.json();
        if (Array.isArray(data)) {
          setSubmissions(data);
          const newIds = data.map((s: any) => s.id?.toString() ?? '');
          // Find new submissions
          const newOnes = data.filter((s: any) => !lastSubmissionIds.includes(s.id?.toString() ?? ''));
          if (lastSubmissionIds.length > 0 && newOnes.length > 0) {
            setNotifications((prev) => [
              ...newOnes.map((s: any) => ({
                id: `sub-${s.id}`,
                type: 'submission',
                message: `New submission from user ${s.userId || s.teacher || 'Unknown'}`,
                time: new Date().toLocaleTimeString()
              })),
              ...prev
            ]);
          }
          setLastSubmissionIds(newIds);
        }
      } catch {}
      setLoadingSubs(false);
    };
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 30000);
    return () => clearInterval(interval);
  }, [lastSubmissionIds]);

  // Fetch teachers
  useEffect(() => {
    setLoadingTeachers(true);
    fetch('http://localhost:4000/api/teachers')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch teachers');
        setTeachers(await res.json());
        setTeacherError(null);
      })
      .catch(err => {
        setTeacherError(err.message || 'Failed to fetch teachers');
        setTeachers([]);
      })
      .finally(() => setLoadingTeachers(false));
  }, []);


  // Meeting state
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [roomName, setRoomName] = useState('');

  // Show notifications state
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = unreadIds.length;
  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
    // Mark all as read when opening
    if (unreadIds.length > 0) {
      setUnreadIds([]);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'approved' })
      });
      if (!res.ok) throw new Error('Failed to approve submission');
      // Update UI
      setSubmissions(subs => subs.map(s => s.id === id ? { ...s, status: 'approved' } : s));
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status: 'approved' });
      }
      toast.success('Submission approved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve submission');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (!res.ok) throw new Error('Failed to reject submission');
      // Update UI
      setSubmissions(subs => subs.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission({ ...selectedSubmission, status: 'rejected' });
      }
      toast.success('Submission rejected.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject submission');
    }
  };

  const pendingSubmissions = Array.isArray(submissions) ? submissions.filter(s => s.status === 'pending') : [];
  const reviewedSubmissions = Array.isArray(submissions) ? submissions.filter(s => s.status !== 'pending') : [];

  // --- Analytics Data Preparation ---
  // Prepare data for last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const submissionsByDay = days.map(day => ({
    day,
    submissions: submissions.filter(s => s.submitted && s.submitted.startsWith(day)).length,
    approved: submissions.filter(s => s.submitted && s.submitted.startsWith(day) && s.status === 'approved').length,
    rejected: submissions.filter(s => s.submitted && s.submitted.startsWith(day) && s.status === 'rejected').length,
  }));
  const activeTeachers = Array.isArray(teachers) ? teachers.filter(t => t.role === 'teacher').length : 0;

  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <User className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </Link>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  className="relative focus:outline-none"
                  onClick={handleBellClick}
                  aria-label="Show notifications"
                >
                  <Bell className="h-7 w-7 text-blue-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b font-bold text-gray-700">Notifications</div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-gray-500">No notifications</div>
                    ) : notifications.map((n) => (
                      <div key={n.id} className={`p-4 border-b last:border-b-0 hover:bg-gray-50 ${unreadIds.includes(n.id) ? 'bg-red-50' : ''}`}>
                        <div className="font-semibold">{n.message}</div>
                        <div className="text-xs text-gray-400 mt-1">{n.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Link to="/">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-yellow-100">Pending Reviews</p>
                  {loadingSubs ? (
                    <p className="text-2xl font-bold">Loading...</p>
                  ) : subError ? (
                    <p className="text-xs text-red-600">{subError}</p>
                  ) : (
                    <p className="text-2xl font-bold">{pendingSubmissions.length}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-green-100">Approved</p>
                  {loadingSubs ? (
                    <p className="text-2xl font-bold">Loading...</p>
                  ) : subError ? (
                    <p className="text-xs text-red-600">{subError}</p>
                  ) : (
                    <p className="text-2xl font-bold">{reviewedSubmissions.filter(s => s.status === 'approved').length}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-red-100">Rejected</p>
                  {loadingSubs ? (
                    <p className="text-2xl font-bold">Loading...</p>
                  ) : subError ? (
                    <p className="text-xs text-red-600">{subError}</p>
                  ) : (
                    <p className="text-2xl font-bold">{reviewedSubmissions.filter(s => s.status === 'rejected').length}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-blue-100">Active Teachers</p>
                  {loadingTeachers ? (
                    <p className="text-2xl font-bold">Loading...</p>
                  ) : teacherError ? (
                    <p className="text-xs text-red-600">{teacherError}</p>
                  ) : Array.isArray(teachers) ? (
                    <p className="text-2xl font-bold">{teachers.filter(t => t.role === 'teacher').length}</p>
                  ) : (
                    <p className="text-xs text-red-600">Teacher data is not available.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Video Meeting Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Video className="mr-2" /> Staff Video Meeting</CardTitle>
            </CardHeader>
            <CardContent>
              {!meetingStarted ? (
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <input
                    type="text"
                    className="border rounded px-3 py-2 w-full md:w-1/2"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder="Meeting Room Name"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setMeetingStarted(true)}>
                    Start Meeting
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-4 mb-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = `https://meet.jit.si/${roomName}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Join link copied!');
                      }}
                    >
                      Copy Join Link
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setMeetingStarted(false)}
                    >
                      End Meeting
                    </Button>
                  </div>
                  <JitsiMeeting roomName={roomName} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Staff Management Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Staff Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-semibold">All Staff</div>
                <Button variant="outline" onClick={() => setShowAddStaff(true)}>Add Staff</Button>
              {/* Add Staff Modal */}
              {showAddStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowAddStaff(false)}>&times;</button>
                    <h2 className="text-xl font-bold mb-4">Add Staff</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setAddStaffLoading(true);
                      try {
                        const res = await fetch('http://localhost:4000/api/register', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(addStaffForm)
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Failed to add staff');
                        toast.success('Staff added successfully!');
                        setShowAddStaff(false);
                        setAddStaffForm({ name: '', email: '', password: '', role: 'teacher' });
                        // Refresh staff list
                        setLoadingTeachers(true);
                        fetch('http://localhost:4000/api/teachers')
                          .then(async res => {
                            if (!res.ok) return setTeachers([]);
                            try { setTeachers(await res.json()); } catch { setTeachers([]); }
                            setLoadingTeachers(false);
                          });
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to add staff');
                      } finally {
                        setAddStaffLoading(false);
                      }
                    }}>
                      <div className="mb-3">
                        <label className="block mb-1 font-medium">Name</label>
                        <input type="text" className="border rounded px-3 py-2 w-full" required value={addStaffForm.name} onChange={e => setAddStaffForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="mb-3">
                        <label className="block mb-1 font-medium">Email</label>
                        <input type="email" className="border rounded px-3 py-2 w-full" required value={addStaffForm.email} onChange={e => setAddStaffForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                      <div className="mb-3">
                        <label className="block mb-1 font-medium">Password</label>
                        <input type="password" className="border rounded px-3 py-2 w-full" required value={addStaffForm.password} onChange={e => setAddStaffForm(f => ({ ...f, password: e.target.value }))} />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium">Role</label>
                        <select className="border rounded px-3 py-2 w-full" value={addStaffForm.role} onChange={e => setAddStaffForm(f => ({ ...f, role: e.target.value }))}>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <Button type="submit" className="w-full" disabled={addStaffLoading}>{addStaffLoading ? 'Adding...' : 'Add Staff'}</Button>
                    </form>
                  </div>
                </div>
              )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Role</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id} className="border-b">
                        <td className="px-4 py-2">{t.name || t.fullName || t.username || 'N/A'}</td>
                        <td className="px-4 py-2">{t.email || 'N/A'}</td>
                        <td className="px-4 py-2">{t.role || 'N/A'}</td>
                        <td className="px-4 py-2">
                          <Button size="sm" variant="outline" className="mr-2" onClick={() => alert('Edit Staff (to be implemented)')}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            if (!window.confirm('Are you sure you want to remove this staff member?')) return;
                            try {
                              const res = await fetch(`http://localhost:4000/api/users/${t.id}`, {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' }
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error || 'Failed to remove staff');
                              toast.success('Staff removed successfully!');
                              // Refresh staff list
                              setLoadingTeachers(true);
                              fetch('http://localhost:4000/api/teachers')
                                .then(async res => {
                                  if (!res.ok) return setTeachers([]);
                                  try { setTeachers(await res.json()); } catch { setTeachers([]); }
                                  setLoadingTeachers(false);
                                });
                            } catch (err: any) {
                              toast.error(err.message || 'Failed to remove staff');
                            }
                          }}>Remove</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Panel Section */}
        <ChatPanel teachers={teachers} />

        {/* Submissions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pending ({pendingSubmissions.length})</TabsTrigger>
                    <TabsTrigger value="reviewed">Reviewed ({reviewedSubmissions.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pending" className="space-y-4 mt-6">
                    {loadingSubs ? (
                      <div>Loading...</div>
                    ) : subError ? (
                      <div className="text-red-600">{subError}</div>
                    ) : pendingSubmissions.map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {submission.type === 'lesson-plan' ? (
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              ) : (
                                <FileText className="h-4 w-4 text-green-600" />
                              )}
                              <h3 className="font-semibold">{submission.title}</h3>
                              <Badge variant="secondary">
                                {submission.type === 'lesson-plan' ? 'Lesson Plan' : 'Exam'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {submission.teacher} • {submission.subject} Grade {submission.grade}
                            </p>
                            <p className="text-xs text-gray-500">Submitted {submission.submitted}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(submission.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleReject(submission.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="reviewed" className="space-y-4 mt-6">
                    {loadingSubs ? (
                      <div>Loading...</div>
                    ) : subError ? (
                      <div className="text-red-600">{subError}</div>
                    ) : reviewedSubmissions.map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {submission.type === 'lesson-plan' ? (
                                <BookOpen className="h-4 w-4 text-blue-600" />
                              ) : (
                                <FileText className="h-4 w-4 text-green-600" />
                              )}
                              <h3 className="font-semibold">{submission.title}</h3>
                              <Badge 
                                variant={submission.status === 'approved' ? 'default' : 'destructive'}
                              >
                                {submission.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {submission.teacher} • {submission.subject} Grade {submission.grade}
                            </p>
                            <p className="text-xs text-gray-500">Submitted {submission.submitted}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSubmission ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedSubmission.title}</h3>
                      <p className="text-sm text-gray-600">
                        by {selectedSubmission.teacher}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <Badge variant="outline">{selectedSubmission.subject}</Badge>
                        <Badge variant="outline">Grade {selectedSubmission.grade}</Badge>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700">{selectedSubmission.content}</p>
                    </div>
                    {selectedSubmission.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(selectedSubmission.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 text-red-600 hover:text-red-700"
                          onClick={() => handleReject(selectedSubmission.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select a submission to preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
