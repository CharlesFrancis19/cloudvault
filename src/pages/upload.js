// src/pages/upload.jsx
import Head from "next/head";
import Sidebar from "@/components/SideBar";
import { useRef, useState } from "react";
import { ArrowLeft, FolderOpen, Image, FileText, Video, Music, Menu } from "lucide-react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { apiFetch } from "../pages/api/api";

export default function Upload() {
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState({}); // fileName -> 'idle' | 'uploading' | 'done' | 'error'

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    files.forEach(uploadOne);
  };

  async function uploadOne(file) {
    const key = file.name;
    setStatus((s) => ({ ...s, [key]: "uploading" }));
    try {
      const presign = await apiFetch("/api/files/presign/upload", {
        method: "POST",
        body: {
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size
        }
      });

      await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file
      });

      setStatus((s) => ({ ...s, [key]: "done" }));
    } catch (e) {
      console.error("Upload failed", e);
      setStatus((s) => ({ ...s, [key]: "error" }));
    }
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
                      Upload Files
                    </h1>
                    <p className="text-slate-600 mt-1">Add files to your storage</p>
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

                    <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

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
                      { label: "Audio", icon: Music, desc: "MP3, WAV, AAC" }
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

                  <div className="text-sm text-slate-500 space-y-1 px-6 pb-6">
                    <p>Maximum file size: 50MB per file</p>
                    <p>Supported formats: Images, Documents, Videos, Audio files</p>
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
              </div>
            </div>
          </main>
        </div>
      </RequireAuth>
    </>
  );
}
