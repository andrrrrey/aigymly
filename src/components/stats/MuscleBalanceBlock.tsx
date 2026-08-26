'use client';

import { motion } from 'framer-motion';
import { MuscleGroupIcon } from '@/components/icons/MuscleGroupIcon';
import { useGender } from '@/lib/useGender';
import { MARKER_HEX } from '@/lib/utils';
import type { MonthStats } from '@/lib/statsMonth';
import { StatsSection, EmptyNote } from './StatsSection';

// One colour per group so the bars stay distinguishable at a glance.
const GROUP_COLOR: Record<string, string> = {
  Грудь: MARKER_HEX.red,
  Спина: MARKER_HEX.blue,
  Ноги: MARKER_HEX.purple,
  Ягодицы: MARKER_HEX.orange,
  Плечи: MARKER_HEX.cyan,
  Руки: MARKER_HEX.green,
  Пресс: MARKER_HEX.yellow,
};

const INFO_BODY = (
  <>
    <p>
      Доля группы мышц — это её процент от всех выполненных подходов за месяц.
    </p>
    <p>
      Если одна группа мышц доминирует (более 40%), а другая менее 15% — добавьте
      упражнения на отстающие мышцы. Это поможет избежать перекосов и травм.
    </p>
    <p>Группы с долей менее 5% в списке не показываются.</p>
  </>
);

// Block 4 — «Не перекашиваю ли я тело?»
export function MuscleBalanceBlock({ stats }: { stats: MonthStats }) {
  const gender = useGender();

  return (
    <StatsSection
      title="Баланс мышц"
      info={{
        title: 'Зачем следить за балансом',
        body: INFO_BODY,
        ariaLabel: 'Зачем следить за балансом мышц',
      }}
    >
      {stats.balance.length === 0 ? (
        <EmptyNote>
          В этом месяце ещё нет отмеченных подходов — распределение по группам мышц
          появится, когда они будут.
        </EmptyNote>
      ) : (
        <div className="rounded-2xl border border-ink-100 px-4 py-2">
          {stats.balance.map((g, i) => (
            <div key={g.group} className="flex items-center gap-3 py-2">
              <div className="grid h-7 w-7 shrink-0 place-items-center">
                <MuscleGroupIcon group={g.group} gender={gender} size={26} />
              </div>
              <div className="w-[68px] shrink-0 truncate text-[14px] text-ink-900">
                {g.group}
              </div>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: GROUP_COLOR[g.group] ?? MARKER_HEX.gray }}
                  initial={{ width: 0 }}
                  animate={{ width: `${g.percent}%` }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                />
              </div>
              <div className="tabular w-9 shrink-0 text-right text-[13px] text-ink-500">
                {Math.round(g.percent)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </StatsSection>
  );
}
