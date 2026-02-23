import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, X, Send } from 'lucide-react';
import { assistantSamples } from '@/data/assistantSamples';

const detectLanguage = (text: string) => {
  // If the text contains Devanagari characters, treat as Hindi
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';

  // Detect common Hindi words typed in Latin script (Hinglish)
  const hindiLatinPattern = /\b(kya|kaise|kahan|kyon|kyu|nahi|nahin|hai|hain|ho|tum|aap|mera|meri|ka|ke|ki|kuch|dhanyavaad|shukriya|namaste)\b/i;
  if (hindiLatinPattern.test(text)) return 'hi-IN';

  // Fallback to English for now. Backend can handle other languages if provided.
  return 'en-IN';
};

type UserProfile = { name?: string; email?: string; phone?: string } | null;

type AIAssistantProps = {
  user?: UserProfile;
  inline?: boolean;
  /** when true, open the popup upwards (useful for bottom-left placement) */
  dropUp?: boolean;
};

const AIAssistant: React.FC<AIAssistantProps> = ({ user, inline = false, dropUp = false }) => {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<
    { from: 'user' | 'assistant'; text: string }[]
  >([]);
  const recognitionRef = useRef<any>(null);
  const { t } = useTranslation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;

    r.onresult = (ev: any) => {
      const transcript = Array.from(ev.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setInput(transcript);
      setListening(false);
      try {
        r.stop();
      } catch {}
    };

    r.onerror = () => {
      setListening(false);
      try {
        r.stop();
      } catch {}
    };

    recognitionRef.current = r;
  }, []);

  const speak = (text: string, lang = 'en-IN') => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const startListening = () => {
    const r = recognitionRef.current;
    if (!r) return;
    try {
      r.lang = 'en-IN';
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { from: 'user', text }]);
    setInput('');

    // Determine language: prefer detection from the message, otherwise fallback to app UI language
    const uiLang = (i18n?.language || 'en').startsWith('hi') ? 'hi-IN' : (i18n?.language || 'en').startsWith('en') ? 'en-IN' : (i18n?.language || 'en');
    const detectedLang = detectLanguage(text);
    const lang = detectedLang || uiLang;

    // Fuzzy match local sample Q&A (token overlap) before network call
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[’'"`\?\:\.\,\!\-\(\)]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    const stopwords = new Set([
      'the', 'is', 'a', 'an', 'how', 'do', 'i', 'what', 'can', 'my', 'where', 'on', 'of', 'to', 'in', 'and', 'for', 'you', 'me', 'it', 'will', 'be', 'are', 'your'
    ]);

    const words = normalize(text).filter((w) => !stopwords.has(w));

    let matchedSample = null as (typeof assistantSamples)[number] | null;
    for (const s of assistantSamples) {
      const qWords = normalize(s.q).filter((w) => !stopwords.has(w));
      if (qWords.length === 0) continue;
      const common = qWords.filter((w) => words.includes(w)).length;
      const overlap = common / qWords.length;
      if (overlap >= 0.5) {
        matchedSample = s;
        break;
      }
    }
    // Determine if the input is Hindi written in Latin script (Hinglish)
    const containsDevanagari = /[\u0900-\u097F]/.test(text);
    const isLatinHindi = lang && lang.startsWith('hi') && !containsDevanagari;

    // If a close sample match exists and it's not Hinglish (Latin Hindi), use the local sample
    if (matchedSample && !isLatinHindi) {
      const isHi = lang && lang.startsWith('hi');
      const reply = isHi ? matchedSample.a_hi || matchedSample.a : matchedSample.a_en || matchedSample.a;
      const replyLang = isHi ? 'hi-IN' : 'en-IN';
      setMessages((m) => [...m, { from: 'assistant', text: reply }]);
      speak(reply, replyLang);
      return;
    }

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang, uiLang, user, script: containsDevanagari ? 'devanagari' : 'latin' }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const reply = data.reply || 'No response';
      const replyLang = data.lang || lang;

      setMessages((m) => [...m, { from: 'assistant', text: reply }]);
      speak(reply, replyLang);
    } catch (e) {
      const err = t('assistant.unavailable');
      setMessages((m) => [...m, { from: 'assistant', text: err }]);
      speak(err, lang);
    }
  };

  if (inline) {
    const { t } = useTranslation();
    return (
      <div className="inline-flex items-center">
        {open ? (
          <div className="fixed bottom-20 left-6 z-50 w-64 sm:w-80 bg-white p-3 rounded-xl shadow-2xl border">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">NexonCart.Assistant {user?.name ? `— ${user.name}` : ''}</div>
              <button
                onClick={() => {
                  setOpen(false);
                  window.speechSynthesis.cancel();
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="sm:h-40 h-32 overflow-y-auto mb-2 text-sm bg-gray-50 p-2 rounded">
              {messages.map((m, i) => (
                <div key={i} className={`mb-2 ${m.from === 'user' ? 'text-right' : ''}`}>
                  <span className="inline-block px-2 py-1 rounded bg-gray-200">{m.text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => (listening ? recognitionRef.current?.stop() : startListening())}
                className="p-2 bg-gray-200 rounded"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 border rounded px-2 py-1 text-sm"
                placeholder={t('assistant.placeholder')}
              />

              <button onClick={sendMessage} className="p-2 bg-black text-white rounded">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            title={t('assistant.label')}
            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center mr-2"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default AIAssistant;