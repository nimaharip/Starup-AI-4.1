
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Upload, 
  Image as ImageIcon,
  Loader2,
  Activity,
  MessageSquare,
  RefreshCw,
  Film,
  Users,
  PlusCircle,
  Download,
  Scan,
  Sparkles,
  UserCircle,
  Copy,
  Check,
  Code,
  Layers,
  AlertCircle,
  X
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { fileToBase64, copyToClipboard, getGeminiApiKey, hasGeminiApiKey } from '../utils';
import ApiKeyAlert from './ApiKeyAlert';

// --- REALISTIC CINEMATIC PROMPT ENGINE ---
const CINEMATIC_SCHEMA = `
{
  "system": "Rahyang Cinematic v11.0 - Hyper-Realism Engine",
  "visual_foundation": "8K UHD, Photorealistic, cinematic lighting, natural human textures. NO ANIMATION.",
  "scene_blueprint_template": {
    "scene_id": "S#",
    "character_lock": {
      "CHAR_A": { "name": "Name", "action_flow": { "main_action": "...", "expression": "..." } }
    },
    "background_lock": { "setting": "...", "scenery": "...", "lighting": "..." },
    "camera": { "framing": "...", "movement": "..." },
    "dialogue": [{ "speaker": "Name", "line": "..." }]
  }
}
`;

const FilmMaker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [scenes, setScenes] = useState<any[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [title, setTitle] = useState('');
  const [character, setCharacter] = useState({
    name: 'Andi',
    appearance: 'Pria dewasa Indonesia, wajah lelah, rambut berantakan',
    outfit_top: 'Jaket kulit hitam',
    outfit_bottom: 'Jeans gelap'
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const analyzeCharacterImage = async (file: File) => {
    if (!hasGeminiApiKey()) {
      alert("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
      return;
    }
    const base64Data = await fileToBase64(file);
    const prompt = `Analyze this person for a REALISTIC MOVIE production. Return JSON with 'appearance', 'outfit_top', 'outfit_bottom'.`;

    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          }
        ],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              appearance: { type: Type.STRING },
              outfit_top: { type: Type.STRING },
              outfit_bottom: { type: Type.STRING }
            },
            required: ["appearance", "outfit_top", "outfit_bottom"]
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Gagal menganalisis karakter");
      return JSON.parse(text);
    } catch (error) { 
      console.error("Analysis Error:", error);
      throw error; 
    }
  };

  const generateCinematicStory = async (character: any, title: string, mode = 'initial', existingScenes: any[] = []) => {
    if (!hasGeminiApiKey()) {
      alert("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
      return;
    }
    const history = existingScenes.map((s, idx) => {
        const action = s.character_lock.CHAR_A.action_flow.main_action;
        const dialogue = s.dialogue?.[0]?.line || "Tanpa dialog";
        return `Scene ${idx + 1}: [Aksi: ${action}] [Dialog: ${dialogue}]`;
    }).join("\n");

    const nextSceneNumber = existingScenes.length + 1;
    let taskDesc = "";
    if (mode === 'initial') {
        taskDesc = "Buat 3 adegan pembuka yang sangat realistis dan menarik.";
    } else if (mode === 'next') {
        taskDesc = `Ini adalah kelanjutan cerita. Buat tepat 1 adegan baru (Scene ${nextSceneNumber}) yang melanjutkan aksi dari adegan sebelumnya. Jangan mengulang adegan lama.`;
    } else if (mode === 'ending') {
        taskDesc = `Ini adalah adegan terakhir (Ending). Buat tepat 1 adegan penutup yang kuat dan emosional (Scene ${nextSceneNumber}).`;
    }

    const prompt = `
      ${CINEMATIC_SCHEMA}
      Judul Film: ${title}
      Karakter Utama: ${character.name} (${character.appearance})
      Pakaian: ${character.outfit_top}, ${character.outfit_bottom}
      
      RIWAYAT CERITA SEBELUMNYA:
      ${history || "Belum ada adegan."}

      TUGAS:
      ${taskDesc}

      Syarat Mutlak:
      1. Dialog dalam Bahasa Indonesia.
      2. Fokus pada realisme tingkat tinggi.
      3. Return ONLY valid JSON Array of objects sesuai blueprint template.
    `;

    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_id: { type: Type.STRING },
                character_lock: {
                  type: Type.OBJECT,
                  properties: {
                    CHAR_A: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        action_flow: {
                          type: Type.OBJECT,
                          properties: {
                            main_action: { type: Type.STRING },
                            expression: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  }
                },
                background_lock: {
                  type: Type.OBJECT,
                  properties: {
                    setting: { type: Type.STRING },
                    scenery: { type: Type.STRING },
                    lighting: { type: Type.STRING }
                  }
                },
                camera: {
                  type: Type.OBJECT,
                  properties: {
                    framing: { type: Type.STRING },
                    movement: { type: Type.STRING }
                  }
                },
                dialogue: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speaker: { type: Type.STRING },
                      line: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("AI tidak memberikan respon cerita");
      
      let parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) parsed = [parsed];

      return parsed.map((scene, i) => ({
        ...scene,
        character_lock: {
          ...scene.character_lock,
          CHAR_A: {
            ...scene.character_lock.CHAR_A,
            name: character.name,
            visual_dna: character.appearance,
            outfit: `${character.outfit_top}, ${character.outfit_bottom}`
          }
        }
      }));
    } catch (error) { 
      console.error("Story Gen Error:", error);
      throw error; 
    }
  };

  const generateRealisticImage = async (scene: any, currentAspectRatio: string) => {
    if (!hasGeminiApiKey()) {
      alert("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
      return;
    }
    const char = scene.character_lock.CHAR_A;
    const bg = scene.background_lock;
    
    const promptText = `A high-quality cinematic still of ${char.name}, ${char.visual_dna}, wearing ${char.outfit}. Action: ${char.action_flow.main_action}. Background: ${bg.setting}, ${bg.scenery}. Lighting: ${bg.lighting}. Shot type: ${scene.camera.framing}. Photorealistic, 8k resolution, highly detailed skin textures, movie lighting.`;

    try {
      const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: promptText,
        config: { 
          numberOfImages: 1, 
          aspectRatio: currentAspectRatio as any,
          outputMimeType: 'image/jpeg'
        }
      });
      
      if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
      }
      
      throw new Error("Format data gambar tidak dikenal dari API");
    } catch (error) { 
      console.error("Image Gen Error:", error);
      throw error; 
    }
  };

  const startStory = async () => {
    if (!title.trim()) return alert("Silakan isi judul film terlebih dahulu.");
    setIsBusy(true);
    try {
      const result = await generateCinematicStory(character, title, 'initial');
      if (result && result.length > 0) {
        setScenes(result.map((s, i) => ({ ...s, id: Date.now() + i, image: null, loading: false, error: null })));
        setActiveTab('scenes');
      } else {
        throw new Error("Data adegan kosong.");
      }
    } catch (e) { 
      console.error(e);
      alert("Sistem gagal menyusun cerita. Pastikan koneksi stabil dan coba lagi."); 
    }
    finally { setIsBusy(false); }
  };

  const addNextScene = async (mode = 'next') => {
    if (scenes.length >= 1000) return alert("Batas maksimal 1000 adegan tercapai.");
    
    setIsBusy(true);
    try {
      const result = await generateCinematicStory(character, title, mode, scenes);
      if (result && result.length > 0) {
        const newScenesWithIds = result.map((s, i) => ({ 
          ...s, 
          id: Date.now() + i, 
          image: null, 
          loading: false, 
          error: null 
        }));
        setScenes(prev => [...prev, ...newScenesWithIds]);
        
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (e) { 
      console.error(e);
      alert("Gagal menambah adegan baru. Coba lagi."); 
    }
    finally { setIsBusy(false); }
  };

  const renderScene = async (sceneId: number) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, loading: true, error: null } : s));
    try {
      const scene = scenes.find(s => s.id === sceneId);
      const img = await generateRealisticImage(scene, aspectRatio);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, image: img, loading: false } : s));
    } catch (e: any) { 
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, loading: false, error: e.message || "Gagal render" } : s));
    }
  };

  const finalizeProduction = () => {
    if (scenes.length === 0) return alert("Belum ada adegan untuk difinalisasi.");
    setActiveTab('json');
  };

  const downloadAllJson = () => {
    const blob = new Blob([JSON.stringify(scenes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'movie'}_master_script.json`;
    a.click();
  };

  const JsonSceneCard: React.FC<{ scene: any, index: number }> = ({ scene, index }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      copyToClipboard(JSON.stringify(scene, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="bg-[#161a23] border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-lg hover:border-red-600/30 transition-all group">
        <div className="p-4 border-b border-gray-800 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-red-600 rounded flex items-center justify-center text-[10px] font-black italic text-white">S{index + 1}</span>
            <h4 className="text-[10px] font-black uppercase text-gray-400">Scene Metadata</h4>
          </div>
          <button 
            onClick={handleCopy}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors group-hover:text-red-500"
            title="Salin Prompt Adegan"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto max-h-[300px] custom-scrollbar bg-black/40">
          <pre className="text-[9px] font-mono text-gray-400 leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(scene, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {!hasGeminiApiKey() && <ApiKeyAlert />}
      <nav className="flex justify-between items-center mb-8 bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3">
          <Film className="text-red-600 w-6 h-6" />
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">FILM <span className="text-red-500">MAKER</span></h1>
        </div>
        <div className="flex gap-2 bg-gray-800/80 p-1 rounded-xl border border-gray-700">
          {['setup', 'scenes', 'json'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <main className="space-y-6">
        {activeTab === 'setup' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-red-900/40 to-transparent p-8 rounded-3xl border border-red-900/20">
              <h2 className="text-3xl font-black italic tracking-tighter mb-2 uppercase text-white">Cinematic Intelligence</h2>
              <p className="text-sm text-gray-400">Dashboard produksi film realistis v11.0</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-gray-900/50 backdrop-blur-md rounded-3xl border border-gray-800 p-6 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <UserCircle className="w-4 h-4" /> Talent Scan
                  </h3>
                  {isScanning && <span className="text-[10px] font-black text-red-500 animate-pulse uppercase">Analyzing DNA...</span>}
                </div>
                
                <div className="flex flex-col gap-6">
                  <div 
                    className="relative w-full aspect-square bg-black/40 rounded-2xl border-2 border-dashed border-gray-700 overflow-hidden cursor-pointer hover:border-red-500/50 transition-all shadow-inner group flex items-center justify-center"
                    onClick={() => document.getElementById('actorInput')?.click()}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Talent" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 text-gray-500 group-hover:text-red-400 transition-colors">
                        <Scan size={40} strokeWidth={1.5} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Upload Actor Photo</span>
                      </div>
                    )}
                    {isScanning && (
                      <div className="absolute inset-0 bg-red-600/10">
                        <div className="w-full h-1 bg-red-500 absolute top-0 animate-[scan_2s_linear_infinite]" />
                      </div>
                    )}
                    <input id="actorInput" type="file" className="hidden" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
                        reader.readAsDataURL(file);
                        setIsScanning(true);
                        try {
                          const res = await analyzeCharacterImage(file);
                          setCharacter(prev => ({ ...prev, ...res }));
                        } catch (err) {
                           alert("Gagal menganalisis gambar aktor.");
                        } finally { setIsScanning(false); }
                      }
                    }} />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Stage Name</label>
                      <input value={character.name} onChange={e => setCharacter({...character, name: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-sm outline-none focus:border-red-500 text-white transition-colors" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Visual DNA</label>
                      <textarea value={character.appearance} onChange={e => setCharacter({...character, appearance: e.target.value})} className="w-full bg-black/50 border border-gray-800 rounded-xl p-3 text-xs h-24 resize-none outline-none focus:border-red-500 text-white transition-colors leading-relaxed" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl border border-gray-800 p-8 space-y-8 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Movie Title</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-sm outline-none focus:ring-1 focus:ring-red-500 text-white transition-all" placeholder="e.g. Undercover Jakarta" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Aspect Ratio</label>
                      <div className="flex gap-2">
                        {['16:9', '9:16', '1:1'].map(r => (
                          <button 
                            key={r} 
                            onClick={() => setAspectRatio(r)} 
                            className={`flex-1 py-3.5 rounded-xl text-[10px] font-black border transition-all ${aspectRatio === r ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'bg-black/20 border-gray-800 text-gray-500 hover:text-gray-300'}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={startStory} 
                    disabled={isBusy || isScanning} 
                    className="w-full bg-white text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50 text-sm shadow-xl tracking-widest uppercase"
                  >
                    {isBusy ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                    INITIATE STORY ENGINE
                  </button>
                </div>

                <div className="bg-blue-900/10 border border-blue-900/20 p-6 rounded-2xl flex gap-4">
                  <Sparkles className="text-blue-400 w-6 h-6 shrink-0" />
                  <p className="text-xs text-blue-200/70 leading-relaxed">
                    Sistem ini menggunakan kecerdasan buatan untuk membangun adegan sinematik berbasis karakter konsisten. Pastikan judul mendeskripsikan genre untuk hasil yang lebih akurat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scenes' && (
          <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in slide-in-from-bottom-8 duration-700">
            {scenes.map((scene, idx) => (
              <div key={scene.id} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-gray-900/30 p-6 rounded-[32px] border border-gray-800/50 hover:border-gray-700 transition-colors">
                <div className="md:col-span-6">
                  <div className={`relative bg-black rounded-2xl border border-gray-800 overflow-hidden shadow-2xl group transition-all duration-500 ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
                    {scene.image ? (
                      <img src={scene.image} className="w-full h-full object-cover animate-in fade-in duration-1000" alt={`Scene ${idx + 1}`} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0c10]">
                        {scene.error ? (
                            <div className="text-center p-6 space-y-3">
                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto opacity-50" />
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{scene.error}</p>
                                <button onClick={() => renderScene(scene.id)} className="text-[10px] font-black uppercase bg-red-600/20 text-red-400 px-4 py-2 rounded-xl hover:bg-red-600/40 transition-all border border-red-600/30">TRY AGAIN</button>
                            </div>
                        ) : (
                            <div className="text-center opacity-20 group-hover:opacity-40 transition-opacity">
                                <ImageIcon className="w-16 h-16 text-white mx-auto mb-3" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Ready to Render</span>
                            </div>
                        )}
                      </div>
                    )}
                    
                    {scene.loading && (
                      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <Activity className="w-10 h-10 text-red-600 animate-pulse" />
                        <span className="text-[10px] font-black text-red-500 tracking-[0.5em] animate-pulse uppercase">AI Rendering...</span>
                      </div>
                    )}
                    
                    {!scene.image && !scene.loading && !scene.error && (
                      <div className="absolute inset-0 flex items-center justify-center">
                         <button onClick={() => renderScene(scene.id)} className="bg-red-600 hover:bg-red-500 p-5 rounded-full shadow-2xl shadow-red-900/40 transition-all transform hover:scale-110 group active:scale-95">
                            <RefreshCw className="w-6 h-6 text-white group-active:rotate-180 transition-transform duration-500" />
                         </button>
                      </div>
                    )}

                    {scene.image && !scene.loading && (
                        <button 
                            onClick={() => renderScene(scene.id)} 
                            className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                            title="Render ulang adegan"
                        >
                            <RefreshCw className="w-4 h-4 text-white" />
                        </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-6 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black bg-red-600 px-3 py-1 rounded-lg text-white italic shadow-lg shadow-red-900/20 uppercase tracking-tighter">SCENE {idx+1}</span>
                    <div className="h-[1px] flex-1 bg-gray-800" />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 border-l-2 border-red-600 pl-3">Visual Action</h4>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">{scene.character_lock.CHAR_A.action_flow.main_action}</p>
                    </div>

                    {scene.dialogue?.length > 0 && (
                      <div className="bg-black/40 p-5 rounded-2xl border border-gray-800/50 space-y-4">
                         {scene.dialogue.map((d: any, i: number) => (
                           <div key={i} className="space-y-1">
                             <div className="text-[9px] font-black text-red-500 uppercase tracking-wider">{d.speaker}</div>
                             <p className="text-xs italic text-gray-400 font-serif leading-relaxed">"{d.line}"</p>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-2xl border border-gray-700/50 p-2.5 rounded-3xl flex items-center gap-3 shadow-2xl z-50 ring-1 ring-white/5">
              <button 
                onClick={() => addNextScene('next')} 
                disabled={isBusy} 
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all active:scale-95 disabled:opacity-50 text-white border border-gray-700"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <PlusCircle className="w-4 h-4 text-emerald-500" />}
                NEXT SCENE
              </button>
              <button 
                onClick={() => addNextScene('ending')} 
                disabled={isBusy} 
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all active:scale-95 disabled:opacity-50 text-white border border-gray-700"
              >
                {isBusy ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-yellow-500" />}
                END STORY
              </button>
              <div className="w-[1px] h-8 bg-gray-700 mx-1" />
              <button 
                onClick={finalizeProduction} 
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest shadow-lg shadow-red-900/40 transition-all active:scale-95 text-white"
              >
                <Check className="w-4 h-4" /> FINALIZE
              </button>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="animate-in fade-in duration-500 space-y-8 pb-32">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-900/50 backdrop-blur-md p-8 rounded-[32px] border border-gray-800 shadow-2xl">
               <div className="text-center md:text-left">
                 <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white flex items-center justify-center md:justify-start gap-3">
                   <Code className="text-red-600 w-6 h-6" /> Script Master
                 </h2>
                 <p className="text-[10px] text-gray-500 mt-2 uppercase font-black tracking-[0.2em]">Full Scene Metadata Output</p>
               </div>
               <button 
                  onClick={downloadAllJson}
                  className="bg-gray-800 text-gray-200 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-700 transition-all flex items-center gap-3 border border-gray-700 shadow-xl active:scale-95"
               >
                 <Download className="w-4 h-4" /> Download Full Script
               </button>
             </div>

             {scenes.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {scenes.map((scene, idx) => (
                   <JsonSceneCard key={scene.id || idx} scene={scene} index={idx} />
                 ))}
                 
                 <div className="bg-red-900/5 border border-red-900/10 rounded-[32px] p-10 flex flex-col items-center justify-center text-center space-y-4 border-dashed">
                    <Layers className="w-12 h-12 text-red-600/30" />
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Blueprint Ready</h5>
                    <p className="text-[10px] text-gray-600 leading-relaxed max-w-[200px] font-medium">Export individual scenes or get the complete production bundle above.</p>
                 </div>
               </div>
             ) : (
               <div className="bg-gray-900/30 rounded-[32px] border border-gray-800 p-24 text-center">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">No production data found</p>
               </div>
             )}
          </div>
        )}
      </main>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.3; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ef4444; }
        ::selection { background: #ef4444; color: white; }
      `}</style>
    </div>
  );
};

export default FilmMaker;
