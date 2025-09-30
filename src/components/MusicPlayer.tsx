
import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, Volume2, Mic, MicOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

const MusicPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState('');
  const [volume, setVolume] = useState([50]);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const songs = [
    { name: 'Focus Flow', url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
    { name: 'Study Beats', url: 'https://www.soundjay.com/misc/sounds/bell-ringing-04.wav' },
    { name: 'Calm Vibes', url: 'https://www.soundjay.com/misc/sounds/bell-ringing-03.wav' },
    { name: 'Productivity Mix', url: 'https://www.soundjay.com/misc/sounds/bell-ringing-02.wav' }
  ];

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log('Voice command:', transcript);
        
        // Process voice commands
        if (transcript.includes('play') || transcript.includes('start')) {
          handlePlay();
          toast.success('Playing music via voice command!');
        } else if (transcript.includes('pause') || transcript.includes('stop')) {
          handlePause();
          toast.success('Paused music via voice command!');
        } else if (transcript.includes('volume up')) {
          setVolume([Math.min(100, volume[0] + 20)]);
          toast.success('Volume increased!');
        } else if (transcript.includes('volume down')) {
          setVolume([Math.max(0, volume[0] - 20)]);
          toast.success('Volume decreased!');
        } else {
          // Try to match song names
          const matchedSong = songs.find(song => 
            transcript.includes(song.name.toLowerCase())
          );
          if (matchedSong) {
            setCurrentSong(matchedSong.url);
            handlePlay();
            toast.success(`Playing ${matchedSong.name} via voice command!`);
          } else {
            toast.info('Voice command not recognized. Try "play", "pause", or a song name.');
          }
        }
        
        setIsListening(false);
      };
      
      recognitionInstance.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [volume]);

  const handlePlay = () => {
    if (audioRef.current && currentSong) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSongSelect = (songUrl: string, songName: string) => {
    setCurrentSong(songUrl);
    setIsPlaying(false);
    toast.success(`Selected: ${songName}`);
  };

  const handleVoiceCommand = () => {
    if (!recognition) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.info('Listening for voice command...');
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
        >
          <Music className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center">
              <Music className="h-5 w-5 mr-2 text-purple-600" />
              Relax While You Work
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-gray-500"
            >
              ×
            </Button>
          </div>

          {/* Song Selection */}
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-gray-700">Choose your music:</p>
            <div className="grid grid-cols-2 gap-2">
              {songs.map((song, index) => (
                <Button
                  key={index}
                  variant={currentSong === song.url ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSongSelect(song.url, song.name)}
                  className="text-xs"
                >
                  {song.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={!currentSong}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceCommand}
                className={isListening ? "bg-red-100 text-red-600" : ""}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-gray-600" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="w-20"
              />
            </div>
          </div>

          {/* Voice Commands Help */}
          <div className="text-xs text-gray-600 bg-gray-100 rounded p-2">
            <p className="font-medium mb-1">Voice Commands:</p>
            <p>• "Play" or "Start" - Start music</p>
            <p>• "Pause" or "Stop" - Pause music</p>
            <p>• "Volume up/down" - Adjust volume</p>
            <p>• Song names - Play specific songs</p>
          </div>

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={currentSong}
            loop
            onEnded={() => setIsPlaying(false)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default MusicPlayer;
