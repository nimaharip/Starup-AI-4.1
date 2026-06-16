import React, { useState } from 'react';
import { 
    Image as ImageIcon, 
    Video as VideoIcon, 
    Copy, 
    Check, 
    Loader2, 
    X, 
    Search, 
    Zap, 
    AlertCircle, 
    Files 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { fileToBase64, copyToClipboard, getGeminiApiKey, hasGeminiApiKey } from '../utils';
import ApiKeyAlert from './ApiKeyAlert';

const DuplikatContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
    const [fileData, setFileData] = useState<{ mimeType: string, data: string } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [language, setLanguage] = useState<'id' | 'en'>('id');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (activeTab === 'image' && !file.type.startsWith('image/')) {
            setError('Silakan pilih file gambar.');
            return;
        }
        if (activeTab === 'video' && !file.type.startsWith('video/')) {
            setError('Silakan pilih file video.');
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            setFileData({ mimeType: file.type, data: base64 });
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
            setResult(null);
        } catch (err) {
            setError('Gagal memproses file.');
        }
    };

    const removeFile = () => {
        setFileData(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
    };

    const handleGenerate = async () => {
        if (!hasGeminiApiKey()) {
            setError("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
            return;
        }
        if (!fileData) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
            
            let systemPrompt = `Analisis media ini dan buatkan prompt yang sangat detail dan deskriptif. Prompt ini harus bisa digunakan oleh AI generator text-to-image (seperti Midjourney atau DALL-E) untuk menciptakan kembali adegan yang sangat mirip.
            Fokus pada elemen-elemen berikut:
            1. Subjek Utama: Jelaskan subjek utama secara rinci (orang, objek, hewan). Sebutkan penampilan, pakaian, ekspresi, dan tindakan mereka.
            2. Latar Belakang/Setting: Deskripsikan lingkungan secara mendalam.
            3. Gaya & Mood: Apa gaya visualnya? Apa mood atau suasananya?
            4. Pencahayaan: Jelaskan sumber cahaya dan bayangan.
            5. Komposisi & Sudut Pandang: Dari mana kita melihat adegan?
            6. Warna: Palet warna dominan.
            7. Detail Tambahan: Tekstur, pola, cuaca, dll.`;

            if (activeTab === 'video') {
                systemPrompt = `Analisis media video ini dan buatkan prompt yang sangat detail dan deskriptif. Prompt ini harus bisa digunakan oleh AI generator text-to-video (seperti Sora atau Runway) untuk menciptakan kembali klip video yang sangat mirip.
                Fokus pada: adegan & aksi utama, gerakan kamera (pan, zoom), subjek, latar belakang, gaya visual, pencahayaan, dan detail teknis lainnya.`;
            }

            systemPrompt += language === 'id' 
                ? '\nHasil akhirnya harus berupa satu paragraf teks dalam Bahasa Indonesia.' 
                : '\nThe final result must be a single paragraph of text in English.';

            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [
                    {
                        parts: [
                            { text: systemPrompt },
                            {
                                inlineData: {
                                    mimeType: fileData.mimeType,
                                    data: fileData.data
                                }
                            }
                        ]
                    }
                ],
            });

            if (response.text) {
                setResult(response.text);
            } else {
                throw new Error("Respons API tidak valid atau tidak berisi teks.");
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat menghubungi API.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            copyToClipboard(result);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 animate-in fade-in duration-500">
            {!hasGeminiApiKey() && <ApiKeyAlert />}
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-emerald-600 flex items-center justify-center gap-3">
                    <Search className="w-10 h-10" /> SCANING MEDIA TO PROMPT
                </h1>
                <p className="text-gray-500 mt-2">Dapatkan prompt dari gambar dan video yang kamu unggah</p>
            </header>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-200">
                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-full p-1 mb-6 border border-gray-200">
                    <button 
                        onClick={() => { setActiveTab('image'); removeFile(); }}
                        className={`w-1/2 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'image' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Gambar
                    </button>
                    <button 
                        onClick={() => { setActiveTab('video'); removeFile(); }}
                        className={`w-1/2 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'video' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Video
                    </button>
                </div>

                {/* Uploader area */}
                {!previewUrl ? (
                    <div className="relative">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {activeTab === 'image' ? <ImageIcon className="w-12 h-12 text-gray-400 mb-3" /> : <VideoIcon className="w-12 h-12 text-gray-400 mb-3" />}
                                <p className="mb-2 text-sm text-gray-500 font-semibold">Klik untuk mengunggah {activeTab === 'image' ? 'gambar' : 'video'}</p>
                                <p className="text-xs text-gray-400">{activeTab === 'image' ? 'PNG, JPG, GIF hingga 10MB' : 'MP4, WEBM hingga 50MB'}</p>
                            </div>
                            <input type="file" className="hidden" accept={activeTab === 'image' ? 'image/*' : 'video/*'} onChange={handleFileChange} />
                        </label>
                    </div>
                ) : (
                    <div className="text-center relative group">
                        <div className="max-h-80 rounded-2xl mx-auto mb-4 border-2 border-gray-200 overflow-hidden shadow-sm bg-black flex items-center justify-center">
                            {activeTab === 'image' ? (
                                <img src={previewUrl} alt="Preview" className="max-h-80 object-contain w-full" />
                            ) : (
                                <video src={previewUrl} controls className="max-h-80 object-contain w-full" />
                            )}
                        </div>
                        <button 
                            onClick={removeFile}
                            className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors border-2 border-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Language Selector */}
                <div className="mt-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Bahasa Prompt:</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setLanguage('id')}
                            className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${language === 'id' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                        >
                            🇮🇩 Indonesia
                        </button>
                        <button 
                            onClick={() => setLanguage('en')}
                            className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${language === 'en' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
                        >
                            🇺🇸 English
                        </button>
                    </div>
                </div>

                {/* Generate Button */}
                <button 
                    onClick={handleGenerate}
                    disabled={!fileData || isLoading}
                    className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 text-lg"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Menganalisis...</span>
                        </>
                    ) : (
                        <>
                            <Zap className="w-6 h-6" />
                            <span>Hasilkan Prompt</span>
                        </>
                    )}
                </button>

                {/* Error area */}
                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Result area */}
                {result && (
                    <div className="mt-8 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Prompt yang Dihasilkan:</h3>
                            <button 
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copyFeedback ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {copyFeedback ? <><Check className="w-3 h-3" /> Tersalin!</> : <><Copy className="w-3 h-3" /> Salin Prompt</>}
                            </button>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-gray-700 text-sm leading-relaxed font-serif italic whitespace-pre-wrap">
                            {result}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DuplikatContent;
