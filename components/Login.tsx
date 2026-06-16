
import React, { useState } from 'react';
import { Lock, User as UserIcon, LogIn, AlertCircle, Clock } from 'lucide-react';
import { User } from '../types';
import { getStoredUsers } from '../utils';
import Logo from './Logo';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        if (!cleanUsername || !cleanPassword) {
            setError('Mohon isi Username dan Sandi.');
            setLoading(false);
            return;
        }

        // Simulate network delay for UX
        setTimeout(() => {
            // ALWAYS fetch fresh data from storage to prevent stale password issues
            const users = getStoredUsers();
            
            const foundUser = users.find(u => 
                u.username.trim() === cleanUsername && 
                u.password.trim() === cleanPassword
            );

            if (foundUser) {
                // Cek Masa Aktif
                if (foundUser.expiryDate && Date.now() > foundUser.expiryDate) {
                    setError('Masa aktif akun ini telah habis (Nonaktif). Hubungi Admin.');
                    setLoading(false);
                } else {
                    onLogin(foundUser);
                }
            } else {
                setError('Username atau Password salah!');
                setLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#03020c] p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[130px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[130px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md bg-[#080614]/70 backdrop-blur-2xl border border-cyan-500/15 rounded-3xl shadow-2xl shadow-cyan-950/20 p-8 relative z-10">
                <div className="text-center mb-8 flex flex-col items-center">
                    <Logo className="mb-4" showTagline={false} />
                    <p className="text-slate-400 text-sm uppercase tracking-widest font-['Orbitron']">Akses Generator</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider ml-1 font-['Orbitron']">Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 bg-[#0d0c1e] border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all font-sans"
                                placeholder="Masukkan username"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-cyan-400/80 uppercase tracking-wider ml-1 font-['Orbitron']">Sandi</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 bg-[#0d0c1e] border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all font-sans"
                                placeholder="Masukkan sandi"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-200 text-sm">
                            {error.includes('aktif') ? <Clock className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-blue-900/10 transition-all duration-300 flex items-center justify-center gap-2 font-['Orbitron'] uppercase tracking-wider
                            ${loading 
                                ? 'bg-slate-800 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:from-violet-500 hover:via-blue-500 hover:to-cyan-400 hover:shadow-cyan-500/20 hover:scale-[1.02]'
                            }`}
                    >
                        {loading ? 'Memproses...' : (
                            <>
                                Masuk <LogIn className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-xs text-gray-400">
                        Masuk menggunakan akun yang telah diberikan oleh Admin.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
