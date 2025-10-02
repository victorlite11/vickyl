import React, { useState, useRef } from 'react';
import * as mammoth from 'mammoth';
import { Link } from 'react-router-dom';
import { FileText, Download, Send, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { generateLessonPlan as apiGenerateLessonPlan } from '../apiService.js';

const ExamGenerator = () => {
  const [examDetails, setExamDetails] = useState({
    subject: '',
    grade: '',
    standard: '',
    duration: '',
    totalMarks: '',
    objectiveQuestions: 20,
    theoryQuestions: 5,
    customStandard: ''
  });
  
  const [generatedExam, setGeneratedExam] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeObjective, setIncludeObjective] = useState(true);
  const [includeTheory, setIncludeTheory] = useState(true);
  const [lessonContent, setLessonContent] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDetailChange = (field: string, value: string | number) => {
    setExamDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
          const result = await mammoth.extractRawText({ arrayBuffer });
          setLessonContent(result.value);
          setUploadedFileName(file.name);
          setUploading(false);
          toast.success('Word (.docx) file uploaded and converted!');
        } catch (err: any) {
          setUploading(false);
          toast.error('Failed to extract text from .docx file: ' + (err.message || err.toString()));
        }
      } else {
        setUploading(false);
        toast.error('Only .txt or .docx files are supported.');
        event.target.value = '';
      }
    }
  };

  const generateExam = async () => {
    if (!lessonContent.trim()) {
      toast.error('Please provide lesson content or upload a file');
      return;
    }
    setIsGenerating(true);
    try {
      // Compose the prompt for OpenAI
      const prompt = `Subject: ${examDetails.subject}\nGrade: ${examDetails.grade}\nStandard: ${examDetails.standard || examDetails.customStandard}\nDuration: ${examDetails.duration}\nTotal Marks: ${examDetails.totalMarks}\nObjective Questions: ${includeObjective ? examDetails.objectiveQuestions : 0}\nTheory Questions: ${includeTheory ? examDetails.theoryQuestions : 0}\nContent: ${lessonContent}`;
      const data = await apiGenerateLessonPlan(prompt);
      setGeneratedExam(data.lessonPlan || data.result || 'No exam generated.');
      toast.success('Exam generated successfully!');
    } catch (err: any) {
      console.error('API Error:', err);
      toast.error('Failed to generate exam: ' + (err.message || err.toString()));
    }
    setIsGenerating(false);
  };

  const downloadExam = () => {
    if (!generatedExam) return;
    
    const blob = new Blob([generatedExam], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examDetails.subject}-grade-${examDetails.grade}-exam.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exam downloaded!');
  };

  const submitToAdmin = async () => {
    if (!generatedExam) return;
    try {
  const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'exam',
          title: `${examDetails.subject} Exam`,
          subject: examDetails.subject,
          grade: examDetails.grade,
          content: generatedExam,
          teacher: 'Current Teacher' // Replace with real user if available
        })
      });
      const data = await response.json();
      toast.success(`Exam submitted to admin for review!\nSubmitted at: ${data.created}`);
    } catch (err) {
      toast.error('Failed to submit exam.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-green-600" />
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Exam Generator</h2>
          <p className="text-gray-600">Create comprehensive exams with AI assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 mr-2 text-green-600" />
                Exam Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload for Lesson Notes */}
              <div>
                <Label htmlFor="file-upload">Upload Lesson Notes (Optional)</Label>
                <div className="mt-2">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">TXT, DOCX up to 10MB</p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".txt,.docx"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                {uploading && <div className="text-green-600 text-sm mt-2">Uploading...</div>}
                {uploadedFileName && <div className="text-green-600 text-sm mt-2">Uploaded: {uploadedFileName}</div>}
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Mathematics"
                    value={examDetails.subject}
                    onChange={(e) => handleDetailChange('subject', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade/Class</Label>
                  <Select value={examDetails.grade} onValueChange={(value) => handleDetailChange('grade', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 12}, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>Grade {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exam Standard */}
              <div>
                <Label>Exam Standard</Label>
                <Select value={examDetails.standard} onValueChange={(value) => handleDetailChange('standard', value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select standard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="igcse">IGCSE Standard</SelectItem>
                    <SelectItem value="waec">WAEC Standard</SelectItem>
                    <SelectItem value="both">Both IGCSE & WAEC</SelectItem>
                    <SelectItem value="custom">Custom Standard</SelectItem>
                  </SelectContent>
                </Select>
                
                {examDetails.standard === 'custom' && (
                  <Input
                    placeholder="Enter custom standard details"
                    className="mt-2"
                    value={examDetails.customStandard}
                    onChange={(e) => handleDetailChange('customStandard', e.target.value)}
                  />
                )}
              </div>

              {/* Duration and Marks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="120"
                    value={examDetails.duration}
                    onChange={(e) => handleDetailChange('duration', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    placeholder="100"
                    value={examDetails.totalMarks}
                    onChange={(e) => handleDetailChange('totalMarks', e.target.value)}
                  />
                </div>
              </div>

              {/* Question Types */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Question Types</h3>
                
                {/* Objective Questions */}
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="objective" 
                    checked={includeObjective}
                    onCheckedChange={(checked) => setIncludeObjective(checked === true)}
                  />
                  <Label htmlFor="objective" className="flex-1">Multiple Choice Questions (A-D)</Label>
                  {includeObjective && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDetailChange('objectiveQuestions', Math.max(1, examDetails.objectiveQuestions - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-center">{examDetails.objectiveQuestions}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDetailChange('objectiveQuestions', examDetails.objectiveQuestions + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Theory Questions */}
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="theory" 
                    checked={includeTheory}
                    onCheckedChange={(checked) => setIncludeTheory(checked === true)}
                  />
                  <Label htmlFor="theory" className="flex-1">Theory Questions</Label>
                  {includeTheory && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDetailChange('theoryQuestions', Math.max(1, examDetails.theoryQuestions - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-12 text-center">{examDetails.theoryQuestions}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDetailChange('theoryQuestions', examDetails.theoryQuestions + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={generateExam} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Exam...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Exam
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-blue-600" />
                  Generated Exam
                </span>
                {generatedExam && (
                  <div className="flex space-x-2">
                    <Button onClick={downloadExam} size="sm" variant="outline">
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
              {generatedExam ? (
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {generatedExam}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center h-96 flex items-center justify-center">
                  <div>
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your generated exam will appear here</p>
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

export default ExamGenerator;
