import { useRouter } from 'next/router';
import { useState } from 'react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { FaGoogle } from 'react-icons/fa';
import { Mail, Lock } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (email.trim() === 'admin' && password.trim() === 'admin') {
      router.push('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10 bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-xl opacity-30 group-hover:opacity-40 transition-opacity duration-300"></div>
            <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50 group-hover:shadow-xl transition-all duration-300">
              <img className="aspect-square h-full w-full object-cover" alt="SecureVault logo" src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/36178ee92_logo.png" />
            </span>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Welcome to SecureVault</h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium">Sign in to continue</p>
          </div>

          <div className="w-full space-y-3">
            <button className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all duration-200 font-medium text-[15px]">
              <img height="18" width="18" src="https://cdn.simpleicons.org/google" alt="Google logo" className="-ml-4" />
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="h-[1px] w-full bg-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">or</span>
              </div>
            </div>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" id="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="password" id="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm" />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm -mt-2">{error}</p>}

              <button type="submit" className="inline-flex items-center justify-center gap-2 w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm rounded-xl transition-all duration-200">
                Sign in
              </button>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 mt-4">
              <button type="button" className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">Forgot password?</button>
              <button type="button" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Need an account? <span className="font-medium text-slate-700">Sign up</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}