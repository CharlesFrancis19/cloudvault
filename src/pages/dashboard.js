// src/pages/dashboard.js
import Head from "next/head";
import { Plus, Grid3x3, List, Search, Menu, Eye, Download, RefreshCw, Trash2 } from "lucide-react";
import Sidebar from "@/components/SideBar";
import Link from "next/link";
import { useState, useEffect } from "react";
import RequireAuth from "@/components/RequireAuth";
import { getUser, fetchFileList, presignView, presignDownload, deleteFile } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteKey, setToDeleteKey] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setUser(getUser());
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshList() {
    try {
      setLoading(true);
      setError("");
      const data = await fetchFileList();
      setItems(data.items || []);
    } catch (e) {
      setError(e.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  async function viewFile(key) {
    try {
      const { url } = await presignView({ key });
      window.open(url, "_blank");
    } catch (e) {
      alert(e.message || "Failed to view file");
    }
  }

  async function downloadFile(key) {
    try {
      const { url } = await presignDownload({ key });
      window.location.href = url;
    } catch (e) {
      alert(e.message || "Failed to download file");
    }
  }

  // open the modal (no browser confirm)
  function askDelete(key) {
    setToDeleteKey(key);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!toDeleteKey) return;
    setDeleting(true);
    try {
      await deleteFile({ key: toDeleteKey });
      setItems((prev) => prev.filter((it) => it.key !== toDeleteKey));
      setConfirmOpen(false);
      setToDeleteKey(null);
    } catch (e) {
      alert(e.message || "Failed to delete file");
    } finally {
      setDeleting(false);
    }
  }

  function cancelDelete() {
    if (deleting) return;
    setConfirmOpen(false);
    setToDeleteKey(null);
  }

  return (
    <>
      <Head>
        <title>SecureVault | Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <RequireAuth>
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
                {/* Greeting */}
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    {user ? `Welcome, ${user.name || user.email}` : "Welcome to SecureVault"}
                  </h1>
                  <p className="text-slate-600 mt-1">
                    {user ? `Signed in as ${user.email}` : "Manage and organize your files"}
                  </p>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <Link href="/upload">
                    <button className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-4 py-2 rounded-md h-10 font-medium text-sm transition-all duration-300">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Files
                    </button>
                  </Link>
                </div>

                {/* Simple stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {["Total Files", "Storage Used", "Favorites", "Recent"].map((label, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg glass-effect bg-white text-card-foreground border-0 shadow-sm hover:shadow-lg transition-all duration-300"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-100">
                            <Search className="w-5 h-5 text-slate-500" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-slate-900">
                              {label === "Total Files" ? items.length : 0}
                            </div>
                            <div className="text-sm text-slate-500">{label}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Search / filters */}
                <div className="glass-effect rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 w-full max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        placeholder="Search files..."
                        className="pl-10 border border-slate-200 rounded-md w-full h-10 focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <div className="inline-flex bg-slate-100 rounded-md p-1">
                        {["All", "Favorites", "Images", "Documents"].map((tab, i) => (
                          <button key={i} className="px-3 py-1.5 text-sm font-medium rounded-sm hover:bg-white">
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

                {/* Files list */}
                <div className="glass-effect rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">Your Files</h3>
                    <button
                      onClick={refreshList}
                      className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border hover:bg-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>

                  {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                  {loading ? (
                    <p className="text-slate-500">Loading…</p>
                  ) : items.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No files found</h3>
                      <p className="text-slate-500">Upload your first file to get started</p>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {items.map((it) => {
                        const short = it.key.split("/").slice(-1)[0];
                        return (
                          <li key={it.key} className="py-3 flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">{short}</div>
                              <div className="text-xs text-slate-500">
                                {(it.size / 1024 / 1024).toFixed(2)} MB •{" "}
                                {new Date(it.lastModified).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewFile(it.key)}
                                className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border hover:bg-white"
                              >
                                <Eye className="w-4 h-4" /> View
                              </button>
                              <button
                                onClick={() => downloadFile(it.key)}
                                className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border hover:bg-white"
                              >
                                <Download className="w-4 h-4" /> Download
                              </button>
                              <button
                                onClick={() => askDelete(it.key)}
                                className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border hover:bg-white text-red-600 border-red-200"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </RequireAuth>

      {/* Confirm delete modal */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete file"
        message={
          toDeleteKey
            ? `Delete “${toDeleteKey.split("/").slice(-1)[0]}”? This cannot be undone.`
            : "Delete this file? This cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
