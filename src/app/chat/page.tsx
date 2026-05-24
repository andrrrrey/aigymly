'use client';

import { BottomNav } from '@/components/BottomNav';
import { Sparkles, Send } from 'lucide-react';
import { useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  return (
    <>
      <header
        className="shrink-0 border-b border-ink-100 bg-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-brand">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-[16px] font-semibold tracking-tight text-ink-900">AI-ассистент</h1>
            <p className="text-[12px] text-ink-400">Спроси о тренировках или питании</p>
          </div>
        </div>
      </header>

      <main className="no-scrollbar flex-1 overflow-y-auto bg-white px-5 py-5">
        <div className="mx-auto max-w-sm rounded-2xl bg-ink-50 p-4 text-[14px] text-ink-700">
          👋 Привет! Я помогу с тренировками, упражнениями и здоровьем. Спроси что-нибудь, или попроси скорректировать программу.
        </div>
      </main>

      <div className="shrink-0 border-t border-ink-100 bg-white px-5 py-3">
        <div className="flex items-center gap-2 rounded-full bg-ink-100 px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Сообщение..."
            className="min-w-0 flex-1 bg-transparent text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          <button className="tappable grid h-9 w-9 place-items-center rounded-full bg-brand text-white">
            <Send size={16} />
          </button>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
