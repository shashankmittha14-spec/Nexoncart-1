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
  const [aiPosition, setAiPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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

    // Load saved AI position
    try {
      const savedPosition = localStorage.getItem('nexoncart_ai_assistant_position');
      if (savedPosition) {
        setAiPosition(JSON.parse(savedPosition));
      }
    } catch (e) {
      // ignore
    }

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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - aiPosition.x, y: e.clientY - aiPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setAiPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Save position to localStorage
      try {
        localStorage.setItem('nexoncart_ai_assistant_position', JSON.stringify(aiPosition));
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, aiPosition]);

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
    return (
      <>
        {/* Always visible fallback button */}
        <div 
          style={{
            position: 'fixed',
            bottom: `calc(150px + ${aiPosition.y}px)`,
            left: `calc(24px + ${aiPosition.x}px)`,
            zIndex: 9999,
            width: '48px',
            height: '48px',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          <button
            onClick={() => !isDragging && setOpen(!open)}
            onMouseDown={handleMouseDown}
            title={t('assistant.label')}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#06B6D4',
              border: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0891B2';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#06B6D4';
            }}
          >
            <Mic style={{ width: '24px', height: '24px', color: 'white' }} />
          </button>
        </div>

        {/* Chat popup - appears above the button */}
        {open && (
          <div 
            style={{
              position: 'fixed',
              bottom: `calc(210px + ${aiPosition.y}px)`,
              left: `calc(24px + ${aiPosition.x}px)`,
              zIndex: 9998,
              width: '280px',
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#475569' : '#e5e7eb'}`,
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000' }}>NexonCart.Assistant</div>
              <button
                onClick={() => {
                  setOpen(false);
                  window.speechSynthesis.cancel();
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X style={{ width: '16px', height: '16px', color: isDarkMode ? '#d1d5db' : '#374151' }} />
              </button>
            </div>

            <div style={{
              height: '128px',
              overflowY: 'auto',
              marginBottom: '8px',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb',
              border: `1px solid ${isDarkMode ? '#334155' : '#e5e7eb'}`,
              fontSize: '14px',
            }}>
              {messages.map((m, i) => (
                <div key={i} style={{ marginBottom: '8px', textAlign: m.from === 'user' ? 'right' : 'left' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '8px',
                    borderRadius: '6px',
                    backgroundColor: m.from === 'user' 
                      ? isDarkMode ? '#0891b2' : '#a5f3fc'
                      : isDarkMode ? '#334155' : '#e5e7eb',
                    color: m.from === 'user'
                      ? isDarkMode ? '#ffffff' : '#06b6d4'
                      : isDarkMode ? '#f1f5f9' : '#1f2937',
                  }}>{m.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => (listening ? recognitionRef.current?.stop() : startListening())}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: isDarkMode ? '#334155' : '#e5e7eb',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDarkMode ? '#ffffff' : '#111827',
                }}
              >
                <Mic style={{ width: '16px', height: '16px' }} />
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={t('assistant.placeholder')}
                style={{
                  flex: 1,
                  border: `1px solid ${isDarkMode ? '#475569' : '#d1d5db'}`,
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '14px',
                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#000000',
                }}
              />

              <button 
                onClick={sendMessage}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#06b6d4',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ffffff',
                }}
              >
                <Send style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default AIAssistant;