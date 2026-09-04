'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  priceKopecks: number;
  periodDays: number;
  active: boolean;
  sortOrder: number;
}

interface Draft {
  name: string;
  priceRub: string;
  periodDays: string;
  active: boolean;
  sortOrder: string;
}

const emptyDraft: Draft = { name: '', priceRub: '', periodDays: '30', active: true, sortOrder: '0' };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/plans')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Plan[]) => setPlans(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const savePlan = async (p: Plan, patch: Partial<Plan>) => {
    setSavingId(p.id);
    setSavedId(null);
    try {
      const res = await fetch(`/api/admin/plans/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updated: Plan = await res.json();
        setPlans((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        setSavedId(p.id);
        setTimeout(() => setSavedId(null), 2000);
      }
    } finally {
      setSavingId(null);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Деактивировать тариф? Он перестанет показываться пользователям.')) return;
    await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
    load();
  };

  const createPlan = async () => {
    const priceKopecks = Math.round(parseFloat(newDraft.priceRub.replace(',', '.')) * 100);
    const periodDays = parseInt(newDraft.periodDays, 10);
    if (!newDraft.name.trim() || !Number.isFinite(priceKopecks) || priceKopecks < 0 || !periodDays) {
      alert('Заполните название, цену и период.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDraft.name.trim(),
          priceKopecks,
          periodDays,
          active: newDraft.active,
          sortOrder: parseInt(newDraft.sortOrder, 10) || 0,
        }),
      });
      if (res.ok) {
        setNewDraft(emptyDraft);
        load();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 text-[22px] font-semibold tracking-tight text-ink-900">Тарифы</h1>

      <div className="space-y-3">
        {loading ? (
          <div className="py-10 text-center text-ink-400">Загрузка…</div>
        ) : (
          plans.map((p) => (
            <PlanRow
              key={p.id}
              plan={p}
              saving={savingId === p.id}
              saved={savedId === p.id}
              onSave={(patch) => savePlan(p, patch)}
              onDelete={() => deletePlan(p.id)}
            />
          ))
        )}
      </div>

      {/* Create new */}
      <div className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-white p-5">
        <h2 className="mb-3 text-[15px] font-semibold text-ink-900">Новый тариф</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Название">
            <input
              value={newDraft.name}
              onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })}
              className={inputCls}
              placeholder="Месяц"
            />
          </Field>
          <Field label="Цена, ₽">
            <input
              value={newDraft.priceRub}
              onChange={(e) => setNewDraft({ ...newDraft, priceRub: e.target.value })}
              className={inputCls}
              inputMode="decimal"
              placeholder="499"
            />
          </Field>
          <Field label="Период, дней">
            <input
              value={newDraft.periodDays}
              onChange={(e) => setNewDraft({ ...newDraft, periodDays: e.target.value })}
              className={inputCls}
              inputMode="numeric"
              placeholder="30"
            />
          </Field>
          <Field label="Порядок">
            <input
              value={newDraft.sortOrder}
              onChange={(e) => setNewDraft({ ...newDraft, sortOrder: e.target.value })}
              className={inputCls}
              inputMode="numeric"
              placeholder="0"
            />
          </Field>
        </div>
        <button
          onClick={createPlan}
          disabled={creating}
          className="tappable mt-4 flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-white shadow-fab disabled:opacity-60"
        >
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Добавить
        </button>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[14px] text-ink-900 focus:border-brand focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink-500">{label}</span>
      {children}
    </label>
  );
}

function PlanRow({
  plan,
  saving,
  saved,
  onSave,
  onDelete,
}: {
  plan: Plan;
  saving: boolean;
  saved: boolean;
  onSave: (patch: Partial<Plan>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(plan.name);
  const [priceRub, setPriceRub] = useState((plan.priceKopecks / 100).toString());
  const [periodDays, setPeriodDays] = useState(plan.periodDays.toString());
  const [sortOrder, setSortOrder] = useState(plan.sortOrder.toString());

  const submit = () => {
    const priceKopecks = Math.round(parseFloat(priceRub.replace(',', '.')) * 100);
    const days = parseInt(periodDays, 10);
    onSave({
      name: name.trim(),
      priceKopecks: Number.isFinite(priceKopecks) ? priceKopecks : plan.priceKopecks,
      periodDays: days || plan.periodDays,
      sortOrder: parseInt(sortOrder, 10) || 0,
    });
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${plan.active ? 'border-ink-200' : 'border-ink-100 opacity-60'}`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Название">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Цена, ₽">
          <input
            value={priceRub}
            onChange={(e) => setPriceRub(e.target.value)}
            className={inputCls}
            inputMode="decimal"
          />
        </Field>
        <Field label="Период, дней">
          <input
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
            className={inputCls}
            inputMode="numeric"
          />
        </Field>
        <Field label="Порядок">
          <input
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={inputCls}
            inputMode="numeric"
          />
        </Field>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={saving}
          className="tappable flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : 'Сохранить'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-[12px] font-medium text-marker-green">
            <Check size={14} /> Сохранено
          </span>
        )}

        <label className="ml-auto flex items-center gap-2 text-[13px] text-ink-600">
          <input
            type="checkbox"
            checked={plan.active}
            onChange={(e) => onSave({ active: e.target.checked })}
          />
          Активен
        </label>
        <button
          onClick={onDelete}
          className="tappable grid h-8 w-8 place-items-center rounded-full text-ink-400 hover:bg-marker-red/10 hover:text-marker-red"
          aria-label="Деактивировать"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
