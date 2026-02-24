import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, X, Send } from 'lucide-react';
import { assistantSamples } from '@/data/assistantSamples';

const detectLanguage = (text: string) => {
  // If the text contains Devanagari characters, it's definitely Hindi
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';

  // Detect common Hindi words typed in Latin script (Hinglish)
  const hinglishPattern = /\b(kya|kaise|kahan|kyon|kyu|nahi|nahin|hai|hain|ho|tum|aap|mera|meri|mere|ka|ke|ki|kuch|main|mein|dhanyavaad|shukriya|namaste|helo|hi|kaise|kya|help|scan|payment|barcode|qr|product|cart|budget|transaction)\b/i;
  if (hinglishPattern.test(text)) return 'hi-IN';

  // Default to English
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
  const [isDarkMode, setIsDarkMode] = useState(false);
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

    // Detect theme on mount and listen for changes
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark');
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
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
      // Detect current app language and set recognition language
      const appLang = (i18n?.language || 'en').startsWith('hi') ? 'hi-IN' : 'en-IN';
      r.lang = appLang;
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
      'the', 'is', 'a', 'an', 'how', 'do', 'i', 'what', 'can', 'my', 'where', 'on', 'of', 'to', 'in', 'and', 'for', 'you', 'me', 'it', 'will', 'be', 'are', 'your',
      'kya', 'kaise', 'kahan', 'kahan', 'aap', 'hai', 'hain', 'mera', 'meri', 'ka', 'ke', 'ki', 'hone'
    ]);

    const words = normalize(text).filter((w) => !stopwords.has(w));

    let matchedSample = null as (typeof assistantSamples)[number] | null;
    for (const s of assistantSamples) {
      const qWords = normalize(s.q).filter((w) => !stopwords.has(w));
      if (qWords.length === 0) continue;
      const common = qWords.filter((w) => words.includes(w)).length;
      const overlap = common / qWords.length;
      // Lower threshold to 0.35 to catch more Hindi/Hinglish matches
      if (overlap >= 0.35) {
        matchedSample = s;
        break;
      }
    }
    // Determine if the input is Hindi written in Latin script (Hinglish)
    const containsDevanagari = /[\u0900-\u097F]/.test(text);
    const isLatinHindi = lang && lang.startsWith('hi') && !containsDevanagari;

    // If a close sample match exists, use the local sample (works for both Devanagari and Hinglish)
    if (matchedSample) {
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

      if (!res.ok) throw new Error('API not available');

      const data = await res.json();
      const reply = data.reply || 'No response';
      const replyLang = data.lang || lang;

      setMessages((m) => [...m, { from: 'assistant', text: reply }]);
      speak(reply, replyLang);
    } catch (e) {
      // API unavailable - provide a helpful fallback response in the detected language
      const isHi = lang && lang.startsWith('hi');
      const fallbackReply = isHi 
        ? 'माफ़ कीजिए, मैं इस समय API से जुड़ नहीं हूं। कृपया बाद में पूछें या हमारी सहायता टीम से संपर्क करें।'
        : 'I\'m currently offline. Please try again later or contact our support team.';
      
      console.warn('AI Assistant API error:', e);
      setMessages((m) => [...m, { from: 'assistant', text: fallbackReply }]);
      speak(fallbackReply, lang);
    }
  };

  if (inline) {
    const { t } = useTranslation();
    return (
      <div className="inline-flex items-center">
        {open ? (
          <div className={`fixed bottom-20 left-6 z-50 w-64 sm:w-80 p-3 rounded-xl shadow-2xl border transition-colors ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-700 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">NexonCart.Assistant</div>
              <button
                onClick={() => {
                  setOpen(false);
                  window.speechSynthesis.cancel();
                }}
              >
                <X className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
              </button>
            </div>

            <div className={`sm:h-40 h-32 overflow-y-auto mb-2 text-sm p-2 rounded ${
              isDarkMode 
                ? 'bg-slate-800 border border-slate-700' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              {messages.map((m, i) => (
                <div key={i} className={`mb-2 ${m.from === 'user' ? 'text-right' : ''}`}>
                  <span className={`inline-block px-2 py-1 rounded ${
                    m.from === 'user'
                      ? isDarkMode 
                        ? 'bg-[#3DBB7A] text-white' 
                        : 'bg-blue-100 text-blue-900'
                      : isDarkMode 
                        ? 'bg-slate-700 text-gray-100' 
                        : 'bg-gray-200 text-gray-900'
                  }`}>{m.text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => (listening ? recognitionRef.current?.stop() : startListening())}
                className={`p-2 rounded transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className={`flex-1 border rounded px-2 py-1 text-sm transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder={t('assistant.placeholder')}
              />

              <button onClick={sendMessage} className={`p-2 rounded transition-colors ${
                isDarkMode 
                  ? 'bg-[#3DBB7A] text-white hover:bg-[#2da367]' 
                  : 'bg-black text-white hover:bg-gray-800'
              }`}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            title={t('assistant.label')}
            className={`w-10 h-10 rounded-full flex items-center justify-center mr-2 transition-colors ${
              isDarkMode 
                ? 'bg-[#3DBB7A] text-white' 
                : 'bg-black text-white'
            }`}
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