
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Download, RefreshCw, AlertCircle, Camera, User, Palette, ChevronRight, CheckCircle2, Eye, X, Scaling, UserPlus, Trash2, FileVideo, Copy, Check, Clapperboard, Scissors, Mic, Globe, Edit3, MessageSquare, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { fileToBase64, copyToClipboard, downloadImage, getGeminiApiKey, hasGeminiApiKey } from '../utils';
import ApiKeyAlert from './ApiKeyAlert';

const ProductAIStudio = () => {
  // State Produk
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // State Model Referensi
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [modelBase64, setModelBase64] = useState<string | null>(null);
  
  // State Hasil
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<any | null>(null);
  
  // State Script Modal
  const [scriptModalData, setScriptModalData] = useState<any | null>(null);
  const [generatedScripts, setGeneratedScripts] = useState<any[]>([]); 
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  
  // State Bahasa & Dialog Type
  const [scriptLanguage, setScriptLanguage] = useState('id'); 
  const [dialogueType, setDialogueType] = useState('hook'); 
  const [customLangName, setCustomLangName] = useState('Custom Language');
  const [customDialogue, setCustomDialogue] = useState('');

  const [regeneratingIndices, setRegeneratingIndices] = useState(new Set());

  // State UI & Config
  const [loading, setLoading] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveModel, setDragActiveModel] = useState(false);
  
  const [selectedGender, setSelectedGender] = useState("female");
  const [productDescription, setProductDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState("3:4");

  const styles = [
    "Modern Minimalist Studio (White Background)",
    "Urban Street Style (City Center)",
    "Luxury Penthouse Interior",
    "Golden Hour Sunlight (Outdoor)",
    "Casual Coffee Shop Atmosphere",
    "Professional Office Setting",
    "Nature/Park Greenery",
    "Industrial Loft (Concrete Walls)",
    "Summer Beach Vibe",
    "Cozy Living Room (Homey)",
    "Night City Neon Lights",
    "High Fashion Editorial (Dramatic Lighting)",
    "Sporty/Gym Environment",
    "Soft Pastel Aesthetics",
    "Vintage Film Grain Look",
    "Futuristic/Tech Background",
    "Rustic Outdoor/Countryside",
    "Clean Art Gallery",
    "Monochrome Black & White",
    "Rooftop with City View"
  ];

  const languages = [
    { code: 'id', name: '🇮🇩 Indonesian', label: 'Indonesian' },
    { code: 'en', name: '🇺🇸 English', label: 'English' },
    { code: 'ms', name: '🇲🇾 Melayu', label: 'Malay' },
    { code: 'su', name: '🗻 Sunda', label: 'Sundanese' },
    { code: 'jv', name: '🌋 Jawa', label: 'Javanese' },
    { code: 'jp', name: '🇯🇵 Japanese', label: 'Japanese' },
    { code: 'kr', name: '🇰🇷 Korean', label: 'Korean' },
    { code: 'cn', name: '🇨🇳 Chinese', label: 'Mandarin' },
    { code: 'es', name: '🇪🇸 Spanish', label: 'Spanish' },
    { code: 'ar', name: '🇸🇦 Arabic', label: 'Arabic' },
    { code: 'custom', name: '✨ Custom', label: 'Custom' },
  ];

  const dialogueTypes = [
    { id: 'hook', label: '🪝 HOOK (Pancingan)' },
    { id: 'tiktok_viral', label: '🔥 TIKTOK VIRAL HOOK (No Price)' },
    { id: 'problem', label: '😫 MASALAH (Pain Point)' },
    { id: 'solution', label: '💡 SOLUSI' },
    { id: 'cta', label: '📣 CALL TO ACTION' },
    { id: 'hard_sell', label: '⚡ HARD SELLING' },
    { id: 'soft_sell', label: '🍃 SOFT SELLING' },
    { id: 'story_sell', label: '📖 STORY SELLING' },
    { id: 'custom', label: '✏️ CUSTOM DIALOG' },
  ];

  // --- Logic Pembuatan Script dengan AI ---
  const generateScriptWithAI = async (imgData: any, langCode: string, type: string) => {
    if (!hasGeminiApiKey()) {
      setError("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
      return;
    }
    // Jika custom, tidak perlu panggil AI untuk dialog
    if (type === 'custom' || langCode === 'custom') {
      const manualScript = {
        id: 'video_ai_prompt',
        title: `🎥 Video Prompt (Custom) • Custom`,
        desc: 'Manual Custom Prompt',
        isPrompt: true, 
        content: `**[Visual Prompt for Video Generator]:**
High quality realistic video of a model holding the product. 8k resolution.
**[Negative Prompt]:**
text, subtitles, blurry, low resolution, bad anatomy
**[Dialogue / Script]:**
"${customDialogue || "Your custom dialogue here..."}"`
      };
      setGeneratedScripts([manualScript]);
      return;
    }

    setIsScriptLoading(true);
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });

    // Ambil data base64 gambar hasil generate
    const base64Image = imgData.src.split(',')[1];
    const languageName = languages.find(l => l.code === langCode)?.label || "Indonesian";
    const typeLabel = dialogueTypes.find(t => t.id === type)?.label || "Marketing";

    let strategyInstruction = `Marketing Strategy: ${typeLabel}`;
    if (type === 'tiktok_viral') {
      strategyInstruction = `Marketing Strategy: TikTok Viral Storytelling Hook. 
         - CRITICAL: DO NOT specify or mention any numeric price values or discount percentages inside the script.
         - MANDATORY HOOK CONCEPT: Open the voiceover with an exciting or surprised tone expressing a variation of: "Harganya di bawah pikiran kita / di luar nalar sih, tapi dapet bahan senyaman ini dan sebagus ini... buruan langsung gerak cepat cek keranjang kuning selagi masih ada!"
         - General tone: Excited, amazed, extremely warm and interactive, specifically mimicking TikTok Affiliate aesthetic.`;
    }

    const promptText = `
      Analyze this product image carefully. 
      Identify the specific product (e.g., shoes, serum, bag, coffee, etc.).
      
      Task: Create a text prompt for an AI Video Generator and a Voiceover Dialogue.
      
      1. **Visual Prompt**: Write a high-quality prompt in English to generate an 8-second video of this exact scene. Describe the model's action, camera movement (slow pan/dolly), lighting, and environment based on the image style.
      2. **Dialogue**: Write a short, engaging voiceover script (1-2 sentences, max 8 seconds spoken) specifically for this product. 
         - Language: ${languageName}
         - ${strategyInstruction}
         - The dialogue MUST mention the product type explicitly (e.g. "Sepatu ini...", "Serum ini...") and fit the visual context.

      Output JSON format:
      {
        "visual_prompt": "string",
        "dialogue": "string"
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                parts: [
                    { text: promptText },
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                ]
            }
        ],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text;
      if (!text) throw new Error("No script generated");
      const result = JSON.parse(text);

      const negativePromptStr = "text, subtitles, captions, watermark, logo, icons, ui, interface, blurry, low resolution, distorted face, bad anatomy, extra fingers, overexposed, underexposed, bad composition";

      const script = {
        id: 'video_ai_prompt_ai',
        title: `🎥 AI Generated Prompt • ${languageName}`,
        desc: `Otomatis disesuaikan dengan produk di gambar.`,
        isPrompt: true, 
        content: `**[Visual Prompt for Video Generator]:**
${result.visual_prompt}
**Duration:** 8 seconds.

**[Negative Prompt]:**
${negativePromptStr}

**[Dialogue / Script for Voiceover (${languageName})]:**
"${result.dialogue}"`
      };

      setGeneratedScripts([script]);

    } catch (err) {
      console.error("AI Script Error:", err);
      // Fallback manual jika error
      const fallbackScript = {
        id: 'fallback',
        title: '⚠️ AI Error - Fallback Prompt',
        desc: 'Gagal menganalisa gambar, menggunakan template standar.',
        isPrompt: true,
        content: `**[Visual Prompt]:** High quality video of model with product. Cinematic lighting. 8k.
**[Dialogue]:** "Produk ini solusi terbaik untuk kebutuhan Anda. Dapatkan sekarang juga!"`
      };
      setGeneratedScripts([fallbackScript]);
    } finally {
      setIsScriptLoading(false);
    }
  };

  // Trigger generate script saat modal dibuka atau parameter berubah
  useEffect(() => {
    if (scriptModalData) {
      // Debounce sedikit agar tidak spamming API jika user ganti-ganti cepat
      const timeoutId = setTimeout(() => {
        generateScriptWithAI(scriptModalData, scriptLanguage, dialogueType);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [scriptModalData, scriptLanguage, dialogueType, customDialogue, customLangName]);

  const handleDrag = (e: any) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e: any) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]); };
  const handleChange = (e: any) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); };
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError("Mohon upload file gambar."); return; }
    setError(null); setGeneratedImages([]); setProgressCount(0); setSelectedImage(URL.createObjectURL(file));
    const reader = new FileReader(); reader.onloadend = () => setImageBase64((reader.result as string).split(',')[1]); reader.readAsDataURL(file);
  };

  const handleDragModel = (e: any) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActiveModel(true); else if (e.type === "dragleave") setDragActiveModel(false); };
  const handleDropModel = (e: any) => { e.preventDefault(); e.stopPropagation(); setDragActiveModel(false); if (e.dataTransfer.files?.[0]) handleFileModel(e.dataTransfer.files[0]); };
  const handleChangeModel = (e: any) => { if (e.target.files?.[0]) handleFileModel(e.target.files[0]); };
  const handleFileModel = (file: File) => {
    if (!file.type.startsWith('image/')) { setError("Mohon upload file gambar untuk model."); return; }
    setModelImage(URL.createObjectURL(file));
    const reader = new FileReader(); reader.onloadend = () => setModelBase64((reader.result as string).split(',')[1]); reader.readAsDataURL(file);
  };

  // --- Core AI Logic ---
  const fetchSingleImage = async (style: string, genderPrompt: string, variationIdx: number) => {
    const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() || "" });
    const poseVariation = ["standing naturally", "walking confidently", "close-up shot", "sitting or leaning casually"];
    const selectedPose = poseVariation[variationIdx % poseVariation.length];
    const interactionText = productDescription.trim() ? `interacting with the product as described: "${productDescription}"` : "wearing or holding the product naturally";
    const negativePrompt = "blurry, low resolution, watermark, logo, distorted face, bad anatomy, extra fingers, text cut, overexposed, underexposed";

    const ratioInstruction = aspectRatio === "1:1" ? "Square aspect ratio" : 
                             aspectRatio === "9:16" ? "Tall vertical portrait, full body visible in center" : 
                             aspectRatio === "4:3" ? "Wide landscape" : "Vertical portrait";

    let finalPrompt = "";
    if (modelBase64) {
      finalPrompt = `Generate a photorealistic image. Use the person from the SECOND image as the model reference (maintain facial features and body type). The model should be ${interactionText}. The product from the FIRST image must be clearly visible. Scene: ${style}. Pose: ${selectedPose}. Composition: ${ratioInstruction}. Subject centered. 8k resolution. Negative prompt: ${negativePrompt}`;
    } else {
      finalPrompt = `Generate a photorealistic image of a ${genderPrompt} model ${interactionText}. The product from input image must be clearly visible. Scene: ${style}. Pose: ${selectedPose}. Composition: ${ratioInstruction}. Subject centered. 8k resolution. Negative prompt: ${negativePrompt}`;
    }

    const parts: any[] = [{ text: finalPrompt }, { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }];
    if (modelBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: modelBase64 } });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts }],
        // responseModalities is implied for flash-image, no need to set explicitly in SDK unless specific requirement
      });
      
      const generatedBase64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      return generatedBase64 ? `data:image/jpeg;base64,${generatedBase64}` : null;
    } catch (err) { console.error("Gagal generate:", style, err); return null; }
  };

  const regenerateSingleImage = async (index: number) => {
    const targetImage = generatedImages[index];
    if (!targetImage || !imageBase64) return;
    setRegeneratingIndices(prev => new Set(prev).add(index));
    let genderPrompt = selectedGender === "unisex" ? "male or female" : selectedGender;
    try {
      const newImageSrc = await fetchSingleImage(targetImage.style, genderPrompt, targetImage.variation - 1);
      if (newImageSrc) {
        setGeneratedImages(prev => { const newImages = [...prev]; newImages[index] = { ...newImages[index], src: newImageSrc }; return newImages; });
      }
    } catch (err) { console.error(err); } 
    finally { setRegeneratingIndices(prev => { const newSet = new Set(prev); newSet.delete(index); return newSet; }); }
  };

  const generateImages = async () => {
    if (!hasGeminiApiKey()) {
      setError("Silakan masukkan API Key Gemini Anda di menu Setelan API untuk mulai menggunakan fitur secara gratis.");
      return;
    }
    if (!imageBase64) { setError("Silakan upload foto produk terlebih dahulu."); return; }
    setLoading(true); setGeneratedImages([]); setProgressCount(0); setError(null);
    let genderPrompt = selectedGender === "unisex" ? "male or female" : selectedGender;
    let allTasks: {style: string, variationIdx: number}[] = [];
    styles.forEach(style => { for (let i = 0; i < 4; i++) allTasks.push({ style, variationIdx: i }); });

    const batchSize = 4;
    for (let i = 0; i < allTasks.length; i += batchSize) {
      const currentBatch = allTasks.slice(i, i + batchSize);
      const promises = currentBatch.map(task => 
        fetchSingleImage(task.style, genderPrompt, task.variationIdx).then(res => {
          if (res) setGeneratedImages(prev => [...prev, { src: res, style: task.style, variation: task.variationIdx + 1, ratio: aspectRatio }]);
          setProgressCount(prev => prev + 1);
        })
      );
      await Promise.all(promises);
    }
    setLoading(false);
  };

  const handleDownloadImage = (imgData: any, index: number) => {
    // FIX: Utility downloadImage secara otomatis menambahkan prefix "data:image/jpeg;base64,".
    // Karena imgData.src sudah berupa Data URL lengkap, kita harus membuang header-nya terlebih dahulu
    // agar tidak terjadi double prefix yang menyebabkan file corrupt/kosong.
    const base64Data = imgData.src.includes(',') ? imgData.src.split(',')[1] : imgData.src;
    downloadImage(base64Data, `model-product-${index + 1}.jpg`);
  };

  const handleCopyScript = (text: string, id: string) => {
      copyToClipboard(text);
      setCopiedScriptId(id);
      setTimeout(() => setCopiedScriptId(null), 2000);
  };

  const getAspectRatioClass = (ratio: string) => {
    switch(ratio) {
      case "1:1": return "aspect-square";
      case "9:16": return "aspect-[9/16]";
      case "4:3": return "aspect-[4/3]";
      case "3:4": return "aspect-[3/4]";
      default: return "aspect-[3/4]";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white rounded-3xl border border-slate-800 overflow-hidden">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-2 rounded-lg"><Camera size={24} className="text-white" /></div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Product With Model</h1>
              <span className="text-xs text-purple-400 font-mono">V5.2 • FIX AI SCRIPT</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!hasGeminiApiKey() && <ApiKeyAlert />}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
               <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2"><Upload size={16} className="text-purple-400" /> 1. Upload Produk (Wajib)</h3>
               <div className={`relative border-2 border-dashed rounded-xl transition-all duration-300 overflow-hidden ${dragActive ? "border-purple-500 bg-purple-500/10" : selectedImage ? "border-slate-700 bg-slate-800" : "border-slate-700 hover:border-slate-500"}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                <input type="file" id="pas-image-upload" className="hidden" accept="image/*" onChange={handleChange} />
                <div className="min-h-[200px] flex flex-col items-center justify-center relative">
                  {selectedImage ? (
                    <>
                      <img src={selectedImage} alt="Product" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      <button onClick={(e) => { e.preventDefault(); setSelectedImage(null); setImageBase64(null); setGeneratedImages([]); }} className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg z-10"><Trash2 size={16} /></button>
                    </>
                  ) : (
                    <label htmlFor="pas-image-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center p-8 z-10"><Upload size={24} className="text-purple-400" /><p className="text-sm font-medium text-white">Upload Foto Produk</p></label>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
               <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center justify-between"><span className="flex items-center gap-2"><UserPlus size={16} className="text-blue-400" /> 2. Model Referensi</span><span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 border border-slate-700">OPSIONAL</span></h3>
               <div className={`relative border-2 border-dashed rounded-xl transition-all duration-300 overflow-hidden ${dragActiveModel ? "border-blue-500 bg-blue-500/10" : modelImage ? "border-blue-900 bg-slate-800" : "border-slate-700 hover:border-blue-500/50"}`} onDragEnter={handleDragModel} onDragLeave={handleDragModel} onDragOver={handleDragModel} onDrop={handleDropModel}>
                <input type="file" id="pas-model-upload" className="hidden" accept="image/*" onChange={handleChangeModel} />
                <div className="min-h-[120px] flex flex-col items-center justify-center relative">
                  {modelImage ? (
                    <>
                      <img src={modelImage} alt="Model Ref" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                      <button onClick={(e) => { e.preventDefault(); setModelImage(null); setModelBase64(null); }} className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg z-10"><Trash2 size={16} /></button>
                    </>
                  ) : (
                    <label htmlFor="pas-model-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center p-4 z-10"><UserPlus size={24} className="text-slate-500" /><div className="text-center"><p className="text-sm font-medium text-slate-300">Upload Wajah/Model</p><p className="text-[10px] text-slate-500">Kosongkan untuk model AI acak</p></div></label>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2"><Scaling size={16} className="text-green-400" /> 3. Rasio Foto</h3>
                <div className="grid grid-cols-4 gap-2">
                  {[{ label: "3:4", val: "3:4" }, { label: "1:1", val: "1:1" }, { label: "4:3", val: "4:3" }, { label: "9:16", val: "9:16" }].map((r) => (
                    <button key={r.val} onClick={() => setAspectRatio(r.val)} className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${aspectRatio === r.val ? "bg-green-600/20 border-green-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`}>{r.label}</button>
                  ))}
                </div>
              </div>
              <hr className="border-slate-800" />
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2"><User size={16} className="text-pink-400" /> 4. Gender Model</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['female', 'male', 'unisex'].map((g) => (
                    <button key={g} onClick={() => setSelectedGender(g)} className={`py-2 rounded-lg border text-xs font-medium capitalize transition-all ${selectedGender === g ? "bg-pink-600/20 border-pink-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`}>{g === 'female' ? 'Wanita' : g === 'male' ? 'Pria' : 'Mix'}</button>
                  ))}
                </div>
              </div>
              <hr className="border-slate-800" />
              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2"><Edit3 size={16} className="text-yellow-400" /> 5. Cara Pakai / Interaksi</h3>
                <textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} placeholder="Contoh: Model memegang botol di dekat pipi..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-20 transition-all" />
              </div>
            </div>

            <button onClick={generateImages} disabled={loading || !selectedImage} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${loading || !selectedImage ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/25 hover:scale-[1.02]"}`}>
              {loading ? <><RefreshCw className="animate-spin" /> {progressCount}/80...</> : <><Sparkles className="fill-current" /> Generate 80 Foto</>}
            </button>
            
            {loading && <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden"><div className="bg-purple-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(progressCount / 80) * 100}%` }}></div></div>}
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm"><AlertCircle size={18} className="shrink-0 mt-0.5" />{error}</div>}
          </div>

          {/* Right Column: Gallery */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold flex items-center gap-2 text-white"><ImageIcon size={20} className="text-pink-400" /> Galeri Hasil</h2>
               {generatedImages.length > 0 && !loading && <span className="text-xs text-green-400 flex items-center gap-1 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50"><CheckCircle2 size={12} /> Selesai</span>}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 min-h-[600px]">
              {generatedImages.length === 0 && !loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 py-20">
                  <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-4"><Palette size={40} className="opacity-20" /></div>
                  <p className="text-lg font-medium">Belum ada foto</p>
                  <p className="text-sm max-w-sm text-center mt-2 opacity-60">Upload produk, atur rasio, (opsional) upload model referensi, lalu klik Generate.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {generatedImages.map((imgData, idx) => {
                    const isRegenerating = regeneratingIndices.has(idx);
                    const ratioClass = getAspectRatioClass(imgData.ratio || aspectRatio);
                    return (
                    <div key={idx} className={`group relative ${ratioClass} rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-purple-500 transition-all animate-in fade-in zoom-in duration-500`}>
                      <img src={imgData.src} alt={`Result ${idx}`} className={`w-full h-full object-cover transition-opacity ${isRegenerating ? 'opacity-40' : 'opacity-100'}`} />
                      {isRegenerating && <div className="absolute inset-0 flex items-center justify-center z-20"><RefreshCw className="text-purple-400 animate-spin" size={32} /></div>}
                      {!isRegenerating && <button onClick={() => regenerateSingleImage(idx)} className="absolute top-2 right-2 bg-black/50 hover:bg-purple-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm" title="Regenerate"><RefreshCw size={14} /></button>}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 z-10">
                        <p className="text-[10px] text-slate-300 font-medium mb-2 line-clamp-1">{imgData.style}</p>
                        <div className="flex gap-1.5">
                           <button onClick={() => setPreviewImage(imgData)} className="flex-1 py-1.5 bg-white/10 text-white hover:bg-white/20 text-[10px] font-bold rounded-md border border-white/10 flex items-center justify-center gap-1" title="Preview"><Eye size={12} /></button>
                           {/* Tombol Script Video Baru */}
                           <button onClick={() => setScriptModalData(imgData)} className="flex-1 py-1.5 bg-blue-600/80 text-white hover:bg-blue-600 text-[10px] font-bold rounded-md flex items-center justify-center gap-1" title="Video Prompt"><FileVideo size={12} /></button>
                           <button onClick={() => handleDownloadImage(imgData, idx)} className="flex-1 py-1.5 bg-white text-black hover:bg-slate-200 text-[10px] font-bold rounded-md flex items-center justify-center gap-1" title="Save"><Download size={12} /></button>
                        </div>
                      </div>
                    </div>
                  )})}
                  {loading && generatedImages.length < 80 && Array.from({ length: 4 }).map((_, i) => (
                      <div key={`skel-${i}`} className={`${getAspectRatioClass(aspectRatio)} bg-slate-800 rounded-xl animate-pulse border border-slate-700/50 flex items-center justify-center`}><Sparkles className="text-slate-700 animate-spin" /></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Preview Image - FIXED VISUAL CROP */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
           <div className="relative flex flex-col items-center justify-center p-4" onClick={e => e.stopPropagation()}>
              {/* Container dengan Ratio Class untuk simulasi Crop */}
              <div 
                className={`relative overflow-hidden rounded-lg shadow-2xl ${getAspectRatioClass(previewImage.ratio || aspectRatio)}`}
                style={{ 
                  height: (previewImage.ratio || aspectRatio) === '9:16' ? '80vh' : '70vh', 
                  maxHeight: '85vh',
                  maxWidth: '90vw'
                }}
              >
                <img 
                  src={previewImage.src} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
              </div>
              
              <div className="flex gap-4 mt-6">
                 <button onClick={() => handleDownloadImage(previewImage, -1)} className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 shadow-lg">
                   <Download size={20} /> Download
                 </button>
                 <button onClick={() => setPreviewImage(null)} className="bg-slate-800/80 text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-lg border border-slate-700/50">
                   <X size={20} /> Close
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Script Generator */}
      {scriptModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setScriptModalData(null)}>
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-4xl h-[95vh] rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            
            {/* Left: Image Reference */}
            <div className="w-full md:w-1/3 bg-black flex items-center justify-center p-6 border-r border-slate-800 relative hidden md:flex">
               <img src={scriptModalData.src} alt="Ref" className="max-h-full max-w-full object-contain rounded-lg shadow-lg" />
               <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-mono text-purple-300 border border-purple-500/30">Ref Image</div>
               <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-xs text-slate-400 font-medium">{scriptModalData.style}</p>
               </div>
            </div>

            {/* Right: Scripts */}
            <div className="w-full md:w-2/3 flex flex-col h-full bg-slate-900">
               <div className="p-6 border-b border-slate-800 flex flex-col gap-4 justify-between bg-slate-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2"><FileVideo className="text-blue-400" /> Video Prompt Generator</h2>
                      <p className="text-sm text-slate-400 mt-1">Prompt Visual & Dialog ({scriptLanguage === 'custom' ? customLangName : languages.find(l => l.code === scriptLanguage)?.name})</p>
                    </div>
                    <button onClick={() => setScriptModalData(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                  </div>

                  <div className="flex flex-col gap-3">
                     {/* Dialogue Type Selector */}
                     <div className="flex items-center gap-2 w-full">
                       <MessageSquare size={16} className="text-slate-400 shrink-0" />
                       <div className="relative group w-full">
                         <select 
                           value={dialogueType}
                           onChange={(e) => setDialogueType(e.target.value)}
                           className="w-full bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors uppercase tracking-wide font-bold"
                         >
                           {dialogueTypes.map(type => (
                             <option key={type.id} value={type.id}>{type.label}</option>
                           ))}
                         </select>
                         <ChevronRight size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                       </div>
                     </div>

                     {/* Language Selector */}
                     <div className="flex items-center gap-2 w-full">
                       <Globe size={16} className="text-slate-400 shrink-0" />
                       <div className="relative group w-full">
                         <select 
                           value={scriptLanguage}
                           onChange={(e) => setScriptLanguage(e.target.value)}
                           className="w-full bg-slate-800 text-white text-xs border border-slate-700 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                         >
                           {languages.map(lang => (
                             <option key={lang.code} value={lang.code}>{lang.name}</option>
                           ))}
                         </select>
                         <ChevronRight size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                       </div>
                     </div>
                  </div>
               </div>
               
               {/* Custom Language/Dialog Inputs */}
               {(scriptLanguage === 'custom' || dialogueType === 'custom') && (
                 <div className="px-6 py-4 border-b border-slate-800/50 bg-slate-800/20">
                   <div className="space-y-3">
                     {scriptLanguage === 'custom' && (
                       <div>
                          <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Nama Bahasa</label>
                          <input 
                            type="text" 
                            value={customLangName}
                            onChange={(e) => setCustomLangName(e.target.value)}
                            placeholder="Contoh: Bahasa Gaul, Jawa Krama, dll"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                          />
                       </div>
                     )}
                     <div>
                        <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block flex items-center gap-2"><Edit3 size={10} /> Dialog Kustom</label>
                        <textarea 
                          value={customDialogue}
                          onChange={(e) => setCustomDialogue(e.target.value)}
                          placeholder="Ketik dialog yang Anda inginkan di sini..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none h-16"
                        />
                     </div>
                   </div>
                 </div>
               )}

               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {isScriptLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                      <Loader2 size={32} className="animate-spin text-purple-500" />
                      <p className="text-xs">AI sedang menganalisis gambar produk Anda...</p>
                    </div>
                  ) : (
                    generatedScripts.map((script) => (
                      <div key={script.id} className={`border rounded-xl overflow-hidden transition-all ${script.isPrompt ? "bg-purple-900/10 border-purple-500/50" : "bg-slate-800/50 border-slate-700"}`}>
                         <div className={`px-4 py-3 border-b flex items-center justify-between ${script.isPrompt ? "bg-purple-900/20 border-purple-500/30" : "bg-slate-800 border-slate-700"}`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${script.isPrompt ? "bg-purple-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                                  {script.isPrompt ? <Clapperboard size={14} /> : <Scissors size={14} />}
                              </div>
                              <div>
                                <h3 className={`font-bold text-sm ${script.isPrompt ? "text-purple-200" : "text-white"}`}>{script.title}</h3>
                                <p className="text-[10px] text-slate-400">{script.desc}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleCopyScript(script.content, script.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copiedScriptId === script.id ? "bg-green-500 text-white" : "bg-white text-black hover:bg-slate-200"}`}
                            >
                              {copiedScriptId === script.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                            </button>
                         </div>
                         <div className="p-4 bg-slate-950/50 relative">
                            <pre className={`text-xs font-mono whitespace-pre-wrap leading-relaxed select-all ${script.isPrompt ? "text-purple-200" : "text-slate-300"}`}>{script.content}</pre>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAIStudio;
