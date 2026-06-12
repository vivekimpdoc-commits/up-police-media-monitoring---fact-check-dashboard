import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';
import { NewsItem, MediaAlert } from './types';

interface AnalyticsProps {
  newsList: NewsItem[];
  alerts: MediaAlert[];
}

export default function AnalyticsDashboard({ newsList, alerts }: AnalyticsProps) {
  // Calculate Sentiment Data
  const sentimentData = [
    { name: 'Positive', value: newsList.filter(n => n.sentiment === 'Positive').length },
    { name: 'Negative', value: newsList.filter(n => n.sentiment === 'Negative').length },
    { name: 'Neutral', value: newsList.filter(n => n.sentiment === 'Neutral').length }
  ];
  const COLORS = ['#10b981', '#ef4444', '#64748b'];

  // Calculate Alerts by Level
  const alertData = [
    { name: 'Critical', value: alerts.filter(a => a.type === 'Critical').length },
    { name: 'Warning', value: alerts.filter(a => a.type === 'Warning').length },
    { name: 'Info', value: alerts.filter(a => a.type === 'Info').length }
  ];
  const ALERT_COLORS = ['#dc2626', '#f59e0b', '#3b82f6'];

  // Calculate Trend over last 7 days
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const trendData = last7Days.map(date => {
    return {
      date: date.substring(5), // mm-dd
      news: newsList.filter(n => n.date.startsWith(date)).length,
      alerts: alerts.filter(a => a.timestamp.startsWith(date)).length
    };
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Media Analytics Dashboard</h2>
        <p className="text-slate-500 mt-2">Comprehensive overview of media sentiment and active alerts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sentiment Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Overall News Sentiment</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Active Alerts by Severity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alertData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {alertData.map((entry, index) => (
                    <Cell key={\`cell-\${index}\`} fill={ALERT_COLORS[index % ALERT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7-Day Trend Line Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">7-Day Activity Trend</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="news" name="News Articles" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="alerts" name="Media Alerts" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
