'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function WorkloadChart({
  newUsers,
  pendingReports,
  pendingRooms,
}: {
  newUsers: number;
  pendingReports: number;
  pendingRooms: number;
}) {
  const values = [
    { label: 'Tin chờ duyệt', value: pendingRooms },
    { label: 'Báo cáo mới', value: pendingReports },
    { label: 'Người dùng mới', value: newUsers },
  ];

  return (
    <article className="hidden rounded-lg border border-zinc-200 bg-white p-4 sm:p-5 md:block">
      <h2 className="text-lg font-semibold text-zinc-900">
        Khối lượng cần theo dõi
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        So sánh số liệu hiện tại giữa các nhóm vận hành.
      </p>
      <div
        className="mt-6 h-52"
        aria-label="Biểu đồ cột khối lượng cần theo dõi"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={values}
            margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--color-zinc-200)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--color-zinc-500)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--color-zinc-500)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: 'var(--color-zinc-100)' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
              <Cell fill="var(--color-warning-600)" />
              <Cell fill="var(--color-danger-600)" />
              <Cell fill="var(--color-brand-600)" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];

  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-card">
      <p className="text-zinc-600">{item.name}</p>
      <p className="mt-1 font-semibold text-zinc-900">{item.value}</p>
    </div>
  );
}
