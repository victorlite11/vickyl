import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Music, Settings, User, Download as DownloadIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import MessageInbox from './MessageInbox';
import TeacherChatPanel from './TeacherChatPanel';
import ExamRecords from './ExamRecords';

const fetchDashboardStats = async () => {
  const res = await fetch('http://localhost:4000/api/stats');
  return await res.json();
};

const fetchRecentActivity = async () => {
  const res = await fetch('http://localhost:4000/api/recent');
  return await res.json();
};

const Dashboard = () => {
  // School quota usage state
  const [schoolQuota, setSchoolQuota] = React.useState<{ quota: number; used: number; active: number } | null>(null);
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:4000/api/school-quota', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setSchoolQuota({ quota: data.quota, used: data.used, active: data.active }))
      .catch(() => setSchoolQuota(null));
  }, []);
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: fetchRecentActivity,
  });

  // Export to CSV
  const exportCSV = () => {
    const rows = [
      ['ID', 'Type', 'Title', 'Created'],
      ...recentActivity.map(s => [s.id, s.type, s.title, s.created])
    ];
    const csv = rows.map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recent-activity.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download content (for future detail view)
  const downloadContent = (item) => {
    if (!item || !item.content) return;
    const blob = new Blob([item.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get teacher name from localStorage token
  let teacherName = '';
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      teacherName = payload.name || '';
    }
  } catch {}

  useEffect(() => {
    if (teacherName) {
      window.speechSynthesis.cancel();
      const msg = new window.SpeechSynthesisUtterance(`Welcome back, ${teacherName}!`);
      msg.rate = 0.8;
      msg.volume = 1;
      msg.pitch = 1;
      window.speechSynthesis.speak(msg);
    }
  }, [teacherName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="mb-4 flex justify-end">
                <Button variant="outline" onClick={() => window.location.href = '/login'}>Back to Login/Signup</Button>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">EduPlan Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              {/* Admin button removed for teachers */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {teacherName || 'Teacher'}!</h2>
          <p className="text-gray-600 text-lg">Create amazing lesson plans and exams with AI assistance</p>
          <div className="mt-4 flex gap-2">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition" onClick={() => window.location.href = '/meeting'}>
              Staff Video Meeting
            </Button>
          </div>
          {schoolQuota && (
            <div className="mt-6">
              <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow p-4 border">
                <h3 className="text-lg font-bold mb-2 text-blue-700">School Quota Usage</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Questions left:</span>
                  <span className={`font-bold text-lg ${schoolQuota.quota - schoolQuota.used <= 10 ? 'text-red-600' : 'text-green-700'}`}>{schoolQuota.active ? schoolQuota.quota - schoolQuota.used : 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className={`h-4 rounded-full ${schoolQuota.active ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, (schoolQuota.used / schoolQuota.quota) * 100)}%` }}
                  />
                </div>
                {!schoolQuota.active && (
                  <div className="text-red-600 font-semibold mt-2">School quota expired. Please contact your admin to renew.</div>
                )}
                {schoolQuota.active && schoolQuota.quota - schoolQuota.used <= 10 && (
                  <div className="text-yellow-600 font-semibold mt-2">Warning: School quota is low. Please notify your admin.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-blue-100">Lesson Plans</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.lessonPlans ?? '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-green-100">Exams Created</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.exams ?? '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <DownloadIcon className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-purple-100">Downloads</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.downloads ?? '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Music className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-orange-100">Music Sessions</p>
                  <p className="text-2xl font-bold">
                    {statsLoading ? '...' : stats?.musicSessions ?? '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lesson Plan Generator */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <BookOpen className="h-6 w-6 mr-3 text-blue-600" />
                Lesson Plan Generator
              </CardTitle>
              <CardDescription>
                Create comprehensive lesson plans with AI assistance. Upload your notes or paste content directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">AI-Powered</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">File Upload</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Templates</span>
                </div>
                <Link to="/lesson-plan">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Start Creating
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Exam Generator */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <FileText className="h-6 w-6 mr-3 text-green-600" />
                Exam Generator
              </CardTitle>
              <CardDescription>
                Generate exams with multiple choice and theory questions for various standards and grades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">IGCSE</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">WAEC</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Custom</span>
                </div>
                <Link to="/exam-generator">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Create Exam
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest lesson plans and exams</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Export CSV for recent activity */}
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <Button onClick={exportCSV} size="sm" variant="outline">
                <DownloadIcon className="h-4 w-4 mr-1" /> Export Recent Activity CSV
              </Button>
            </div>

            {activityLoading ? (
              <div>Loading...</div>
            ) : activityError ? (
              <div className="text-red-500">Error loading activity.</div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(recentActivity) && recentActivity.length > 0 ? (
                  recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.type === 'lesson-plan' ? (
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-green-600" />
                        )}
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-gray-500">Created {item.created}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/activity/${item.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => downloadContent(item)}>
                          <DownloadIcon className="h-4 w-4 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>No recent activity found.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Inbox and Chat side-by-side */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <MessageInbox token={localStorage.getItem('token')} />
          </div>
          <div>
            <TeacherChatPanel />
          </div>
        </div>

  {/* Exam Records Section */}
  <ExamRecords />
      </main>
    </div>
  );
};

export default Dashboard;
