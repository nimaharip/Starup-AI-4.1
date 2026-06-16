
import React, { useState } from 'react';
/* Added Loader2 to lucide-react imports */
import { Camera, Film, Mic, Play, Pause, Copy, RefreshCw, Image as ImageIcon, Settings, Download, AlertCircle, Music, User, Lightbulb, Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { copyToClipboard, downloadImage, pcmToWav, base64ToArrayBuffer, delay, getGeminiApiKey, hasGeminiApiKey, mapVoiceNameToGeminiVoice } from '../utils';
import ApiKeyAlert from './ApiKeyAlert';

// Daftar Suara Gemini TTS yang tersedia
const AVAILABLE_VOICES = [
    { name: "Aoede", label: "Aoede (Wanita - Tenang)" },
    { name: "Charon", label: "Charon (Pria - Dalam)" },
    { name: "Fenrir", label: "Fenrir (Pria - Cepat)" },
    { name: "Kore", label: "Kore (Wanita - Lembut)" },
    { name: "Leda", label: "Leda (Wanita - Formal)" },
    { name: "Puck", label: "Puck (Pria - Enerjik)" },
    { name: "Zephyr", label: "Zephyr (Pria - Narator)" },
    { name: "Orus", label: "Orus (Pria - Berat)" },
    { name: "Callirrhoe", label: "Callirrhoe (Wanita - Ceria)" },
    { name: "Enceladus", label: "Enceladus (Pria - Serius)" }
];

const FaktaMenarik: React.FC = () => {
    // --- State ---
    const [topic, setTopic] = useState("");
    const [theme, setTheme] = useState("Cinematic Realistic");
    const [ratio, setRatio] = useState("9:16");
    const [language, setLanguage] = useState("Bahasa Indonesia");
    const [customLanguage, setCustomLanguage] = useState("");
    const [selectedVoice, setSelectedVoice] = useState("Aoede");
    
    const [scenes, setScenes] = useState<any[]>([]);
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [loadingImages, setLoadingImages] = useState<Record<number, boolean>>({});
    const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
    const [downloadingAudio, setDownloadingAudio] = useState<number | 'full' | null>(null);
    
    const [errorMsg, setErrorMsg] = useState("");
    const [copySuccess, setCopySuccess] = useState("");

    // --- Helper: Call Gemini for Text ---
    const generateStory = async () => {
        if (!hasGeminiApiKey()) {
            setErrorMsg("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
            return;
        }
        if (!topic) {
            setErrorMsg("Mohon isi judul atau topik fakta menariknya.");
            return;
        }
        setErrorMsg("");
        setIsGeneratingText(true);
        setScenes([]);

        const targetLang = customLanguage || language;
        const ratioText = ratio === "9:16" ? "Vertical (9:16)" : "Widescreen (16:9)";

        const prompt = `
            You are a professional documentary filmmaker. Create a 5-scene storyboard for a "Fun Fact" short video about: "${topic}".
            
            Style: ${theme}
            Aspect Ratio: ${ratioText}
            Narration Language: ${targetLang}

            Output MUST be valid JSON array with exactly 5 objects.
            Structure:
            [
                {
                    "scene_number": 1,
                    "narration": "Narration text in ${targetLang} (engaging, catchy hook)",
                    "visual_description": "Short visual description for image generator (English)",
                    "video_prompt": "Highly detailed, cinematographic prompt for AI Video Generator (like Veo/Sora). Include camera angle, lighting, texture, and movement. Must be in English. End with aspect ratio ${ratio === '16:9' ? '--ar 16:9' : '--ar 9:16'}"
                }
            ]
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json"
                }
            });

            const text = response.text;
            if (!text) throw new Error("No text generated");
            
            const parsedScenes = JSON.parse(text);
            setScenes(parsedScenes);
            setIsGeneratingText(false);
            
            // Sequential Image Gen
            for (let i = 0; i < parsedScenes.length; i++) {
                generateSceneImage(i, parsedScenes[i].visual_description, theme, ratio);
                await delay(2000);
            }

        } catch (err: any) {
            console.error(err);
            setErrorMsg("Gagal membuat cerita: " + (err.message || "Unknown error"));
            setIsGeneratingText(false);
        }
    };

    // --- Helper: Call Gemini for Client-Side Images ---
    const generateSceneImage = async (index: number, visualDesc: string, style: string, currentRatio: string) => {
        setLoadingImages(prev => ({ ...prev, [index]: true }));
        
        const ratioKeywords = currentRatio === "9:16" ? "vertical composition, tall" : "wide angle, cinematic wide shot";
        const imagePrompt = `${visualDesc}, ${style} style, ${ratioKeywords}, high quality, 8k resolution, cinematic lighting`;

        try {
            const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{ parts: [{ text: imagePrompt }] }],
                config: {
                    imageConfig: {
                        aspectRatio: currentRatio === "9:16" ? "9:16" : "16:9"
                    }
                }
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
                const base64Image = imagePart.inlineData.data;
                const imageUrl = `data:image/jpeg;base64,${base64Image}`;
                
                setScenes(prev => {
                    const newScenes = [...prev];
                    if (newScenes[index]) {
                        newScenes[index] = { ...newScenes[index], generatedImage: imageUrl };
                    }
                    return newScenes;
                });
            }
        } catch (err) {
            console.error(`Image gen failed for scene ${index}`, err);
        } finally {
            setLoadingImages(prev => ({ ...prev, [index]: false }));
        }
    };

    // --- Helper: Generate & Download Audio (Gemini TTS) ---
    const generateAndDownloadAudio = async (text: string, indexOrId: number | 'full') => {
        if (!hasGeminiApiKey()) {
            setErrorMsg("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
            return;
        }
        setDownloadingAudio(indexOrId);
        try {
            const voiceToUse = mapVoiceNameToGeminiVoice(selectedVoice);
            console.log(`[FaktaMenarik TTS] Mapping selected voice "${selectedVoice}" to Gemini prebuilt voice "${voiceToUse}"`);
            
            const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: voiceToUse }
                        }
                    }
                }
            });

            const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (audioPart?.inlineData?.data) {
                const pcmData = audioPart.inlineData.data;
                const pcmBuffer = base64ToArrayBuffer(pcmData);
                const wavBlob = pcmToWav(new Int16Array(pcmBuffer), 24000);
                const url = URL.createObjectURL(wavBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = indexOrId === 'full' ? `CineFact_Full.wav` : `narration_scene_${(indexOrId as number) + 1}.wav`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                setErrorMsg("Gagal membuat audio.");
            }
        } catch (error) {
            console.error("Audio generation failed:", error);
            setErrorMsg("Terjadi kesalahan saat mengunduh audio.");
        } finally {
            setDownloadingAudio(null);
        }
    };

    const speak = (text: string, index: number) => {
        if (speakingIndex === index) {
            window.speechSynthesis.cancel();
            setSpeakingIndex(null);
            return;
        }

        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        const targetLang = customLanguage || language;
        if (targetLang.toLowerCase().includes("indonesia")) utterance.lang = "id-ID";
        else if (targetLang.toLowerCase().includes("english")) utterance.lang = "en-US";
        else utterance.lang = "id-ID";
        
        utterance.onend = () => setSpeakingIndex(null);
        setSpeakingIndex(index);
        window.speechSynthesis.speak(utterance);
    };

    const handleCopy = (text: string) => {
        copyToClipboard(text);
        setCopySuccess("Teks disalin!");
        setTimeout(() => setCopySuccess(""), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!hasGeminiApiKey() && <ApiKeyAlert />}
            {/* Feedback Toast */}
            {copySuccess && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold animate-in slide-in-from-top-2">
                    {copySuccess}
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* INPUT PANEL */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-200">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-4">
                            <Settings className="w-5 h-5 text-emerald-500" /> Konfigurasi Fakta
                        </h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-emerald-600 font-bold">Judul / Topik Fakta</label>
                                <textarea 
                                    rows={3}
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Contoh: 5 Fakta unik tentang Borobudur..."
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 outline-none transition resize-none text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Gaya Visual</label>
                                <select 
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:border-emerald-500 transition"
                                >
                                    <option value="Cinematic Realistic">Realistis (Cinematic 8K)</option>
                                    <option value="3D Disney Pixar Animation">Animasi 3D (Pixar Style)</option>
                                    <option value="2D Anime Style">Anime Jepang (Studio Ghibli)</option>
                                    <option value="Vintage Documentary">Dokumenter Klasik</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Format Video</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setRatio("9:16")}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${ratio === "9:16" ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                                    >
                                        <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
                                        <span className="text-xs font-semibold">Shorts/TikTok</span>
                                    </button>
                                    <button 
                                        onClick={() => setRatio("16:9")}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${ratio === "16:9" ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                                    >
                                        <div className="w-5 h-3 border-2 border-current rounded-sm"></div>
                                        <span className="text-xs font-semibold">YouTube</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-gray-500 font-bold">Suara Narator</label>
                                <select 
                                    value={selectedVoice}
                                    onChange={(e) => setSelectedVoice(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-gray-900 outline-none focus:border-emerald-500 transition"
                                >
                                    {AVAILABLE_VOICES.map((v) => (
                                        <option key={v.name} value={v.name}>{v.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                onClick={generateStory}
                                disabled={isGeneratingText}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                            >
                                {isGeneratingText ? (
                                    <><RefreshCw className="animate-spin w-5 h-5" /> Generating...</>
                                ) : (
                                    <><Lightbulb className="w-5 h-5" /> Buat Fakta Seru</>
                                )}
                            </button>
                            
                            {errorMsg && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex gap-3 animate-in slide-in-from-bottom-2">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {errorMsg}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RESULTS PANEL */}
                <div className="lg:col-span-8">
                    {scenes.length === 0 && !isGeneratingText ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white/50 rounded-2xl p-12 min-h-[500px] border-dashed border-2 border-gray-300">
                            <ImageIcon className="w-16 h-16 text-gray-200 mb-6" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">Ready to Start</h3>
                            <p className="max-w-xs text-center">Masukkan topik dan gaya di sebelah kiri untuk menghasilkan storyboard fakta menarik.</p>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-20">
                            {isGeneratingText && (
                                <div className="bg-white p-12 rounded-2xl flex flex-col items-center justify-center min-h-[400px] shadow-sm border">
                                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Merancang Storyboard</h3>
                                    <p className="text-emerald-600 animate-pulse text-sm">Gemini sedang menulis naskah yang menarik...</p>
                                </div>
                            )}

                            {!isGeneratingText && scenes.map((scene, index) => (
                                <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200 flex flex-col md:flex-row group animate-in slide-in-from-bottom-4" style={{animationDelay: `${index * 150}ms`}}>
                                    <div className={`relative md:w-5/12 bg-gray-100 shrink-0 ${ratio === "9:16" ? 'h-[500px] md:h-auto' : 'h-64 md:h-auto'}`}>
                                        {scene.generatedImage ? (
                                            <>
                                                <img src={scene.generatedImage} alt={`Scene ${index + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => downloadImage(scene.generatedImage.split(',')[1], `Scene_${index+1}.png`)}
                                                    className="absolute bottom-4 right-4 bg-black/50 hover:bg-emerald-500 text-white p-2 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : loadingImages[index] ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                                                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest">Painting Scene...</span>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                                                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                                                <button 
                                                    onClick={() => generateSceneImage(index, scene.visual_description, theme, ratio)}
                                                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-xs hover:bg-gray-200 transition"
                                                >
                                                    Coba Lagi
                                                </button>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/20">
                                                SCENE {scene.scene_number}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6">
                                        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                    <Mic className="w-4 h-4" /> Naskah Narasi
                                                </h3>
                                            </div>
                                            <p className="text-gray-800 text-lg leading-relaxed font-serif italic">"{scene.narration}"</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-purple-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <Film className="w-4 h-4" /> Video Generator Prompt
                                                    </h3>
                                                    <button 
                                                        onClick={() => handleCopy(scene.video_prompt)}
                                                        className="text-[10px] flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 transition"
                                                    >
                                                        <Copy className="w-3 h-3" /> Salin
                                                    </button>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-500 text-[10px] font-mono leading-relaxed h-20 overflow-y-auto custom-scrollbar">
                                                    {scene.video_prompt}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {!isGeneratingText && scenes.length > 0 && (
                                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500 space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                                <Music className="w-6 h-6 text-emerald-500" /> Studio Dubbing
                                            </h2>
                                            <p className="text-gray-500 text-sm">Narator: <span className="font-bold text-emerald-600">{selectedVoice}</span></p>
                                        </div>
                                        <button 
                                            onClick={() => generateAndDownloadAudio(scenes.map(s => s.narration).join(". "), 'full')}
                                            disabled={!!downloadingAudio}
                                            className={`px-6 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2 ${downloadingAudio === 'full' ? 'bg-gray-100 text-gray-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                                        >
                                            {downloadingAudio === 'full' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                                            Full Audio
                                        </button>
                                    </div>

                                    <div className="divide-y divide-gray-100 bg-gray-50 rounded-xl border">
                                        {scenes.map((scene, index) => (
                                            <div key={index} className="p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-white transition">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">{scene.scene_number}</div>
                                                <div className="flex-1 text-sm text-gray-600 italic line-clamp-1">"{scene.narration}"</div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => speak(scene.narration, index)} className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 ${speakingIndex === index ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                                                        {speakingIndex === index ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                        Preview
                                                    </button>
                                                    <button 
                                                        onClick={() => generateAndDownloadAudio(scene.narration, index)}
                                                        disabled={!!downloadingAudio}
                                                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-2"
                                                    >
                                                        {downloadingAudio === index ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaktaMenarik;
