// src/components/SideBar.jsx
import { FolderOpen, Upload, BarChart3, User, Cloud, X, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getUser, clearAuth, fetchFileStats } from "../pages/api/api";
import { useRouter } from "next/router";

export default function Sidebar({
  active = "",
  open = false,
  onClose = () => {},
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 z-10 hidden md:flex h-screen w-64 bg-white/80 backdrop-blur-md border-r border-white/20 flex-col">
        <SidebarContent active={active} onClose={onClose} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg">SecureVault</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <SidebarContent active={active} onClose={onClose} isMobile />
      </div>
    </>
  );
}

function SidebarContent({ active, onClose, isMobile = false }) {
  const [user, setUserState] = useState(null);
  const [stats, setStats] = useState({ totalFiles: 0, totalBytes: 0 });
  const router = useRouter();

  useEffect(() => {
    setUserState(getUser());

    // Load per-user stats from S3 via backend
    fetchFileStats('me')
      .then((data) => setStats({ totalFiles: data.totalFiles || 0, totalBytes: data.totalBytes || 0 }))
      .catch((e) => {
        console.error("Stats load failed:", e);
        setStats({ totalFiles: 0, totalBytes: 0 });
      });
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const totalFiles = stats.totalFiles || 0;
  const totalBytes = stats.totalBytes || 0;
  const mbUsed = (totalBytes / 1024 / 1024).toFixed(2);
  const progressPct = Math.min(
    100,
    Math.round((totalBytes / (5 * 1024 * 1024 * 1024)) * 100) // example 5GB plan
  );

  const NavLink = ({ href, children, isActive }) => (
    <Link
      href={href}
      onClick={() => isMobile && onClose()}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
        isActive ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-white/60 hover:text-indigo-700"
      }`}
    >
      {children}
    </Link>
  );

  return (
    <>
      <div className="flex flex-col gap-2 border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Cloud className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-900">SecureVault</h2>
          <p className="text-xs text-slate-500">Premium Storage</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <ul className="flex flex-col gap-1">
          <li>
            <NavLink href="/dashboard" isActive={active === "dashboard"}>
              <FolderOpen className="w-5 h-5" />
              <span>My Files</span>
            </NavLink>
          </li>
          <li>
            <NavLink href="/upload" isActive={active === "upload"}>
              <Upload className="w-5 h-5" />
              <span>Upload</span>
            </NavLink>
          </li>
          <li>
            <NavLink href="/analytics" isActive={active === "analytics"}>
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </NavLink>
          </li>
        </ul>

        <div className="mt-8 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Stats</div>
        <div className="px-4 py-3 space-y-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Total Files</span>
            <span className="font-bold text-slate-900">{totalFiles}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Storage Used</span>
            <span className="font-bold text-indigo-600">{mbUsed} MB</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {user?.name || "Guest"}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {user?.email || "Not signed in"}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );
}
