import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../App';
import { Mic, Square, Play, Trash2, Calendar, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VoiceRecords() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const fetchRecordings = useCallback(async () => {
    if (!user) return;
    try {
      // Note: Ensure 'voiceRecords' is added to your Dexie schema in db.js
      const data = await db.voiceRecords.where('user_id').equals(user.id).toArray();
      setRecordings(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error("Storage error: Ensure 'voiceRecords' table is defined in Dexie schema.", err);
    }
  }, [user]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await db.voiceRecords.add({
          id: crypto.randomUUID(),
          user_id: user.id,
          blob: audioBlob,
          date: new Date().toISOString()
        });
        toast.success(t('voiceNoteSaved'));
        fetchRecordings();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    await db.voiceRecords.delete(id);
    fetchRecordings();
    toast.success('Recording deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('voiceExpenseTracker')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 italic hidden md:block">{t('voiceTrackerMotto') || 'Record expenses on the go and log them later.'}</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center space-y-4">
        <div className={`p-6 rounded-full transition-all duration-300 ${isRecording ? 'bg-rose-100 dark:bg-rose-900/30 animate-pulse' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
          <Mic size={48} className={isRecording ? 'text-rose-600' : 'text-blue-600'} />
        </div>
        
        <div className="text-center">
          <h3 className="font-bold text-lg text-slate-800">{isRecording ? t('recording') : t('readyToRecord')}</h3>
          <p className="text-sm text-slate-500">{t('tapToCapture')}</p>
        </div>

        {!isRecording ? (
          <button onClick={startRecording} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
            <Mic size={20} /> {t('startRecording')}
          </button>
        ) : (
          <button onClick={stopRecording} className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-700 transition shadow-lg flex items-center gap-2">
            <Square size={20} /> {t('stopAndSave')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recordings.map((rec) => (
          <div key={rec.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500">
              <Volume2 size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <Calendar size={12} />
                {new Date(rec.date).toLocaleString()}
              </div>
              <audio controls src={URL.createObjectURL(rec.blob)} className="h-8 w-full filter dark:invert" />
            </div>
            <button onClick={() => deleteRecording(rec.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}