'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { AuthInput } from '@/components/auth/AuthInput';

interface SettingsInfo {
  openaiKeySet: boolean;
  openaiKeyMasked: string | null;
  openaiKeyFromEnv: boolean;
  model: string;
}

export default function AdminSettingsPage() {
  const [info, setInfo] = useState<SettingsInfo | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SettingsInfo | null) => {
        if (data) {
          setInfo(data);
          setModel(data.model);
        }
      })
      .catch(() => {});
  };

  useEffect(load, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiApiKey: apiKey, model }),
      });
      if (res.ok) {
        setApiKey('');
        setSaved(true);
        load();
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-5 text-[22px] font-semibold tracking-tight text-ink-900">
        Настройки
      </h1>

      <form onSubmit={submit} className="rounded-2xl border border-ink-200 bg-white p-5">
        <h2 className="text-[16px] font-semibold text-ink-900">OpenAI</h2>
        <p className="mt-1 text-[13px] text-ink-500">
          Ключ используется для генерации программ тренировок после опроса.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <AuthInput
              label="API-ключ OpenAI"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                info?.openaiKeySet
                  ? info.openaiKeyFromEnv
                    ? 'Задан через переменную окружения'
                    : `Сохранён: ${info.openaiKeyMasked}`
                  : 'sk-...'
              }
              autoComplete="off"
            />
            <p className="mt-1.5 px-1 text-[12px] text-ink-400">
              {info?.openaiKeySet
                ? 'Ключ уже настроен. Оставьте поле пустым, чтобы не менять его.'
                : 'Ключ ещё не настроен — генерация программ недоступна.'}
            </p>
          </div>

          <AuthInput
            label="Модель"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gpt-4o"
            autoComplete="off"
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="tappable rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-white shadow-fab disabled:opacity-60"
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-[13px] font-medium text-marker-green">
              <Check size={16} />
              Сохранено
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
