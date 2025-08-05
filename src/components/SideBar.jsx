import { FolderOpen, Upload, BarChart3, User, Cloud } from 'lucide-react';
import Link from 'next/link';

export default function Sidebar({ active = '' }) {
  return (
    <div className="fixed inset-y-0 z-10 hidden h-screen w-64 bg-white/80 backdrop-blur-md border-r border-white/20 md:flex flex-col">
      <div className="flex flex-col gap-2 border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-slate-900">CloudVault</h2>
            <p className="text-xs text-slate-500">Premium Storage</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <ul className="flex flex-col gap-1">
          <li>
            <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${active === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-white/60 hover:text-indigo-700'}`}>
              <FolderOpen className="w-5 h-5" />
              <span>My Files</span>
            </Link>
          </li>
          <li>
            <Link href="/upload" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${active === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-white/60 hover:text-indigo-700'}`}>
              <Upload className="w-5 h-5" />
              <span>Upload</span>
            </Link>
          </li>
          <li>
            <Link href="/analytics" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${active === 'analytics' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-white/60 hover:text-indigo-700'}`}>
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
          </li>
        </ul>

        <div className="mt-8 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Stats</div>
        <div className="px-4 py-3 space-y-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Total Files</span>
            <span className="font-bold text-slate-900">0</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Storage Used</span>
            <span className="font-bold text-indigo-600">0 MB</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-1.5 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">User</p>
            <p className="text-xs text-slate-500 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}