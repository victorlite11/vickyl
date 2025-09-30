import React, { useState } from 'react';
import JitsiMeeting from '../components/JitsiMeeting';
import { Button } from '@/components/ui/button';

const MeetingPage = () => {
  const [roomName, setRoomName] = useState('LessonSparkStaffRoom');
  const [inMeeting, setInMeeting] = useState(false);

  const handleJoin = () => {
    setInMeeting(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-green-100">
      <div className="max-w-xl w-full mx-auto p-8 rounded-2xl shadow-lg bg-white">
        <h1 className="text-3xl font-bold mb-4 text-blue-700">Staff Video Meeting Room</h1>
        {!inMeeting ? (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              className="border rounded px-4 py-2 text-lg"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              placeholder="Enter meeting room name"
            />
            <Button className="bg-blue-600 text-white px-6 py-2 rounded-full" onClick={handleJoin}>
              Join Meeting
            </Button>
          </div>
        ) : (
          <JitsiMeeting roomName={roomName} />
        )}
      </div>
    </div>
  );
};

export default MeetingPage;
