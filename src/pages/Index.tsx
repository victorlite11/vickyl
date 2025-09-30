
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardHome from './DashboardHome';
import Dashboard from '../components/Dashboard';
import LessonPlanGenerator from '../components/LessonPlanGenerator';
import ExamGenerator from '../components/ExamGenerator';
import AdminPanel from '../components/AdminPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import MusicPlayer from '../components/MusicPlayer';
import Login from './Login';
import Register from './Register';
import NotFound from './NotFound';
import MeetingPage from './MeetingPage';

const queryClient = new QueryClient();

const Index = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Router>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lesson-plan" element={<LessonPlanGenerator />} />
            <Route path="/exam-generator" element={<ExamGenerator />} />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/meeting" element={<MeetingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MusicPlayer />
        </Router>
      </div>
    </QueryClientProvider>
  );
};

export default Index;
