import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Home = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col items-center justify-center">
    <h1 className="text-4xl font-bold mb-8 text-green-700">Welcome to Lesson Spark Educator Hub</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Lesson & Exam Generator</CardTitle>
        </CardHeader>
        <CardContent>
          Generate lesson plans and exams using AI-powered tools. Upload .docx files and get instant content.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Messaging & Collaboration</CardTitle>
        </CardHeader>
        <CardContent>
          Admins and teachers can communicate, broadcast messages, and collaborate in real time.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Online Presence & Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          Track which teachers are online, review submissions, and manage your team efficiently.
        </CardContent>
      </Card>
    </div>
    <div className="flex gap-4">
      <Link to="/login"><Button variant="outline">Login</Button></Link>
      <Link to="/register"><Button variant="outline">Signup</Button></Link>
    </div>
  </div>
);

export default Home;
