'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Stats } from '@/types';
import {
  TrendingUp,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AnalyticsSectionProps {
  stats: Stats;
  refreshStats: () => void;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ stats }) => {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<'season' | 'all'>('all');

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt || 0);
  };

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
  const STATUS_COLORS = {
    Paid: '#10b981',
    Pending: '#f59e0b',
  };

  const collectionRate = stats.totalRevenue > 0
    ? Math.round((stats.totalRevenue / (stats.totalRevenue + stats.pendingDues)) * 100)
    : 85;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            Muthu Fleet Telemetry
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t.analyticsTitle}
          </h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
            {t.analyticsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-neutral-900/90 border border-slate-200 dark:border-white/10 p-1.5 rounded-xl">
          <button
            onClick={() => setTimeRange('season')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeRange === 'season'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Samba Season (Harvest)
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeRange === 'all'
                ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All-Time Fleet Data
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300 group shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-semibold">{t.totalRevenue}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs last harvest month</span>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 hover:border-amber-500/30 transition-all duration-300 group shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-semibold">{t.hoursLogged}</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {stats.totalHours.toFixed(1)} <span className="text-base font-normal text-slate-500 dark:text-neutral-400">{t.hours}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <Activity className="w-3.5 h-3.5" />
            <span>{stats.completedJobs} {t.completedJobs}</span>
          </div>
        </div>

        {/* Pending Dues */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 hover:border-rose-500/30 transition-all duration-300 group shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-semibold">{t.pendingDues}</span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-rose-600 dark:text-rose-300 tracking-tight">
            {formatCurrency(stats.pendingDues)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-neutral-400">
            <span>{stats.pendingCount} unpaid</span>
          </div>
        </div>

        {/* Recovery Rate */}
        <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-white/5 hover:border-cyan-500/30 transition-all duration-300 group shadow-sm">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-semibold">{t.recoveryRate}</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {collectionRate}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue & Hours Timeline (Composed Area Chart) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-900/70 border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.monthlyChartTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">{t.monthlyChartSub}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-700 dark:text-neutral-300">{t.revenueLegend}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
                <span className="text-slate-700 dark:text-neutral-300">{t.hoursLegend}</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                          <p className="text-emerald-600 dark:text-emerald-400">
                            Revenue: {formatCurrency(payload[0]?.value as number)}
                          </p>
                          <p className="text-cyan-600 dark:text-cyan-400">
                            Hours: {payload[1]?.value} hrs
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="hours"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#hoursGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Payment Status Ratio (Pie/Donut Chart) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/70 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.paymentRatioTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">{t.paymentRatioSub}</p>
              </div>
            </div>

            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.paymentStatusDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.paymentStatusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-2.5 rounded-xl text-xs space-y-1 shadow-xl">
                            <span className="font-semibold text-slate-900 dark:text-white">{data.name}</span>
                            <p className="text-slate-600 dark:text-neutral-300">
                              Amount: {formatCurrency(data.value)} ({data.count} bills)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{collectionRate}%</span>
                <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-widest font-semibold">Settled</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Paid ({stats.paidCount})
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold mb-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pending ({stats.pendingCount})
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(stats.pendingDues)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Implement Work Type Breakdown Bar Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900/70 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.implementBreakdownTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">{t.implementBreakdownSub}</p>
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-neutral-400 hidden sm:inline-block">Mahindra 575 DI Fleet Attachments</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.workTypeBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const count = payload[0].payload.count;
                    return (
                      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
                        <p className="text-emerald-600 dark:text-emerald-400">Revenue: {formatCurrency(payload[0].value as number)}</p>
                        <p className="text-slate-500 dark:text-neutral-400">Jobs Executed: {count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {stats.workTypeBreakdown.map((_, index) => (
                  <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
