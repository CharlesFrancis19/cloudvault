// src/pages/analytics.js
import Head from "next/head";
import { HardDrive, ChartColumn, TrendingUp, ChartPie, Menu, RefreshCw } from "lucide-react";
import Sidebar from "@/components/SideBar";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { useState, useEffect, useMemo } from "react";
import RequireAuth from "@/components/RequireAuth";
import { getUser, getToken, apiFetch } from "./api/api";

export default function Analytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setUser(getUser());
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      setErr("");
      const token = getToken();
      const data = await apiFetch("/api/files/list", {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setItems(data.items || []);
    } catch (e) {
      setErr(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  // ---- derived stats ----
  const {
    totalFiles,
    totalBytes,
    avgBytes,
    growthCount,
    chartData,
  } = useMemo(() => {
    const totalFiles = items.length;
    const totalBytes = items.reduce((sum, it) => sum + (it.size || 0), 0);
    const avgBytes = totalFiles ? totalBytes / totalFiles : 0;

    // 7-day trend: Wed..Tue like your old sample, but generated from "today"
    const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const now = new Date();
    const last7 = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - idx)); // oldest first
      return d;
    });

    const counts = last7.map((day) => {
      const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
      const c = items.filter(it => {
        const t = new Date(it.lastModified || it.LastModified || 0).getTime();
        return t >= dayStart.getTime() && t <= dayEnd.getTime();
      }).length;
      return { day, uploads: c };
    });

    const chartData = counts.map(c => ({
      day: dayLabels[c.day.getDay()],
      uploads: c.uploads,
    }));

    const growthCount = counts.reduce((s, c) => s + c.uploads, 0);

    return { totalFiles, totalBytes, avgBytes, growthCount, chartData };
  }, [items]);

  const fmtMB = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

  return (
    <>
      <Head>
        <title>SecureVault | Analytics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <RequireAuth>
        <div className="flex">
          <Sidebar active="analytics" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-auto md:ml-64">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-4 md:hidden">
                <h1 className="text-xl font-bold">Analytics</h1>
                <button onClick={() => setSidebarOpen(true)}>
                  <Menu className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              <div className="max-w-7xl mx-auto space-y-8">
                {/* Greeting + refresh */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                      {user ? `Hello, ${user.name}` : "Storage Analytics"}
                    </h1>
                    <p className="text-slate-600 mt-1">
                      {user ? `Signed in as ${user.email}` : "Insights into your file storage usage"}
                    </p>
                  </div>
                  <button
                    onClick={refresh}
                    className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border hover:bg-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                {err && <p className="text-red-500 text-sm">{err}</p>}

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Total Storage",
                      value: fmtMB(totalBytes),
                      subtitle: `${totalFiles} file${totalFiles === 1 ? "" : "s"}`,
                      icon: <HardDrive className="w-6 h-6 text-indigo-600" />,
                      iconBg: "bg-indigo-100",
                    },
                    {
                      title: "Average File Size",
                      value: fmtMB(avgBytes),
                      subtitle: "per file",
                      icon: <ChartColumn className="w-6 h-6 text-purple-600" />,
                      iconBg: "bg-purple-100",
                    },
                    {
                      title: "Growth (7 days)",
                      value: `+${growthCount}`,
                      subtitle: "files this week",
                      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
                      iconBg: "bg-green-100",
                    },
                  ].map(({ title, value, subtitle, icon, iconBg }, i) => (
                    <div key={i} className="rounded-lg bg-card text-card-foreground glass-effect border-0 shadow-lg">
                      <div className="flex flex-col space-y-1.5 p-6 pb-3">
                        <h3 className="tracking-tight text-sm font-medium text-slate-600">{title}</h3>
                      </div>
                      <div className="p-6 pt-0">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
                          <div>
                            <div className="text-2xl font-bold text-slate-900">{loading ? "…" : value}</div>
                            <div className="text-sm text-slate-500">{loading ? "Loading…" : subtitle}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-lg bg-card text-card-foreground glass-effect border-0 shadow-lg">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight">Upload Trend (Last 7 Days)</h3>
                    </div>
                    <div className="p-6 pt-0">
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-lg bg-card text-card-foreground glass-effect border-0 shadow-lg">
                    <div className="flex flex-col space-y-1.5 p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight">File Types Distribution</h3>
                    </div>
                    <div className="p-6 pt-0">
                      <div className="text-center py-8">
                        <ChartPie className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                        <p className="text-slate-500">Connect a chart library for pies or add API buckets by MIME type.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </main>
        </div>
      </RequireAuth>
    </>
  );
}
