import React, { useState, useEffect } from 'react';
import * as mammoth from 'mammoth';
import { Link } from 'react-router-dom';
import { ArrowDown, BookOpen, Upload, FileText, Download, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { generateLessonPlan as apiGenerateLessonPlan } from '../apiService.js';

// ErrorBoundary for catching render errors
class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <div>Error generating lesson plan</div>;
    return this.props.children;
  }
}

console.log('Mammoth:', mammoth); // Check if Mammoth.js is loaded

const LessonPlanGenerator = () => {
  const [lessonContent, setLessonContent] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [duration, setDuration] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<any>(null); // For debug state

  useEffect(() => {
    console.log('Lesson Plan State:', lessonPlan);
  }, [lessonPlan]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Selected file:', file); // Debug file
    if (file) {
      setUploading(true);
      setUploadedFileName('');
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setLessonContent(e.target?.result as string);
          setUploadedFileName(file.name);
          setUploading(false);
          toast.success('Text file uploaded successfully!');
        };
        reader.onerror = (e) => {
          setUploading(false);
          toast.error('Failed to read text file: ' + (e.target?.error?.message || 'Unknown error'));
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.docx')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          console.log('ArrayBuffer:', arrayBuffer); // Debug ArrayBuffer
          const result = await mammoth.extractRawText({ arrayBuffer });
          setLessonContent(result.value);
          setUploadedFileName(file.name);
          setUploading(false);
          toast.success('Word (.docx) file uploaded and converted!');
        } catch (err: any) {
          setUploading(false);
          console.error('Full error:', err);
          toast.error('Failed to extract text from .docx file: ' + (err.message || err.toString()));
        }
      } else {
        setUploading(false);
        toast.error('Only .txt or .docx files are supported.');
        event.target.value = '';
      }
    }
  };

  // Use environment variable for API endpoint (runtime-aware)
  const BUILD_API = import.meta.env.VITE_API_URL || '';
  function getApiBaseLocal() {
    try {
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const isLocalHostBuild = BUILD_API.includes('localhost') || BUILD_API.includes('127.0.0.1');
        const runningLocally = host === 'localhost' || host === '127.0.0.1';
        if (isLocalHostBuild && !runningLocally) return '/api';
      }
    } catch (e) {
      // ignore
    }
    return BUILD_API || '/api';
  }

  const generateLessonPlan = async () => {
    if (!lessonContent.trim()) {
      toast.error('Please provide lesson content or upload a file');
      return;
    }
    setIsGenerating(true);
    try {
      // Compose the prompt for OpenAI
      const prompt = `Subject: ${subject}\nGrade: ${grade}\nDuration: ${duration}\nContent: ${lessonContent}`;
      const data = await apiGenerateLessonPlan(prompt);
      console.log('API raw response:', data); // Debug output
      let plan = data.lessonPlan || data.result;
      if (!plan) {
        plan = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        toast.warning('Unexpected API response format. Showing raw response.');
      }
      setGeneratedPlan(plan);
      setLessonPlan(data); // Debug state
      toast.success('Lesson plan generated successfully!');
    } catch (err: any) {
      console.error('API Error:', err);
      toast.error('Failed to generate lesson plan: ' + (err.message || err.toString()));
    }
    setIsGenerating(false);
  };

  const downloadPlan = () => {
    if (!generatedPlan) return;
    
    const blob = new Blob([generatedPlan], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-plan-${subject || 'untitled'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Lesson plan downloaded!');
  };

  const submitToAdmin = async () => {
    if (!generatedPlan) return;
    try {
      const base = getApiBaseLocal();
      const response = await fetch(`${base}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lesson-plan',
          title: `${subject} Lesson Plan`,
          subject,
          grade,
          content: generatedPlan,
          teacher: 'Current Teacher' // Replace with real user if available
        })
      });
      const data = await response.json();
      toast.success(`Lesson plan submitted to admin for review!\nSubmitted at: ${data.created}`);
    } catch (err) {
      toast.error('Failed to submit lesson plan.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">EduPlan Pro</h1>
            </Link>
            <Link to="/">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Lesson Plan Generator</h2>
          <p className="text-gray-600">Create comprehensive lesson plans with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Lesson Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade/Class</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Grade 1</SelectItem>
                      <SelectItem value="2">Grade 2</SelectItem>
                      <SelectItem value="3">Grade 3</SelectItem>
                      <SelectItem value="4">Grade 4</SelectItem>
                      <SelectItem value="5">Grade 5</SelectItem>
                      <SelectItem value="6">Grade 6</SelectItem>
                      <SelectItem value="7">Grade 7</SelectItem>
                      <SelectItem value="8">Grade 8</SelectItem>
                      <SelectItem value="9">Grade 9</SelectItem>
                      <SelectItem value="10">Grade 10</SelectItem>
                      <SelectItem value="11">Grade 11</SelectItem>
                      <SelectItem value="12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Lesson Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="file-upload">Upload Lesson Notes (Optional)</Label>
                <div className="mt-2">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">TXT, DOC, DOCX up to 10MB</p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".txt,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                {uploading && <div className="text-blue-600 text-sm mt-2">Uploading...</div>}
                {uploadedFileName && <div className="text-green-600 text-sm mt-2">Uploaded: {uploadedFileName}</div>}
              </div>

              {/* Text Input */}
              <div>
                <Label htmlFor="lesson-content">Or Paste Your Lesson Content</Label>
                <Textarea
                  id="lesson-content"
                  placeholder="Paste your lesson notes, topics, or content here..."
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  rows={10}
                  className="mt-2"
                />
              </div>

              {lessonContent && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-800 max-h-40 overflow-y-auto">
                  <strong>Preview:</strong>
                  <pre className="whitespace-pre-wrap">{lessonContent}</pre>
                </div>
              )}

              <Button 
                onClick={generateLessonPlan} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Generate Lesson Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <ArrowDown className="h-6 w-6 mr-2 text-green-600" />
                  Generated Lesson Plan
                </span>
                {generatedPlan && (
                  <div className="flex space-x-2">
                    <Button onClick={downloadPlan} size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button onClick={submitToAdmin} size="sm" variant="outline">
                      <Send className="h-4 w-4 mr-1" />
                      Submit to Admin
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedPlan ? (
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {generatedPlan}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center h-96 flex items-center justify-center">
                  <div>
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your generated lesson plan will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LessonPlanGenerator;

// Usage: <ErrorBoundary><LessonPlanGenerator /></ErrorBoundary>
