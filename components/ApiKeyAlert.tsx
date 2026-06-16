import React from 'react';
import { AlertTriangle, Key } from 'lucide-react';

const ApiKeyAlert: React.FC = () => {
    return (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2.5xl flex items-start gap-3.5 text-amber-300 text-sm animate-in fade-in slide-in-from-top-4 duration-300 mb-6">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                <Key className="w-4 h-4" />
            </div>
            <div className="flex-1">
                <p className="font-black uppercase tracking-widest text-[10px] font-['Orbitron'] text-amber-400 mb-1">Setelan API Gemini Kosong</p>
                <p className="text-amber-200/90 text-[13px] leading-relaxed">
                    Silakan masukkan API Key Gemini Anda di menu <span className="font-bold text-white uppercase tracking-wider font-['Orbitron'] text-xs">Setelan API (Hubungkan API)</span> untuk mulai menggunakan fitur secara gratis.
                </p>
            </div>
        </div>
    );
};

export default ApiKeyAlert;
