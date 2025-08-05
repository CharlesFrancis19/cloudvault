// === MOBILE-SUPPORTED ANALYTICS.JSX ===
import Head from "next/head";
import { HardDrive, ChartColumn, TrendingUp, ChartPie, Menu } from "lucide-react";
import Sidebar from "@/components/SideBar";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";

export default function Analytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const data = [
    { day: "Wed", uploads: 0 },
    { day: "Thu", uploads: 1 },
    { day: "Fri", uploads: 2 },
    { day: "Sat", uploads: 1 },
    { day: "Sun", uploads: 0 },
    { day: "Mon", uploads: 3 },
    { day: "Tue", uploads: 2 },
  ];

  return (
    <>
      <Head>
        <title>SecureVault | Analytics</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
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
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Storage Analytics
                </h1>
                <p className="text-slate-600 mt-1">Insights into your file storage usage</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Total Storage",
                    value: "0.00 MB",
                    subtitle: "0 files",
                    icon: <HardDrive className="w-6 h-6 text-indigo-600" />, iconBg: "bg-indigo-100",
                  },
                  {
                    title: "Average File Size",
                    value: "0.00 MB",
                    subtitle: "per file",
                    icon: <ChartColumn className="w-6 h-6 text-purple-600" />, iconBg: "bg-purple-100",
                  },
                  {
                    title: "Growth Rate",
                    value: "+0",
                    subtitle: "files this week",
                    icon: <TrendingUp className="w-6 h-6 text-green-600" />, iconBg: "bg-green-100",
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
                          <div className="text-2xl font-bold text-slate-900">{value}</div>
                          <div className="text-sm text-slate-500">{subtitle}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-lg bg-card text-card-foreground glass-effect border-0 shadow-lg">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight">
                      Upload Trend (Last 7 Days)
                    </h3>
                  </div>
                  <div className="p-6 pt-0">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                    <h3 className="text-2xl font-semibold leading-none tracking-tight">
                      File Types Distribution
                    </h3>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="text-center py-8">
                      <ChartPie className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                      <p className="text-slate-500">No files to analyze yet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
