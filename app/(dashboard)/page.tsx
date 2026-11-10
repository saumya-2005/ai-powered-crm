"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import type { Stats } from "@/lib/types";
import { STATUS_HEX, btnPrimary, cardCls } from "@/lib/constants";
import { formatDateTime, todayStr } from "@/lib/dates";
import { EmptyState, ErrorBox, LoadingBlock, PageHeader } from "@/components/ui";

// One number card
function StatCard({ label, value, note, className = "" }: { label: string; value: string | number; note?: string; className?: string }) {
  return (
    <div className={`${cardCls} p-4 ${className}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [today] = useState(todayStr);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["stats", today],
    queryFn: () => api<Stats>(`/api/stats?today=${today}`),
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="A quick look at your leads and sales activity." />

      {isLoading && <LoadingBlock rows={5} />}
      {isError && <ErrorBox message={error.message} onRetry={() => refetch()} />}

      {data && data.total === 0 && (
        <EmptyState
          title="No data yet"
          text="Add your first lead and your numbers and charts will show up here."
          action={<Link href="/leads" className={btnPrimary}>Add a lead</Link>}
        />
      )}

      {data && data.total > 0 && (
        <div className="space-y-6">
          {/* Number cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Total leads" value={data.total} />
            <StatCard label="New leads" value={data.newLeads} />
            <StatCard label="Converted customers" value={data.converted} />
            <StatCard
              label="Pending follow-ups"
              value={data.pendingFollowUps}
              note={data.overdueFollowUps > 0 ? `${data.overdueFollowUps} overdue` : "None overdue"}
            />
            <StatCard label="Conversion rate" value={`${data.conversionRate}%`} className="col-span-2 md:col-span-1" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className={`${cardCls} p-4 sm:p-5`}>
              <h2 className="mb-4 font-semibold">Lead distribution by status</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {data.byStatus.map((s) => <Cell key={s.name} fill={STATUS_HEX[s.name] ?? "#94a3b8"} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </section>

            <section className={`${cardCls} p-4 sm:p-5`}>
              <h2 className="mb-4 font-semibold">Sales performance (last 6 months)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} width={30} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" name="New leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" name="Converted" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className={`${cardCls} p-4 sm:p-5`}>
              <h2 className="mb-4 font-semibold">Leads by source</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.bySource} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={90} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Leads" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Recent activities */}
            <section className={`${cardCls} p-4 sm:p-5`}>
              <h2 className="mb-4 font-semibold">Recent customer activities</h2>
              {data.recent.length === 0 ? (
                <p className="text-sm text-slate-500">No activities logged yet. Open a lead and add one.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recent.map((a) => (
                    <li key={a.id} className="py-3">
                      <p className="text-sm">
                        <span className="font-medium">{a.type}</span> with{" "}
                        <Link href={`/leads/${a.lead_id}`} className="text-indigo-600 hover:underline">{a.lead_name}</Link>
                      </p>
                      {a.description && <p className="mt-0.5 text-sm text-slate-600">{a.description}</p>}
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(a.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
