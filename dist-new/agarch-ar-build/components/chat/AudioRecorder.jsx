import React, { useState, useRef, useEffect, useCallback } from 'react';
    import { useToast } from '@/components/ui/use-toast.jsx';
    import { Button } from '@/components/ui/button';
    import { Mic, Trash2, Send } from 'lucide-react';

    const AudioRecorder = ({ onRecordingComplete, profile, isRecording, setIsRecording }) => {
      const { toast } = useToast();
      const [recordingTime, setRecordingTime] = useState(0);
      const mediaRecorderRef = useRef(null);
      const recordingIntervalRef = useRef(null);
      const audioChunksRef = useRef([]);
      const streamRef = useRef(null);

      const maxDuration = profile?.is_vip ? 120 : 60;

      const cleanup = useCallback(() => {
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current = null;
        }
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
      }, [setIsRecording]);

      const stopRecording = useCallback((send) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.onstop = () => {
            if (send && audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              onRecordingComplete(audioBlob, recordingTime);
            }
            cleanup();
          };
          mediaRecorderRef.current.stop();
        } else {
          cleanup();
        }
      }, [cleanup, onRecordingComplete, recordingTime]);

      useEffect(() => {
        if (!isRecording) {
          return;
        }

        const startRecording = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            audioChunksRef.current = [];
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };
            
            recorder.start();
            setRecordingTime(0);
            recordingIntervalRef.current = setInterval(() => {
              setRecordingTime(prev => {
                if (prev + 1 >= maxDuration) {
                  stopRecording(true);
                  return prev;
                }
                return prev + 1;
              });
            }, 1000);

          } catch (err) {
            console.error("Error accessing microphone:", err);
            toast({ variant: 'destructive', title: 'Error de micrófono', description: 'No se pudo acceder al micrófono. Asegúrate de dar permiso.' });
            cleanup();
          }
        };
        
        startRecording();

        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            cleanup();
        };
      }, [isRecording, maxDuration, toast, cleanup, stopRecording]);


      const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      };

      return (
          <div className="flex items-center justify-between w-full bg-background p-2 rounded-lg space-x-4">
            <Button variant="ghost" size="icon" onClick={() => stopRecording(false)} className="text-red-500">
                <Trash2 />
            </Button>
            <div className="flex items-center text-red-500 flex-grow justify-center">
                <Mic className="animate-pulse mr-2" />
                <span>{formatTime(recordingTime)} / {formatTime(maxDuration)}</span>
            </div>
            <Button onClick={() => stopRecording(true)} className="btn-action">
                <Send />
            </Button>
          </div>
      );
    };

    export default AudioRecorder;
