
import React, { useState, useEffect } from 'react';
import TTSGenerator from './components/TTSGenerator';
import ImageGenerator from './components/ImageGenerator';
import VeoPromptCrafter from './components/VeoPromptCrafter';
import GoogleFlowPanel from './components/GoogleFlowPanel';
import CharacterGenerator from './components/CharacterGenerator';
import FoodDrinkGenerator from './components/FoodDrinkGenerator';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AnimationGenerator from './components/AnimationGenerator';
import VideoSceneCreator from './components/VideoSceneCreator';
import AffiliateContentGenerator from './components/AffiliateContentGenerator';
import ProductAIStudio from './components/ProductAIStudio';
import FaktaMenarik from './components/FaktaMenarik';
import DuplikatContent from './components/DuplikatContent';
import FilmMaker from './components/FilmMaker';
import ApiSettings from './components/ApiSettings';
import { User } from './types';
import Logo from './components/Logo';
import { 
    LogOut, 
    Shield, 
    Mic, 
    Image, 
    Clapperboard, 
    Video, 
    User as UserIcon, 
    Coffee, 
    Globe, 
    Menu, 
    X,
    ChevronRight,
    Sparkles,
    Film,
    ShoppingBag,
    UserPlus,
    Lightbulb,
    Files,
    Clapperboard as ClapperIcon,
    Key
} from 'lucide-react';

type Page = 'ttsGenerator' | 'imageGenerator' | 'veoCrafter' | 'googleFlow' | 'characterGenerator' | 'foodDrinkGenerator' | 'adminPanel' | 'animationGenerator' | 'videoSceneCreator' | 'affiliateContentGenerator' | 'productAIStudio' | 'faktaMenarik' | 'duplikatContent' | 'filmMaker' | 'apiSettings';

const App: React.FC = () => {
    // Auth State with localStorage persistence to prevent automatic logout on reloads/refreshes
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            try {
                const user = JSON.parse(saved) as User;
                // Keep session alive but quickly check expiration date on startup only
                if (user.expiryDate && Date.now() > user.expiryDate) {
                    localStorage.removeItem('currentUser');
                    return null;
                }
                return user;
            } catch (e) {
                return null;
            }
        }
        return null;
    });

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            try {
                const user = JSON.parse(saved) as User;
                if (user.expiryDate && Date.now() > user.expiryDate) {
                    return false;
                }
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    });

    // Provide placeholder state variables to keep the remaining UI intact with no broken references
    const [isGenerating, setIsGenerating] = useState(false);

    // Sliding Session Expiration: Extend active session whenever user triggers an input
    useEffect(() => {
        if (isAuthenticated && currentUser) {
            const extendSession = () => {
                const saved = localStorage.getItem('currentUser');
                if (saved) {
                    try {
                        const user = JSON.parse(saved) as User;
                        // Extend expiration by 24 hours from today
                        user.expiryDate = Date.now() + 24 * 60 * 60 * 1000;
                        localStorage.setItem('currentUser', JSON.stringify(user));
                        setCurrentUser(user);
                    } catch (e) {
                        // ignore
                    }
                }
            };

            let lastExtend = Date.now();
            const handleActivity = () => {
                if (Date.now() - lastExtend > 60000) { // Throttle: max once per minute
                    extendSession();
                    lastExtend = Date.now();
                }
            };

            window.addEventListener('click', handleActivity);
            window.addEventListener('keypress', handleActivity);
            return () => {
                window.removeEventListener('click', handleActivity);
                window.removeEventListener('keypress', handleActivity);
            };
        }
    }, [isAuthenticated, currentUser]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Initialize page state from localStorage or default to 'ttsGenerator'
    const [page, setPage] = useState<Page>(() => {
        const savedPage = localStorage.getItem('currentPage');
        return (savedPage as Page) || 'ttsGenerator';
    });

    // Save current page to localStorage whenever it changes
    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem('currentPage', page);
        }
    }, [page, isAuthenticated]);

    // Handle Login Logic
    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.role !== 'admin' && page === 'adminPanel') {
            setPage('ttsGenerator');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentPage');
    };

    // Menu Items Configuration
    const menuItems = [
        { id: 'ttsGenerator', label: 'Text To Voice', icon: Mic, desc: 'Gemini TTS' },
        { id: 'imageGenerator', label: 'Images Generator', icon: Image, desc: 'Imagen 4.0 & Veo' },
        { id: 'productAIStudio', label: 'Product With Model', icon: UserPlus, desc: 'Model Integration' },
        { id: 'filmMaker', label: 'Film Maker', icon: Film, desc: 'Realistic Movie Story' },
        { id: 'videoSceneCreator', label: 'Video Scene Creator', icon: ClapperIcon, desc: 'Veo 3 Story Mode' },
        { id: 'faktaMenarik', label: 'Fakta Menarik', icon: Lightbulb, desc: 'Fun Fact Generator' },
        { id: 'duplikatContent', label: 'Duplikat Content', icon: Files, desc: 'Extract Media Prompt' },
        { id: 'affiliateContentGenerator', label: 'Affiliate Content', icon: ShoppingBag, desc: 'Monochrome Creator' },
        { id: 'animationGenerator', label: 'Create Animasi', icon: Clapperboard, desc: 'Story & Video' },
        { id: 'veoCrafter', label: 'Veo 3 Prompter', icon: Video, desc: 'Video Prompting' },
        { id: 'characterGenerator', label: 'Create Karakter', icon: UserIcon, desc: 'Character Design' },
        { id: 'foodDrinkGenerator', label: 'Food & Drink', icon: Coffee, desc: 'Product Photo' },
        { id: 'googleFlow', label: 'Google Labs', icon: Globe, desc: 'Flow Browser' },
        { id: 'apiSettings', label: 'Hubungkan API', icon: Key, desc: 'Setelan API Key' },
    ];

    if (currentUser?.role === 'admin') {
        menuItems.push({ id: 'adminPanel', label: 'Admin Panel', icon: Shield, desc: 'User Manager' });
    }

    // If not authenticated, show Login Screen
    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-[#03020c] overflow-hidden font-sans text-slate-100">
            {/* Cyberpunk Session Lock & Active Generation Bar */}
            {isGenerating && (
                <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-cyan-400 to-blue-600 z-[9999] animate-pulse">
                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-cyan-300 opacity-75 blur-[2px]" />
                </div>
            )}
            
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-45 lg:hidden backdrop-blur-md"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR NAVIGATION */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#080614] text-slate-100 border-r border-cyan-500/10 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl shadow-[#1e1b4b]/20
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Sidebar Header */}
                <div className="py-6 px-6 border-b border-cyan-500/10 bg-gradient-to-b from-[#0e0a26]/40 to-transparent relative flex flex-col items-center">
                    <Logo className="px-1" showTagline={true} />
                    <button 
                        className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                    <p className="px-4 text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest font-['Orbitron'] mb-3">SYSTEM MODULES</p>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = page === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setPage(item.id as Page);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden border border-transparent
                                    ${isActive 
                                        ? 'bg-gradient-to-r from-violet-600 via-[#1e40af] to-[#0891b2] text-white shadow-lg shadow-blue-500/10 border-cyan-400/20' 
                                        : 'text-slate-300 hover:bg-[#121021]/80 hover:text-cyan-400 hover:border-cyan-500/10'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'} transition-colors`} />
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-medium">{item.label}</div>
                                    <div className={`text-[10px] ${isActive ? 'text-cyan-100/90' : 'text-slate-500 group-hover:text-slate-400'}`}>{item.desc}</div>
                                </div>
                                {isActive && <ChevronRight className="w-4 h-4 opacity-70 text-cyan-400" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer (User Info) */}
                <div className="p-4 border-t border-cyan-500/10 bg-gradient-to-t from-[#020108] to-transparent">
                    <div className="flex items-center gap-3 bg-[#0d0c1d]/90 p-3 rounded-xl border border-cyan-500/15">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/10">
                            {currentUser?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {currentUser?.username}
                            </p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-400/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider font-['Orbitron']">
                                {currentUser?.role}
                            </span>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#04030d]">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-[#080614] border-b border-cyan-500/15 flex items-center justify-between px-4 sticky top-0 z-30 text-white">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-slate-300 hover:bg-slate-800/50 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-['Orbitron']">STARUPAI</span>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scroll-smooth bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d0a26] via-[#04030d] to-[#020106]">
                    <div className="max-w-7xl mx-auto min-h-full">
                         {/* Dynamic Page Rendering */}
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'ttsGenerator' ? 'block' : 'hidden'}`}>
                            <TTSGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'imageGenerator' ? 'block' : 'hidden'}`}>
                            <ImageGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'productAIStudio' ? 'block' : 'hidden'}`}>
                            <ProductAIStudio />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'filmMaker' ? 'block' : 'hidden'}`}>
                            <FilmMaker />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'videoSceneCreator' ? 'block' : 'hidden'}`}>
                            <VideoSceneCreator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'faktaMenarik' ? 'block' : 'hidden'}`}>
                            <FaktaMenarik />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'duplikatContent' ? 'block' : 'hidden'}`}>
                            <DuplikatContent />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'affiliateContentGenerator' ? 'block' : 'hidden'}`}>
                            <AffiliateContentGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'animationGenerator' ? 'block' : 'hidden'}`}>
                            <AnimationGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'veoCrafter' ? 'block' : 'hidden'}`}>
                            <VeoPromptCrafter />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'characterGenerator' ? 'block' : 'hidden'}`}>
                            <CharacterGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'foodDrinkGenerator' ? 'block' : 'hidden'}`}>
                            <FoodDrinkGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'googleFlow' ? 'block' : 'hidden'}`}>
                            <GoogleFlowPanel />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'apiSettings' ? 'block' : 'hidden'}`}>
                            <ApiSettings />
                        </div>
                        
                        {currentUser?.role === 'admin' && (
                            <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'adminPanel' ? 'block' : 'hidden'}`}>
                                <AdminPanel />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
