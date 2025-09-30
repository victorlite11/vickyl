import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText } from 'lucide-react';

// Mock fetch function (replace with real API call)
const fetchActivityDetail = async (id: string) => {
  // Example static data
  const data = {
    1: {
      id: 1,
      type: 'lesson-plan',
      title: 'Mathematics - Algebra Basics',
      created: '2 hours ago',
      content: 'Detailed lesson plan content for algebra basics...'
    },
    2: {
      id: 2,
      type: 'exam',
      title: 'Science Quiz - Grade 9 IGCSE',
      created: 'yesterday',
      content: 'Physics exam with 20 multiple choice and 5 theory questions...'
    }
  };
  return data[id];
};

const ActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (id) {
      fetchActivityDetail(id).then((data) => {
        setActivity(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!activity) return <div className="p-8 text-red-500">Activity not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            {activity.type === 'lesson-plan' ? (
              <BookOpen className="h-6 w-6 mr-3 text-blue-600" />
            ) : (
              <FileText className="h-6 w-6 mr-3 text-green-600" />
            )}
            {activity.title}
          </CardTitle>
          <CardDescription>Created {activity.created}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-gray-700 whitespace-pre-line">{activity.content}</div>
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityDetail;
