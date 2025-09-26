// src/pages/upload.jsx
import Head from "next/head";
import Sidebar from "@/components/SideBar";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  FolderOpen,
  Image,
  FileText,
  Video,
  Music,
  Menu,
  Download,
  Eye,
  CheckCircle2,
  X
} from "lucide-react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { getUser, fetchFileList, presignView, presignDownload, uploadFileToS3 } from "@/lib/api";

export default function Upload() {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState({});
  const [user, setUserState] = useState(null);
  const [items, setItems] = useState([]);

  // Success modal
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState(null); // { key, name, size }

  useEffect(() => {
    setUserState(getUser());
    refreshList();
  }, []);

  const refreshList = useCallback(async () => {
    try {
      const data = await fetchFileList();
      setItems(data.items || []);
    } catch (e) {
      console.error("List failed", e);
    }
  }, []);

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    files.forEach(uploadOne);
  };

  async function uploadOne(file) {
    const keyDisplay = file.name;
    setStatus((s) => ({ ...s, [keyDisplay]: "uploading" }));
    try {
      const res = await uploadFileToS3(file); // presign + PUT (+ SSE header) + notify
      setStatus((s) => ({ ...s, [keyDisplay]: "done" }));
      await refreshList();

      // Show success popup for this file
      setSuccessData({ key: res?.key, name: file.name, size: file.size });
      setSuccessOpen(true);
    } catch (e) {
      console.error("Upload failed", e);
      setStatus((s) => ({ ...s, [keyDisplay]: `error: ${e?.message || e}` }));
    }
  }

  async function viewFile(key) {
    try {
      const { url } = await presignView({ key });
      window.open(url, "_blank");
    } catch (e) {
      console.error("View failed", e);
      alert(`View failed: ${e?.message || e}`);
    }
  }

  async function downloadFile(key) {
    try {
      const { url } = await presignDownload({ key });
      window.location.href = url;
    } catch (e) {
      console.error("Download failed", e);
      alert(`Download failed: ${e?.message || e}`);
    }
  }

  // ===== Success Modal (inline component for convenience) =====
  function SuccessModal({ open, data, onClose, onView }) {
    if (!open || !data) return null;
    const short = data.name || data.key?.split("/").slice(-1)[0];
    const sizeMB = data.size != null ? (data.size / 1024 / 1024).toFixed(2) : null;

    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        {/* Modal */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl glass-effect bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-100">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Upload complete</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-1">
              <div className="font-medium text-slate-900 truncate">{short}</div>
              {sizeMB && (
                <div className="text-xs text-slate-500">{sizeMB} MB</div>
              )}
            </div>

            <div className="p-4 flex justify-end gap-2 border-t">
              <button
                onClick={() => onView?.(data.key)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-white"
              >
                <Eye className="w-4 h-4" /> View
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>SecureVault | Upload</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <RequireAuth>
        <div className="flex">
          <Sidebar active="upload" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-auto md:ml-64">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-4 md:hidden">
                <h1 className="text-xl font-bold">Upload</h1>
                <button onClick={() => setSidebarOpen(true)}>
                  <Menu className="w-6 h-6 text-slate-600" />
                </button>
              </div>
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link href="/dashboard">
                    <button className="border h-10 w-10 rounded-md hover:bg-white/60">
                      <ArrowLeft className="w-4 h-4 mx-auto" />
                    </button>
                  </Link>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                      {user ? `Upload Files, ${user.name || user.email}` : "Upload Files"}
                    </h1>
                    <p className="text-slate-600 mt-1">
                      {user ? `Signed in as ${user.email}` : "Add files to your storage"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg glass-effect border-0 shadow-lg">
                  <div className="bg-slate-50 p-12 text-center">
                    <div className="w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center border-4 border-slate-200 bg-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 13v8"></path>
                        <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2"></path>
                        <path d="m8 17 4-4 4 4"></path>
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Upload your files</h2>
                    <p className="text-lg text-slate-600 mb-6">Drag and drop files or click below</p>

                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <button
                      onClick={handleButtonClick}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-8 py-3 rounded-md text-sm font-medium inline-flex items-center gap-2"
                    >
                      <FolderOpen className="w-5 h-5 mr-2" />
                      Choose Files
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
                    {[
                      { label: "Images", icon: Image, desc: "PNG, JPG, GIF" },
                      { label: "Documents", icon: FileText, desc: "PDF, DOC, TXT" },
                      { label: "Videos", icon: Video, desc: "MP4, AVI, MOV" },
                      { label: "Audio", icon: Music, desc: "MP3, WAV, AAC" },
                    ].map(({ label, icon: Icon, desc }, i) => (
                      <div key={i} className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200">
                          <Icon className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="font-medium text-slate-900 text-sm">{label}</div>
                        <div className="text-xs text-slate-500">{desc}</div>
                      </div>
                    ))}
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="px-6 pb-6">
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">Selected Files:</h3>
                      <ul className="list-disc list-inside text-slate-600">
                        {selectedFiles.map((file, i) => (
                          <li key={i}>
                            <span className="mr-2">{file.name}</span>
                            <span className="text-xs text-slate-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB) — {status[file.name] || "queued"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Your files */}
                <div className="glass-effect rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Your Files</h3>
                    <button onClick={() => refreshList()} className="text-sm px-3 py-1.5 rounded-md border hover:bg-white">
                      Refresh
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-slate-500">No files uploaded yet.</p>
                  ) : (
                    <ul className="divide-y">
                      {items.map((it) => {
                        const short = it.key.split("/").slice(-1)[0];
                        return (
                          <li key={it.key} className="py-3 flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">{short}</div>
                              <div className="text-xs text-slate-500">
                                {(it.size / 1024 / 1024).toFixed(2)} MB • {new Date(it.lastModified).toLocaleString()}
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

      {/* Upload success popup */}
      <SuccessModal
        open={successOpen}
        data={successData}
        onClose={() => setSuccessOpen(false)}
        onView={(key) => viewFile(key)}
      />
    </>
  );
}
