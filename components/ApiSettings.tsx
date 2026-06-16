import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, HelpCircle, ArrowUpRight, Copy } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { copyToClipboard, setCachedGeminiApiKey } from '../utils';

const ApiSettings: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    // Load saved key on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('user_gemini_api_key');
        if (savedKey) {
            setApiKey(savedKey);
            setIsSaved(true);
            setStatus('success');
        }
    }, []);

    // Verify and Save API Key
    const handleVerifyAndSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedKey = apiKey.trim();

        if (!trimmedKey) {
            setStatus('error');
            setErrorMessage('API Key tidak boleh kosong.');
            return;
        }

        // Warn but proceed if the key format doesn't look like a standard Google API Key (starts with AIzaSy) or Project-level Key (starts with AQ.)
        const isValidPrefix = trimmedKey.startsWith('AIzaSy') || trimmedKey.startsWith('AQ.');
        if (!isValidPrefix) {
            setStatus('error');
            setErrorMessage(
                'Format API Key tidak valid. API Key resmi dari Google AI Studio selalu diawali dengan huruf "AIzaSy" atau "AQ.". Silakan periksa kembali dan pastikan Anda menyalin seluruh baris kuncinya.'
            );
            return;
        }

        setStatus('verifying');
        setErrorMessage('');

        try {
            // Instantiate GoogleGenAI client with the user's prospective key
            const ai = new GoogleGenAI({ apiKey: trimmedKey });
            
            // Generate a simple test response to verify key is active and has permissions
            // Using the robust array of objects format for contents as proven in other components
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: 'Respond with exactly: Success' }] }],
                config: {
                    maxOutputTokens: 10
                }
            });

            if (response) {
                // Key is active and works perfectly! Save to localStorage and update memory cache
                localStorage.setItem('user_gemini_api_key', trimmedKey);
                setCachedGeminiApiKey(trimmedKey);
                setIsSaved(true);
                setStatus('success');
                // Trigger a storage event to let other components know the key has updated instantly
                window.dispatchEvent(new Event('storage'));
            } else {
                throw new Error('Gagal menerima respons dari API Gemini.');
            }
        } catch (error: any) {
            console.error('API Verification error:', error);
            setStatus('error');
            let friendlyError = error?.message || 'API Key salah atau tidak memiliki akses. Silakan periksa kembali.';
            
            // Check if the error returned is a fetch fallback/CORS or standard bad key error
            if (friendlyError.includes('Failed to fetch') || friendlyError.includes('TypeError')) {
                friendlyError = 'Gagal menghubungi server Gemini (Masalah koneksi peramban/CORS atau API Key tidak aktif). Pastikan internet Anda lancar dan API Key sudah aktif.';
            } else if (friendlyError.includes('API key not valid') || friendlyError.includes('INVALID_ARGUMENT')) {
                friendlyError = 'API Key salah atau tidak valid. Silakan periksa kembali kunci yang Anda salin dari Google AI Studio.';
            }
            
            setErrorMessage(friendlyError);
            setIsSaved(false);
        }
    };

    // Remove Saved API Key
    const handleDisconnect = () => {
        localStorage.removeItem('user_gemini_api_key');
        setCachedGeminiApiKey(null);
        setApiKey('');
        setIsSaved(false);
        setStatus('idle');
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Header section with futuristic design style */}
            <div className="relative p-6 sm:p-8 rounded-3xl overflow-hidden border border-cyan-500/15 bg-gradient-to-br from-[#0b0826]/80 via-[#07051a]/95 to-[#03020c]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-['Orbitron'] text-xs font-bold uppercase tracking-wider">
                            <Key className="w-3.5 h-3.5" />
                            Security Configuration
                        </div>
                        <h1 className="text-3xl font-black tracking-tight font-['Orbitron'] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-300">
                            HUBUNGKAN API GEMINI
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
                            Hubungkan API Key Gemini personal Anda untuk menikmati kuota mandiri tanpa batas secara gratis. 
                            Generator akan mengaktifkan credit pribadi Anda sebesar 1.500 free requests per hari.
                        </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                            isSaved 
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
                                : 'bg-[#151233]/40 border-cyan-500/20 text-cyan-400'
                        }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                isSaved ? 'bg-emerald-500/10' : 'bg-cyan-500/10'
                            }`}>
                                <ShieldCheck className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-['Orbitron'] font-semibold">Status Koneksi</p>
                                <p className="font-bold text-sm tracking-wide font-['Orbitron']">
                                    {isSaved ? 'TERHUBUNG (BYO KEY)' : 'TIDAK TERHUBUNG'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Form & Guides split section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main panel - Config form */}
                <div className="lg:col-span-7 bg-[#080614]/70 backdrop-blur-xl border border-cyan-500/10 rounded-3xl p-6 sm:p-8 space-y-6 relative">
                    <div className="flex items-center gap-3 pb-4 border-b border-cyan-500/10">
                        <Key className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-bold font-['Orbitron'] uppercase tracking-wider text-white">SETELAN KREDENSIAL API</h2>
                    </div>

                    <form onSubmit={handleVerifyAndSave} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-cyan-400/80 uppercase tracking-widest font-['Orbitron'] ml-1 block">
                                API Key Gemini Anda
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Key className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value);
                                        if (isSaved) setIsSaved(false);
                                    }}
                                    className="block w-full pl-12 pr-12 py-3.5 bg-[#0d0c1e] border border-cyan-500/20 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all font-mono text-sm leading-relaxed"
                                    placeholder="Masukkan API Key Gemini Anda di sini"
                                    required
                                    disabled={status === 'verifying'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-cyan-400 transition-colors"
                                >
                                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Connection Warning / Info Feedbacks */}
                        {status === 'verifying' && (
                            <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl flex items-center gap-3 text-cyan-200 text-sm animate-pulse">
                                <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
                                <span className="font-medium">Mewujudkan koneksi aman dan memverifikasi API Key ke server Google...</span>
                            </div>
                        )}

                        {status === 'success' && isSaved && (
                            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-emerald-300 text-sm">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold font-['Orbitron'] text-xs uppercase tracking-wider text-emerald-400 mb-0.5">Koneksi Berhasil!</p>
                                    <p className="text-emerald-100/80 leading-relaxed text-[13px]">
                                        API Key Anda terverifikasi aktif. Selamat datang di portal akses premium mandiri - Generator sekarang memproses seluruh perintah AI menggunakan credit kuota pribadi Anda secara gratis!
                                    </p>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-sm">
                                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold font-['Orbitron'] text-xs uppercase tracking-wider text-rose-400 mb-0.5">Verifikasi Gagal!</p>
                                    <p className="text-rose-100/80 leading-relaxed text-[13px]">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={status === 'verifying'}
                                className={`flex-1 py-3.5 px-6 rounded-2xl text-white font-bold text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-2 font-['Orbitron'] uppercase tracking-wider border border-transparent
                                    ${status === 'verifying'
                                        ? 'bg-slate-800 cursor-not-allowed border-slate-700 text-slate-400'
                                        : 'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:from-violet-500 hover:via-blue-500 hover:to-cyan-400 hover:scale-[1.01] hover:shadow-cyan-500/10 active:scale-[0.99]'
                                    }`}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                {status === 'verifying' ? 'Memverifikasi...' : 'Simpan & Verifikasi'}
                            </button>

                            {isSaved && (
                                <button
                                    type="button"
                                    onClick={handleDisconnect}
                                    className="py-3.5 px-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-400 hover:bg-rose-950/40 font-bold text-sm transition-all duration-200 font-['Orbitron'] uppercase tracking-wider hover:border-rose-400/40 active:scale-[0.99]"
                                >
                                    Putuskan Akses
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="pt-4 border-t border-cyan-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                            <HelpCircle className="w-4 h-4 text-cyan-400" />
                            <span>Belum punya API Key?</span>
                        </div>
                        <a 
                            href="https://aistudio.google.com/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold transition-colors uppercase tracking-widest font-['Orbitron'] text-[11px]"
                        >
                            Dapatkan API Key Gratis
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* Left panel - Guided cards and notes */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-[#080614]/70 border border-cyan-500/10 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-cyan-400/5 rounded-full blur-xl" />
                        
                        <h3 className="font-bold text-white text-base font-['Orbitron'] mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            PANDUAN GRATIS DAPETIN KEY
                        </h3>

                        <ol className="space-y-4 text-slate-300 text-sm">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs font-['Orbitron']">1</span>
                                <div className="space-y-1">
                                    <p className="font-semibold text-white">Buka Portal Google AI Studio</p>
                                    <p className="text-xs text-slate-400">
                                        Klik link panduan di bawah untuk login menggunakan akun Google biasa gratis 100%.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs font-['Orbitron']">2</span>
                                <div className="space-y-1">
                                    <p className="font-semibold text-white">Pilih "Get API Key"</p>
                                    <p className="text-xs text-slate-400">
                                        Tekan tombol biru "Get API Key" di kiri atas dashboard Google AI Studio.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs font-['Orbitron']">3</span>
                                <div className="space-y-1">
                                    <p className="font-semibold text-white">Create API Key</p>
                                    <p className="text-xs text-slate-400">
                                        Klik "Create API key", pilih project penampung baru/selesai, lalu salin kodenya.
                                    </p>
                                </div>
                            </li>
                        </ol>

                        <div className="mt-6 p-4 bg-cyan-950/10 border border-cyan-500/10 rounded-2xl">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                <strong className="text-cyan-400">Penting:</strong> Google memberikan jatah limit gratis yang sangat melimpah untuk API Key Gemini (1.500 requests/hari dan 15 RPM). Cocok untuk bisnis konten Anda!
                            </p>
                        </div>
                    </div>

                    <div className="bg-[#080614]/70 border border-cyan-500/10 rounded-3xl p-6">
                        <h3 className="font-bold text-white text-base font-['Orbitron'] mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            SKEPTIS KODE KEAMANAN
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            API Key Anda disimpan secara lokal (local storage) langsung pada peramban web (browser) Anda sendiri. 
                            Kunci Anda tidak akan pernah dikirim atau disimpan di server utama pengembang. Transaksi data diproses 
                            secara peer-to-peer dan langsung menuju server resmi Google API. Aman, transparan & privat 100%.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiSettings;
