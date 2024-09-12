'use client';

import React, { useState, useEffect } from 'react';
import { getDocuments } from '../lib/firebase/firebaseUtils';

interface Note {
  id: string;
  text: string;
  timestamp: string;
}

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const fetchedNotes = await getDocuments('notes');
        setNotes(fetchedNotes as Note[]);
      } catch (err) {
        console.error('Error fetching notes:', err);
        setError('Failed to fetch notes. Please try again later.');
      }
    };

    fetchNotes();
  }, []);

  if (error) {
    return <div className="text-red-500 dark:text-red-400">{error}</div>;
  }

  return (
    <div className="w-full max-w-md mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Your Notes</h2>
      {notes.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">No notes yet. Start recording to create your first note!</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(note.timestamp).toLocaleString()}</p>
              <p className="mt-2 text-gray-900 dark:text-gray-100">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}