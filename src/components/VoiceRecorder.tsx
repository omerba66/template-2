'use client';

import { useState, useRef, useCallback } from 'react';
import { addDocument } from '../lib/firebase/firebaseUtils';
import { motion } from 'framer-motion';

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleTranscribe = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      console.log("No audio recorded, skipping transcription");
      return;
    }

    setIsTranscribing(true);
    setError(null);
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');

    console.log(`Sending audio for transcription, size: ${audioBlob.size} bytes`);

    try {
      const response = await fetch('/api/openai/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Transcription received:", data.text);
      setTranscript(data.text);

      // Save the note to Firebase
      await addDocument('notes', {
        text: data.text,
        timestamp: new Date().toISOString(),
      });
      console.log("Note saved to Firebase");
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const handleStartRecording = async () => {
    try {
      console.log("Requesting microphone access");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
        console.log(`Audio chunk received, size: ${event.data.size} bytes`);
      };

      mediaRecorderRef.current.onstop = () => {
        console.log("Recording stopped, starting transcription");
        handleTranscribe();
      };

      mediaRecorderRef.current.start();
      console.log("Recording started");
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError(error instanceof Error ? error.message : "Failed to start recording");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log("Stopping recording");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      console.log("No active recording to stop");
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-4">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Stop Recording
          </button>
        )}
      </div>
      {isTranscribing && (
        <div className="flex justify-center mb-4">
          <motion.div
            className="w-8 h-8 border-4 border-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
          <h3 className="font-bold mb-2">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      {transcript && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg">
          <h3 className="font-bold mb-2">Transcription:</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}