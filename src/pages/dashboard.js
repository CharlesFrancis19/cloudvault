import Head from "next/head";
import { Plus, Grid3x3, List, Search, Menu } from "lucide-react";
import Sidebar from "@/components/SideBar";
import Link from "next/link";
import { useState } from "react";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Head>
        <title>SecureVault | Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="flex">
        <Sidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-auto md:ml-64 w-full">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h1 className="text-xl font-bold">Dashboard</h1>
              <button onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    My Files
                  </h1>
                  <p className="text-slate-600 mt-1">Manage and organize your files</p>
                </div>
                <Link href="/upload">
                  <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-4 py-2 rounded-md h-10 font-medium text-sm transition-all duration-300">
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Files
                  </button>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {["Total Files", "Storage Used", "Favorites", "Recent"].map((label, idx) => (
                  <div key={idx} className="rounded-lg glass-effect bg-white text-card-foreground border-0 shadow-sm hover:shadow-lg transition-all duration-300">
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100">
                          <Search className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-slate-900">0</div>
                          <div className="text-sm text-slate-500">{label}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="glass-effect rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      placeholder="Search files..."
                      className="pl-10 border border-slate-200 rounded-md w-full h-10 focus:border-indigo-300 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="inline-flex bg-slate-100 rounded-md p-1">
                      {["All", "Favorites", "Images", "Documents"].map((tab, i) => (
                        <button
                          key={i}
                          className="px-3 py-1.5 text-sm font-medium rounded-sm hover:bg-white"
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                      <button className="bg-white px-3 py-1.5 rounded-md">
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button className="hover:bg-slate-200 px-3 py-1.5 rounded-md">
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="glass-effect rounded-2xl p-6 shadow-sm">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No files found</h3>
                  <p className="text-slate-500">Upload your first file to get started</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}