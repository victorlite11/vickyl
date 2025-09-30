import React, { useEffect, useState } from 'react';

const ExamRecords: React.FC = () => {
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);
  const [studentName, setStudentName] = useState('');
  const [subjectId, setSubjectId] = useState<number | string>('');
  const [records, setRecords] = useState<Array<any>>([]);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [termValues, setTermValues] = useState<Record<string, string>>({
    firstTermScore: '',
    firstTermCA: '',
    secondTermScore: '',
    secondTermCA: '',
    thirdTermScore: '',
    thirdTermCA: ''
  });
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token') || '';
  const DEFAULT_SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'History'];
  const isAuthenticated = Boolean(token && token.length > 10);

  useEffect(() => {
    fetchSubjects();
    fetchRecords();
    try {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setTeacherId(payload.id || null);
      }
    } catch (e) {}
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/subjects');
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } catch (e) {
      setSubjects([]);
    }
  };

  const addSubject = async () => {
    if (!isAuthenticated) return alert('You must be logged in to add a subject');
    if (!newSubjectName.trim()) return;
    try {
      const res = await fetch('http://localhost:4000/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newSubjectName.trim() })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return alert(body.error || 'Failed to add subject');
      const s = body;
      setNewSubjectName('');
      fetchSubjects();
      setSubjectId(s.id);
    } catch (e: any) {
      alert(e?.message || 'Failed to add subject');
    }
  };

  const seedDefaultSubjects = async () => {
    if (!isAuthenticated) return alert('You must be logged in to seed subjects');
    const defaults = ['Mathematics', 'English', 'Science', 'Social Studies', 'Computer Science', 'History'];
    try {
      for (const name of defaults) {
        const res = await fetch('http://localhost:4000/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name })
        });
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          console.warn('seed subject failed', name, b);
        }
      }
      fetchSubjects();
    } catch (e) {
      alert('Failed to seed default subjects');
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/exam-records', { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setRecords(Array.isArray(d) ? d : []);
    } catch (e) {
      setRecords([]);
    }
  };

  const validateScores = () => {
    const fields = [
      { key: 'firstTermScore', label: 'First term score' },
      { key: 'firstTermCA', label: 'First term CA' },
      { key: 'secondTermScore', label: 'Second term score' },
      { key: 'secondTermCA', label: 'Second term CA' },
      { key: 'thirdTermScore', label: 'Third term score' },
      { key: 'thirdTermCA', label: 'Third term CA' }
    ];
    for (const f of fields) {
      const v = termValues[f.key];
      if (!v) continue;
      const n = parseFloat(v);
      if (isNaN(n)) return `${f.label} must be a number`;
      if (n < 0 || n > 100) return `${f.label} must be between 0 and 100`;
    }
    return null;
  };

  const addRecord = async () => {
    setError(null);
    if (!studentName.trim() || !subjectId) return setError('Provide student name and select a subject');
    const vErr = validateScores();
    if (vErr) return setError(vErr);
    const payload = {
      teacherId,
      studentName,
      subjectId,
      firstTermScore: termValues.firstTermScore || 0,
      firstTermCA: termValues.firstTermCA || 0,
      secondTermScore: termValues.secondTermScore || 0,
      secondTermCA: termValues.secondTermCA || 0,
      thirdTermScore: termValues.thirdTermScore || 0,
      thirdTermCA: termValues.thirdTermCA || 0
    };
    try {
      const res = await fetch('http://localhost:4000/api/exam-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save record');
      setStudentName('');
      setTermValues({ firstTermScore: '', firstTermCA: '', secondTermScore: '', secondTermCA: '', thirdTermScore: '', thirdTermCA: '' });
      fetchRecords();
    } catch (e: any) {
      setError(e?.message || 'Failed to save record');
    }
  };

  const exportCSV = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/exam-records/export/csv', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return alert('Failed to export CSV');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exam-records.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Student Exam Records Scores</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Subjects</h3>
          <div className="space-y-2">
            {subjects.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">No subjects yet. You can add one or seed common subjects.</div>
            ) : (
              subjects.map(s => (
                <div key={s.id} className={`p-2 border rounded ${String(s.id) === String(subjectId) ? 'bg-blue-50' : ''}`} onClick={() => setSubjectId(s.id)}>
                  {s.name}
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="New subject" className="w-full p-2 border rounded" />
            <button onClick={addSubject} disabled={!isAuthenticated} className={`mt-2 w-full p-2 rounded ${isAuthenticated ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Add Subject</button>
            {subjects.length === 0 && (
              <button onClick={seedDefaultSubjects} disabled={!isAuthenticated} className={`mt-2 w-full p-2 rounded ${isAuthenticated ? 'bg-gray-200 text-gray-800' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Seed default subjects</button>
            )}
            {!isAuthenticated && (
              <div className="mt-2 text-sm text-yellow-700">Log in to add or seed subjects (open Login page and sign in).</div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Add Record</h3>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Student name" className="p-2 border rounded" />
            <select value={subjectId} onChange={e => {
              const v = e.target.value;
              // if backend subjects exist, value will be numeric id
              if (subjects.length > 0) setSubjectId(Number(v));
              else setSubjectId(v); // selected default name (string)
            }} className="p-2 border rounded">
              <option value="">Select subject</option>
              {subjects.length > 0 ? (
                subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              ) : (
                DEFAULT_SUBJECTS.map(name => <option key={name} value={name}>{name}</option>)
              )}
            </select>
            {subjects.length === 0 && (
              <div className="text-sm text-gray-500 mt-1">Showing suggested subject names. To save records, please add/seed subjects (login required).</div>
            )}

            <input value={termValues.firstTermScore} onChange={e => setTermValues(v => ({ ...v, firstTermScore: e.target.value }))} placeholder="First term score" className="p-2 border rounded" />
            <input value={termValues.firstTermCA} onChange={e => setTermValues(v => ({ ...v, firstTermCA: e.target.value }))} placeholder="First term CA" className="p-2 border rounded" />
            <input value={termValues.secondTermScore} onChange={e => setTermValues(v => ({ ...v, secondTermScore: e.target.value }))} placeholder="Second term score" className="p-2 border rounded" />
            <input value={termValues.secondTermCA} onChange={e => setTermValues(v => ({ ...v, secondTermCA: e.target.value }))} placeholder="Second term CA" className="p-2 border rounded" />
            <input value={termValues.thirdTermScore} onChange={e => setTermValues(v => ({ ...v, thirdTermScore: e.target.value }))} placeholder="Third term score" className="p-2 border rounded" />
            <input value={termValues.thirdTermCA} onChange={e => setTermValues(v => ({ ...v, thirdTermCA: e.target.value }))} placeholder="Third term CA" className="p-2 border rounded" />

            <button onClick={addRecord} disabled={!isAuthenticated} className={`col-span-2 mt-2 p-2 rounded ${isAuthenticated ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Save Record</button>
            <button onClick={exportCSV} disabled={!isAuthenticated} className={`col-span-2 mt-2 p-2 rounded ${isAuthenticated ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}>Export CSV</button>
            {!isAuthenticated && (
              <div className="col-span-2 mt-2 text-sm text-yellow-700">You must be logged in to save records or export CSV.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="font-medium mb-2">Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Teacher</th>
                <th className="p-2 border">Student</th>
                <th className="p-2 border">Subject</th>
                <th className="p-2 border">1st</th>
                <th className="p-2 border">1st CA</th>
                <th className="p-2 border">2nd</th>
                <th className="p-2 border">2nd CA</th>
                <th className="p-2 border">3rd</th>
                <th className="p-2 border">3rd CA</th>
                <th className="p-2 border">Created</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td className="p-2 border">{r.id}</td>
                  <td className="p-2 border">{r.teacherName}</td>
                  <td className="p-2 border">{r.studentName}</td>
                  <td className="p-2 border">{r.subjectName}</td>
                  <td className="p-2 border">{r.firstTermScore}</td>
                  <td className="p-2 border">{r.firstTermCA}</td>
                  <td className="p-2 border">{r.secondTermScore}</td>
                  <td className="p-2 border">{r.secondTermCA}</td>
                  <td className="p-2 border">{r.thirdTermScore}</td>
                  <td className="p-2 border">{r.thirdTermCA}</td>
                  <td className="p-2 border">{r.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamRecords;
