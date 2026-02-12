'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

interface Search {
  id: string;
  job_title: string;
  location: string;
  created_at: string;
  total_jobs: number;
  job_results: { count: number }[];
}

interface JobResult {
  ai_score: number | null;
  created_at: string;
  search_id: string;
}

interface AnalyticsClientProps {
  searches: Search[];
  jobResults: JobResult[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsClient({ searches, jobResults }: AnalyticsClientProps) {
  // Process data for searches over time
  const searchesOverTime = useMemo(() => {
    const grouped = searches.reduce(
      (acc, search) => {
        const date = new Date(search.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.searches += 1;
          existing.totalJobs += search.total_jobs;
        } else {
          acc.push({
            date,
            searches: 1,
            totalJobs: search.total_jobs,
          });
        }
        return acc;
      },
      [] as { date: string; searches: number; totalJobs: number }[]
    );
    return grouped;
  }, [searches]);

  // Process data for job results per search
  const jobsPerSearch = useMemo(() => {
    return searches.map((search) => ({
      name:
        search.job_title.length > 20 ? search.job_title.substring(0, 20) + '...' : search.job_title,
      jobs: search.job_results[0]?.count || 0,
      requested: search.total_jobs,
    }));
  }, [searches]);

  // Process data for AI score distribution
  const scoreDistribution = useMemo(() => {
    const scores = jobResults.filter((jr) => jr.ai_score !== null);
    const ranges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ];

    scores.forEach((job) => {
      const score = job.ai_score!;
      const range = ranges.find((r) => score >= r.min && score <= r.max);
      if (range) range.count++;
    });

    return ranges.filter((r) => r.count > 0);
  }, [jobResults]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalSearches = searches.length;
    const totalJobs = jobResults.length;
    const avgJobsPerSearch = totalSearches > 0 ? totalJobs / totalSearches : 0;
    const avgScore =
      jobResults.filter((jr) => jr.ai_score !== null).length > 0
        ? jobResults
            .filter((jr) => jr.ai_score !== null)
            .reduce((sum, jr) => sum + jr.ai_score!, 0) /
          jobResults.filter((jr) => jr.ai_score !== null).length
        : 0;

    return {
      totalSearches,
      totalJobs,
      avgJobsPerSearch: avgJobsPerSearch.toFixed(1),
      avgScore: avgScore.toFixed(1),
    };
  }, [searches, jobResults]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>

        {/* Summary Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Searches</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalSearches}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs Found</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalJobs}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Jobs/Search</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stats.avgJobsPerSearch}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg AI Score</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stats.avgScore}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Searches Over Time */}
          {searchesOverTime.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Searches Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={searchesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="searches" stroke="#3b82f6" name="Searches" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Jobs Per Search */}
          {jobsPerSearch.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Jobs Found per Search
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobsPerSearch}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="jobs" fill="#10b981" name="Jobs Found" />
                  <Bar dataKey="requested" fill="#3b82f6" name="Requested" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AI Score Distribution */}
          {scoreDistribution.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                AI Score Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, count }) => `${range}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {scoreDistribution.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Total Jobs Over Time */}
          {searchesOverTime.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Jobs Requested Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={searchesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalJobs" fill="#f59e0b" name="Total Jobs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Empty State */}
        {searches.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No data available yet. Start by creating your first job search!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
