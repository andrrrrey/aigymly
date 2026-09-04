'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { AuthInput } from '@/components/auth/AuthInput';

interface TbankInfo {
  terminalKeySet: boolean;
  terminalKeyMasked: string | null;
  terminalKeyFromEnv: boolean;
  passwordSet: boolean;
  passwordFromEnv: boolean;
  mode: 'test' | 'production';
  taxation: string;
  vat: string;
  companyEmail: string;
}

interface SettingsInfo {
  openaiKeySet: boolean;
  openaiKeyMasked: string | null;
  openaiKeyFromEnv: boolean;
  model: string;
  tbank: TbankInfo;
}

export default function AdminSettingsPage() {
  const [info, setInfo] = useState<SettingsInfo | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const [tbankKey, setTbankKey] = useState('');
  const [tbankPass, setTbankPass] = useState('');
  const [tbankMode, setTbankMode] = useState<'test' | 'production'>('test');
  const [taxation, setTaxation] = useState('');
  const [vat, setVat] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    fetch('/api/admin/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SettingsInfo | null) => {
        if (data) {
          setInfo(data);
          setModel(data.model);
          setTbankMode(data.tbank.mode);
          setTaxation(data.tbank.taxation);
          setVat(data.tbank.vat);
          setCompanyEmail(data.tbank.companyEmail);
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
        body: JSON.stringify({
          openaiApiKey: apiKey,
          model,
          tbankTerminalKey: tbankKey,
          tbankPassword: tbankPass,
          tbankMode,
          tbankTaxation: taxation,
          tbankVat: vat,
          tbankCompanyEmail: companyEmail,
        }),
      });
      if (res.ok) {
        setApiKey('');
        setTbankKey('');
        setTbankPass('');
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
      <h1 className="mb-5 text-[22px] font-semibold tracking-tight text-ink-900">Настройки</h1>

      <form onSubmit={submit} className="space-y-5">
        {/* OpenAI */}
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
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
        </section>

        {/* T-Bank */}
        <section className="rounded-2xl border border-ink-200 bg-white p-5">
          <h2 className="text-[16px] font-semibold text-ink-900">T-Bank эквайринг</h2>
          <p className="mt-1 text-[13px] text-ink-500">
            Реквизиты терминала для приёма оплаты подписки и автосписаний.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <AuthInput
                label="Terminal Key"
                value={tbankKey}
                onChange={(e) => setTbankKey(e.target.value)}
                placeholder={
                  info?.tbank.terminalKeySet
                    ? info.tbank.terminalKeyFromEnv
                      ? 'Задан через переменную окружения'
                      : `Сохранён: ${info.tbank.terminalKeyMasked}`
                    : 'TinkoffBankTest'
                }
                autoComplete="off"
              />
            </div>
            <div>
              <AuthInput
                label="Пароль терминала"
                type="password"
                value={tbankPass}
                onChange={(e) => setTbankPass(e.target.value)}
                placeholder={
                  info?.tbank.passwordSet
                    ? info.tbank.passwordFromEnv
                      ? 'Задан через переменную окружения'
                      : 'Сохранён — оставьте пустым, чтобы не менять'
                    : 'Пароль из ЛК'
                }
                autoComplete="off"
              />
            </div>

            <div>
              <span className="mb-1.5 block px-1 text-[13px] font-medium text-ink-600">Контур</span>
              <div className="flex gap-2">
                {(['test', 'production'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTbankMode(m)}
                    className={`tappable flex-1 rounded-xl py-2.5 text-[14px] font-medium transition-colors ${
                      tbankMode === m ? 'bg-brand text-white' : 'bg-ink-100 text-ink-700'
                    }`}
                  >
                    {m === 'test' ? 'Тестовый' : 'Боевой'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AuthInput
                label="Налогообложение"
                value={taxation}
                onChange={(e) => setTaxation(e.target.value)}
                placeholder="usn_income"
                autoComplete="off"
              />
              <AuthInput
                label="Ставка НДС"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                placeholder="none"
                autoComplete="off"
              />
            </div>
            <AuthInput
              label="Email для чеков (продавец)"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="shop@example.com"
              autoComplete="off"
            />
            <p className="px-1 text-[12px] text-ink-400">
              Значения налогообложения/НДС — как в документации T-Bank (например, taxation:
              usn_income; НДС: none). Используются в фискальном чеке (54-ФЗ).
            </p>
          </div>
        </section>

        <div className="flex items-center gap-3">
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
