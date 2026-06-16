
import React, { useState, useEffect } from 'react';
import { Upload, Camera, Zap, Video, Download, Copy, RefreshCw, X, Eye, Type, Loader2, Image as ImageIcon, Film, ClipboardCheck, MessageSquare, Move } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { fileToBase64, compressImage, downloadImage, copyToClipboard, delay, pcmToWav, base64ToArrayBuffer, getGeminiApiKey, hasGeminiApiKey } from '../utils';
import ApiKeyAlert from './ApiKeyAlert';

const ASPECT_RATIOS = {
    portrait: { label: '9:16 (Story/Reels)', width: 9, height: 16 },
    vertical: { label: '4:5 (Feed)', width: 4, height: 5 },
    square: { label: '1:1 (Square)', width: 1, height: 1 },
    landscape: { label: '16:9 (Youtube)', width: 16, height: 9 }
};

const VIDEO_STYLES = [
    { id: 'general', label: 'General (Default/Semula)' },
    { id: 'hard_sell', label: '⚡ Hard Selling (Promo/Diskon)' },
    { id: 'soft_sell', label: '🍃 Soft Selling (Edukasi/Manfaat)' },
    { id: 'story_sell', label: '📖 Story Selling (Cerita/Emosi)' },
    { id: 'tiktok_viral', label: '🔥 TikTok Viral Hook (Tanpa Harga & Diskon)' },
    { id: 'cinematic', label: '🎬 Cinematic (Estetik/Mewah)' },
    { id: 'review', label: '⭐ Review/Testimoni (Jujur)' }
];

interface GeneratedItem {
    id: string;
    prompt: string;
    image: string | null;
    loading: boolean;
    progress: number;
    videoPrompt?: { visual: string; dialog: string } | null;
    videoUrl?: string | null;
    videoLoading?: boolean;
    selectedStyle?: string; // New field for style selection per item
}

const AffiliateContentGenerator: React.FC = () => {
    // Inputs
    const [productImage, setProductImage] = useState<string | null>(null);
    const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [logo, setLogo] = useState<string | null>(null);
    
    const [productInfo, setProductInfo] = useState('');
    const [modelStyle, setModelStyle] = useState('');
    const [poseDescription, setPoseDescription] = useState('');
    const [storeName, setStoreName] = useState('');
    const [accent, setAccent] = useState('');
    
    const [ratio, setRatio] = useState<keyof typeof ASPECT_RATIOS>('portrait');
    const [language, setLanguage] = useState('Indonesia');
    const [useText, setUseText] = useState(false);

    // Outputs
    const [results, setResults] = useState<Record<string, GeneratedItem[]>>({
        broll: [],
        ugc: [],
        commercial: [],
        store_model: []
    });
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // --- AI LOGIC ---

    const generateContent = async () => {
        if (!hasGeminiApiKey()) {
            alert("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
            return;
        }
        if (!productImage) {
            alert("Harap unggah foto produk utama.");
            return;
        }

        setIsGenerating(true);
        setLoadingMessage('Menganalisa Produk & Membuat Konsep...');
        
        // Reset Results
        setResults({ broll: [], ugc: [], commercial: [], store_model: [] });

        try {
            const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
            
            // 1. Generate Prompts Plan
            const creativeDirectorPrompt = `
                Sebagai Creative Director, buat 16 konsep foto untuk produk ini ('${productInfo || 'Produk di gambar'}').
                Nama Toko: ${storeName || 'Toko'}.
                
                Kategori Output (JSON):
                1. broll (4 ide): Fokus detail, makro, tekstur. Tanpa model.
                2. ugc (4 ide): Gaya kasual, testimoni, hook visual. Ada model/tangan.
                3. commercial (4 ide): Produk dipajang di rak toko, etalase, meja display.
                4. store_model (4 ide): Model berpose di dalam toko/depan rak. Wajib sertakan elemen signage/branding toko bertuliskan '${storeName}'.

                Output JSON format:
                {
                    "broll": ["prompt 1", "prompt 2", "prompt 3", "prompt 4"],
                    "ugc": ["prompt 1", "prompt 2", "prompt 3", "prompt 4"],
                    "commercial": ["prompt 1", "prompt 2", "prompt 3", "prompt 4"],
                    "store_model": ["prompt 1", "prompt 2", "prompt 3", "prompt 4"]
                }
            `;

            const planResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { text: creativeDirectorPrompt },
                    { inlineData: { mimeType: 'image/jpeg', data: productImage } }
                ],
                config: { responseMimeType: 'application/json' }
            });

            const plan = JSON.parse(planResponse.text || '{}');
            
            // Initialize placeholders
            const initialResults: Record<string, GeneratedItem[]> = {
                broll: [], ugc: [], commercial: [], store_model: []
            };

            Object.keys(initialResults).forEach(key => {
                if (plan[key]) {
                    initialResults[key] = plan[key].map((prompt: string, idx: number) => ({
                        id: `${key}-${idx}`,
                        prompt: prompt,
                        image: null,
                        loading: true,
                        progress: 0,
                        videoLoading: false,
                        videoUrl: null,
                        selectedStyle: 'general' // Default style
                    }));
                }
            });

            setResults(initialResults);
            setLoadingMessage('Mulai Melukis Foto...');

            // 2. Parallel Generation
            const categories = ['broll', 'ugc', 'commercial', 'store_model'];
            const tasks: Promise<void>[] = [];

            for (const cat of categories) {
                if (!initialResults[cat]) continue;
                
                initialResults[cat].forEach((item, idx) => {
                    tasks.push(generateSingleImage(cat, idx, item.prompt));
                });
            }
            
            // Execute all tasks in parallel concurrently using Promise.all for super fast generation
            await Promise.all(tasks);
            
        } catch (error) {
            console.error(error);
            alert("Gagal membuat konten. Coba lagi.");
        } finally {
            setIsGenerating(false);
        }
    };

    const generateSingleImage = async (category: string, index: number, promptText: string, retryCount = 0) => {
        // Add staggered delay to avoid rate limits
        const delayMs = (index * 1500) + (['broll', 'ugc', 'commercial', 'store_model'].indexOf(category) * 500);
        await delay(delayMs);

        try {
            const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
            
            // Construct Prompt
            let finalPrompt = `Foto rasio ${ASPECT_RATIOS[ratio].label}. ${promptText}. `;
            if (productInfo) finalPrompt += ` Konteks: ${productInfo}.`;
            
            // Image Parts
            const parts: any[] = [
                { text: finalPrompt },
                { inlineData: { mimeType: 'image/jpeg', data: productImage! } }
            ];

            // Add Logic for Models
            if (category === 'ugc' || category === 'store_model') {
                if (models.length > 0) {
                    finalPrompt += ` PERTAHANKAN IDENTITAS WAJAH MODEL. Gunakan wajah dari gambar referensi model yang dilampirkan.`;
                    models.forEach(m => {
                        parts.push({ inlineData: { mimeType: 'image/jpeg', data: m } });
                    });
                } else {
                    finalPrompt += ` Gunakan model AI (Indonesia/Malaysia).`;
                }
                
                if (category === 'store_model' && storeName) {
                    finalPrompt += ` Pastikan ada signage/tulisan '${storeName}' di background toko.`;
                }
                
                if (modelStyle) finalPrompt += ` Model memakai: ${modelStyle}.`;
                if (poseDescription) finalPrompt += ` Pose: ${poseDescription}.`;
            } else {
                finalPrompt += " TANPA MODEL MANUSIA. Fokus produk.";
            }

            if (additionalPhotos.length > 0) {
                additionalPhotos.slice(0, 2).forEach(p => {
                    parts.push({ inlineData: { mimeType: 'image/jpeg', data: p } });
                });
            }

            parts[0].text = finalPrompt;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{ parts }],
                config: {
                    imageConfig: { aspectRatio: ratio === 'square' ? '1:1' : (ratio === 'landscape' ? '16:9' : (ratio === 'portrait' ? '9:16' : '3:4')) }
                }
            });

            const imgData = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

            if (imgData) {
                setResults(prev => ({
                    ...prev,
                    [category]: prev[category].map((item, i) => 
                        i === index ? { ...item, image: imgData, loading: false, progress: 100 } : item
                    )
                }));
            } else {
                throw new Error("No image data");
            }
        } catch (error) {
            console.error(`Failed ${category} ${index}`, error);
            if (retryCount < 2) {
                await delay(2000);
                return generateSingleImage(category, index, promptText, retryCount + 1);
            }
            setResults(prev => ({
                ...prev,
                [category]: prev[category].map((item, i) => 
                    i === index ? { ...item, loading: false, progress: 0, image: null } : item
                )
            }));
        }
    };

    // --- FILE HANDLERS ---

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<any>>, isList = false) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (isList) {
            const promises = Array.from(files).map((f) => fileToBase64(f as File).then(b64 => compressImage(`data:image/jpeg;base64,${b64}`)).then(d => d.split(',')[1])); // store raw b64
            const newB64s = await Promise.all(promises);
            setter((prev: string[]) => [...prev, ...newB64s].slice(0, 4));
        } else {
            const b64 = await fileToBase64(files[0]);
            const compressed = await compressImage(`data:image/jpeg;base64,${b64}`);
            setter(compressed.split(',')[1]); // Store raw base64
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {!hasGeminiApiKey() && <ApiKeyAlert />}
                <header className="mb-10 text-center border-b border-zinc-900 pb-6">
                    <h1 className="text-3xl font-black text-white tracking-tight mb-1 flex items-center justify-center gap-2">
                        <Zap className="w-8 h-8 text-white fill-white" /> AFFILIATE CONTENT GENERATOR
                    </h1>
                    <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Monochrome Edition v5.1 • Powered by Gemini</p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* LEFT PANEL: INPUTS */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        
                        {/* 1. UPLOAD */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
                            <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
                                <Camera className="w-4 h-4" /> 1. Produk & Foto
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-zinc-500 text-[10px] uppercase font-bold mb-2">Foto Produk Utama (Wajib)</label>
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => handleFile(e, setProductImage)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className={`h-40 w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all ${productImage ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-600'}`}>
                                            {productImage ? (
                                                <img src={`data:image/jpeg;base64,${productImage}`} className="h-full w-full object-cover rounded-lg opacity-60" />
                                            ) : (
                                                <div className="text-center text-zinc-600">
                                                    <Upload className="w-8 h-8 mx-auto mb-2" />
                                                    <span className="text-xs uppercase font-bold">Upload Foto</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-zinc-500 text-[10px] uppercase font-bold mb-2">Foto Pendukung (Opsional)</label>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        <label className="flex-shrink-0 w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition">
                                            <Upload className="w-4 h-4 text-zinc-500" />
                                            <input type="file" multiple accept="image/*" onChange={(e) => handleFile(e, setAdditionalPhotos, true)} className="hidden" />
                                        </label>
                                        {additionalPhotos.map((p, i) => (
                                            <div key={i} className="flex-shrink-0 w-20 h-20 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative group">
                                                <img src={`data:image/jpeg;base64,${p}`} className="w-full h-full object-cover" />
                                                <button onClick={() => setAdditionalPhotos(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. DESCRIPTION */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
                            <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
                                <Type className="w-4 h-4" /> 2. Deskripsi & Detail
                            </h3>
                            <div className="space-y-3">
                                <textarea 
                                    value={productInfo} 
                                    onChange={(e) => setProductInfo(e.target.value)}
                                    placeholder="Jelaskan produk dan suasana yang diinginkan..."
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none h-24"
                                />
                            </div>
                        </div>

                        {/* 3. MODEL */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
                            <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> 3. Model & Gaya
                            </h3>
                            <div className="space-y-4">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    <label className="flex-shrink-0 w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800 transition text-center p-2">
                                        <Upload className="w-4 h-4 text-zinc-500 mb-1" />
                                        <span className="text-[8px] text-zinc-500 uppercase">Wajah Model</span>
                                        <input type="file" multiple accept="image/*" onChange={(e) => handleFile(e, setModels, true)} className="hidden" />
                                    </label>
                                    {models.map((p, i) => (
                                        <div key={i} className="flex-shrink-0 w-20 h-20 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative group">
                                            <img src={`data:image/jpeg;base64,${p}`} className="w-full h-full object-cover" />
                                            <button onClick={() => setModels(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3"/></button>
                                        </div>
                                    ))}
                                </div>
                                <input 
                                    type="text"
                                    value={modelStyle}
                                    onChange={(e) => setModelStyle(e.target.value)}
                                    placeholder="Pakaian Model (Cth: Kaos Polos Hitam)"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                                />
                                <input 
                                    type="text"
                                    value={poseDescription}
                                    onChange={(e) => setPoseDescription(e.target.value)}
                                    placeholder="Pose (Cth: Memegang produk di sebelah pipi)"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                                />
                            </div>
                        </div>

                        {/* 4. SETTINGS */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-lg">
                            <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">4. Pengaturan</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-zinc-500 text-[10px] uppercase font-bold mb-1">Rasio</label>
                                    <select 
                                        value={ratio} 
                                        onChange={(e) => setRatio(e.target.value as any)} 
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                                    >
                                        {Object.entries(ASPECT_RATIOS).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-zinc-500 text-[10px] uppercase font-bold mb-1">Bahasa</label>
                                    <select 
                                        value={language} 
                                        onChange={(e) => setLanguage(e.target.value)} 
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                                    >
                                        <option>Indonesia</option>
                                        <option>English</option>
                                        <option>Malaysia</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-zinc-500 text-[10px] uppercase font-bold mb-1">Nama Toko (Signage)</label>
                                    <input 
                                        type="text"
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        placeholder="Contoh: Toko Berkah"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 text-[10px] uppercase font-bold mb-1">Aksen (Jawa/Jaksel)</label>
                                    <input 
                                        type="text"
                                        value={accent}
                                        onChange={(e) => setAccent(e.target.value)}
                                        placeholder="Opsional"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={generateContent}
                            disabled={isGenerating}
                            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all 
                                ${isGenerating 
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                    : 'bg-white text-black hover:bg-zinc-200 hover:shadow-white/10'}`}
                        >
                            {isGenerating ? 'Memproses...' : 'GENERATE KONTEN SEKARANG'}
                        </button>

                    </div>

                    {/* RIGHT PANEL: OUTPUTS */}
                    <div className="w-full lg:w-2/3 space-y-12 pb-20">
                        {/* Loading State */}
                        {isGenerating && (
                            <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800">
                                <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                                <p className="text-zinc-400 font-mono text-xs uppercase animate-pulse">{loadingMessage}</p>
                            </div>
                        )}

                        {/* Results */}
                        {!isGenerating && Object.keys(results).map((category) => (
                            <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-2">
                                    {category.replace('_', ' ')} 
                                    <span className="text-zinc-600 text-lg font-light">COLLECTION</span>
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {results[category].map((item, idx) => (
                                        <div key={item.id} className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-lg group relative flex flex-col">
                                            
                                            {/* Image Area */}
                                            <div className="relative w-full bg-black/50" style={{ aspectRatio: `${ASPECT_RATIOS[ratio].width}/${ASPECT_RATIOS[ratio].height}` }}>
                                                {item.loading ? (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-zinc-600 text-[10px] uppercase font-bold animate-pulse">Rendering</span>
                                                        <div className="w-20 h-1 bg-zinc-900 mt-2 rounded-full overflow-hidden">
                                                            <div className="h-full bg-white animate-progress origin-left"></div>
                                                        </div>
                                                    </div>
                                                ) : item.image ? (
                                                    <>
                                                        <img src={item.image.startsWith('http://') || item.image.startsWith('https://') ? item.image : `data:image/jpeg;base64,${item.image}`} className="w-full h-full object-cover" />
                                                        
                                                        {/* Overlay Actions */}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                                            <button onClick={() => setPreviewImage(item.image!.startsWith('http://') || item.image!.startsWith('https://') ? item.image! : `data:image/jpeg;base64,${item.image}`)} className="p-2 bg-white text-black rounded-full hover:bg-zinc-200"><Eye className="w-4 h-4"/></button>
                                                            <button onClick={() => downloadImage(item.image!, `affiliate-${item.id}.jpg`)} className="p-2 bg-white text-black rounded-full hover:bg-zinc-200"><Download className="w-4 h-4"/></button>
                                                            <button onClick={() => generateSingleImage(category, idx, item.prompt)} className="p-2 bg-white text-black rounded-full hover:bg-zinc-200"><RefreshCw className="w-4 h-4"/></button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-xs">Gagal Load</div>
                                                )}
                                                                              {/* Idea Prompt Area */}
                                            <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex-1 flex flex-col justify-between min-h-[100px]">
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[9px] font-mono uppercase bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800">Prompt Ide</span>
                                                        <button onClick={() => copyToClipboard(item.prompt)} className="text-zinc-500 hover:text-white bg-zinc-900 p-1 rounded hover:bg-zinc-800" title="Salin Prompt"><Copy className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                    <p className="text-zinc-300 text-[11px] mt-2 italic leading-relaxed">"{item.prompt}"</p>
                                                </div>
                                            </div>                </div>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                    <button className="absolute top-4 right-4 text-white hover:text-zinc-400"><X className="w-8 h-8"/></button>
                    <img src={previewImage} className="max-h-[90vh] max-w-full rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};

export default AffiliateContentGenerator;
