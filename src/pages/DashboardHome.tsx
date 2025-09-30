import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DashboardHome = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const msg = new window.SpeechSynthesisUtterance(
      'Welcome to Lesson Spark Educator Hub, brought to you by Creative Mind Technology. Empowering educators with artificial intelligence, collaboration, and smart tools for modern teaching. Work smart, teach intelligently, and relax with music as you shape the future of education.'
    );
    msg.rate = 1;
    msg.pitch = 1.1;
    msg.lang = 'en-US';
    window.speechSynthesis.speak(msg);
  }, []);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-300 to-green-200">
      <div className="w-full max-w-3xl mx-auto text-center py-12">
        <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 drop-shadow-lg">Lesson Spark Educator Hub</h1>
        <p className="text-lg text-gray-700 mb-10 font-medium">Empowering educators with AI, collaboration, and smart tools for modern teaching.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="rounded-3xl shadow-xl bg-gradient-to-br from-green-100 via-white to-blue-100 border-0">
            <CardHeader className="flex flex-col items-center">
              <CardTitle className="text-xl font-bold text-green-700 mb-2">AI Lesson & Exam Generator</CardTitle>
              <span className="inline-block bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">Instant .docx Extraction</span>
            </CardHeader>
            <CardContent className="text-gray-700 font-medium">
              Generate lesson plans and exams using AI-powered tools. Upload .docx files and get instant content.
            </CardContent>
          </Card>
          <Card className="rounded-3xl shadow-xl bg-gradient-to-br from-purple-100 via-white to-blue-100 border-0">
            <CardHeader className="flex flex-col items-center">
              <CardTitle className="text-xl font-bold text-purple-700 mb-2">Messaging, Collaboration & Virtual Meetings</CardTitle>
              <span className="inline-block bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">Real-Time Chat & Video Meetings</span>
            </CardHeader>
            <CardContent className="text-gray-700 font-medium">
              Admins and teachers can communicate, broadcast messages, collaborate in real time, and join secure video meetings for staff collaboration.
            </CardContent>
          </Card>
          <Card className="rounded-3xl shadow-xl bg-gradient-to-br from-blue-100 via-white to-green-100 border-0">
            <CardHeader className="flex flex-col items-center">
              <CardTitle className="text-xl font-bold text-blue-700 mb-2">Online Presence & Tracking</CardTitle>
              <span className="inline-block bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-2">Live Status</span>
            </CardHeader>
            <CardContent className="text-gray-700 font-medium">
              Track which teachers are online, review submissions, and manage your team efficiently.
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-6 justify-center">
          <Button className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold shadow-lg hover:scale-105 transition" onClick={() => navigate('/login')}>Login</Button>
          <Button className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-green-500 text-white font-bold shadow-lg hover:scale-105 transition" onClick={() => navigate('/register')}>Signup</Button>
        </div>
      </div>
      <footer className="w-full text-center py-6 mt-8">
        <span className="text-gray-500 text-sm">Created by <span className="font-bold text-green-700">Creative Mind Technology</span></span>
      </footer>
    </div>
  );
};

export default DashboardHome;
