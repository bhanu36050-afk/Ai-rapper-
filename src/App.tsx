import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  MapPin, 
  TrendingUp, 
  Zap, 
  Crown, 
  Share2, 
  Play, 
  Download, 
  Plus,
  Music,
  Mic2,
  X,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Types
type Mode = 'burn' | 'gully' | 'flex';

interface User {
  id: string;
  credits: number;
  is_premium: boolean;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('burn');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showFlashSale, setShowFlashSale] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mock User ID for demo
  const userId = "demo_user_123";

  useEffect(() => {
    fetchUser();
    // Trigger flash sale after 10 seconds
    const timer = setTimeout(() => setShowFlashSale(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const fetchUser = async () => {
    const res = await fetch(`/api/user/${userId}`);
    const data = await res.json();
    setUser(data);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (user && user.credits <= 0 && !user.is_premium) {
      setShowFlashSale(true);
      return;
    }

    setIsGenerating(true);
    setLyrics('');
    setAudioUrl(null);

    try {
      const res = await fetch('/api/generate-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, userId }),
      });

      if (res.status === 402) {
        setShowFlashSale(true);
        return;
      }

      const data = await res.json();
      setLyrics(data.lyrics);
      fetchUser(); // Refresh credits
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTextToSpeech = async () => {
    if (!lyrics) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: lyrics.substring(0, 1000), // ElevenLabs limit
          voiceId: "pNInz6obpg8nEByWQX2t" // A deep, rhythmic voice
        }),
      });
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePurchaseCredits = async () => {
    await fetch(`/api/user/${userId}/add-credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 10 }),
    });
    confetti();
    setShowFlashSale(false);
    fetchUser();
  };

  const handleUpgradePremium = async () => {
    await fetch(`/api/user/${userId}/upgrade`, {
      method: 'POST',
    });
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    setShowPremiumModal(false);
    fetchUser();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(lyrics);
    const originalText = lyrics;
    setLyrics("COPIED TO CLIPBOARD! 🔥\n\n" + originalText);
    setTimeout(() => setLyrics(originalText), 2000);
    confetti({ particleCount: 50, spread: 30 });
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([lyrics], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "gullyai_bars.txt";
    document.body.appendChild(element);
    element.click();
    confetti({ particleCount: 50, spread: 30 });
  };

  return (
    <div className="min-h-screen bg-black text-[#00FF00] font-sans selection:bg-[#00FF00] selection:text-black">
      {/* Header */}
      <nav className="border-b border-[#00FF00]/20 p-4 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00FF00] rounded-sm flex items-center justify-center">
            <Mic2 className="text-black w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">GullyAI</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono bg-[#00FF00]/10 px-3 py-1 rounded-full border border-[#00FF00]/30">
            {user?.is_premium ? 'OG MEMBER' : `${user?.credits || 0} CREDITS`}
          </div>
          <button 
            onClick={() => setShowPremiumModal(true)}
            className="bg-[#00FF00] text-black px-4 py-1.5 rounded-sm font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Crown size={16} />
            GO PREMIUM
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none"
          >
            Drop Bars <br /> 
            <span className="text-white">Like a Pro.</span>
          </motion.h2>
          <p className="text-[#00FF00]/60 font-mono text-sm max-w-lg mx-auto">
            The world's first AI Rap Engine for the streets. Roast your friends, tell your story, or flex your hustle.
          </p>
        </section>

        {/* Mode Selection */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'burn', icon: Flame, label: 'BURN', desc: 'Roast Mode' },
            { id: 'gully', icon: MapPin, label: 'GULLY', desc: 'Story Mode' },
            { id: 'flex', icon: TrendingUp, label: 'FLEX', desc: 'Hustle Mode' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as Mode)}
              className={`p-4 border-2 transition-all flex flex-col items-center gap-2 group ${
                mode === m.id 
                ? 'border-[#00FF00] bg-[#00FF00]/10' 
                : 'border-[#00FF00]/20 hover:border-[#00FF00]/50'
              }`}
            >
              <m.icon className={mode === m.id ? 'text-[#00FF00]' : 'text-[#00FF00]/40'} />
              <span className="font-black tracking-widest text-sm">{m.label}</span>
              <span className="text-[10px] font-mono opacity-40 group-hover:opacity-100">{m.desc}</span>
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === 'burn' ? "Who are we roasting today? (e.g. 'Rahul from accounts')" :
                mode === 'gully' ? "What's your story? (e.g. 'Coming from the slums to the city')" :
                "What are we flexing? (e.g. 'New car, 5am gym sessions')"
              }
              className="w-full h-32 bg-[#00FF00]/5 border-2 border-[#00FF00]/20 p-4 font-mono text-sm focus:border-[#00FF00] outline-none transition-colors placeholder:text-[#00FF00]/20"
            />
            <div className="absolute bottom-4 right-4 text-[10px] font-mono opacity-40">
              {prompt.length}/500
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-[#00FF00] text-black py-4 font-black text-xl tracking-widest hover:bg-[#00FF00]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
          >
            {isGenerating ? (
              <Zap className="animate-pulse" />
            ) : (
              <Zap className="group-hover:animate-bounce" />
            )}
            {isGenerating ? 'COOKING BARS...' : 'GENERATE RAP'}
          </button>
        </div>

        {/* Output Area */}
        <AnimatePresence>
          {lyrics && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-2 border-[#00FF00] p-8 space-y-6 bg-[#00FF00]/5 relative overflow-hidden"
            >
              {/* Visualizer Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none flex items-end gap-1 px-4">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isPlaying ? [20, 100, 40, 80, 20] : 20 }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                    className="flex-1 bg-[#00FF00]"
                  />
                ))}
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-xs font-mono bg-[#00FF00] text-black px-2 py-0.5 font-bold uppercase">
                    {mode} MODE ACTIVATED
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      title="Copy to Clipboard"
                      className="p-2 border border-[#00FF00]/30 hover:bg-[#00FF00]/10 transition-colors"
                    >
                      <Share2 size={18} />
                    </button>
                    <button 
                      onClick={handleDownload}
                      title="Download Lyrics"
                      className="p-2 border border-[#00FF00]/30 hover:bg-[#00FF00]/10 transition-colors"
                    >
                      <Download size={18} />
                    </button>
                  </div>
                </div>

                <div className="whitespace-pre-wrap font-mono text-lg leading-relaxed text-white">
                  {lyrics}
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={handleTextToSpeech}
                    disabled={isGenerating}
                    className="flex-1 border-2 border-[#00FF00] py-3 font-bold flex items-center justify-center gap-2 hover:bg-[#00FF00] hover:text-black transition-all"
                  >
                    <Mic2 size={20} />
                    {audioUrl ? 'RE-GENERATE VOICE' : 'GENERATE AI VOICE'}
                  </button>
                  
                  {audioUrl && (
                    <button 
                      onClick={() => {
                        if (audioRef.current) {
                          if (isPlaying) audioRef.current.pause();
                          else audioRef.current.play();
                          setIsPlaying(!isPlaying);
                        }
                      }}
                      className="w-16 h-16 bg-[#00FF00] text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      {isPlaying ? <X size={32} /> : <Play size={32} className="ml-1" />}
                    </button>
                  )}
                </div>
                
                {audioUrl && (
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onEnded={() => setIsPlaying(false)} 
                    className="hidden" 
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Flash Sale Popup */}
      <AnimatePresence>
        {showFlashSale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setShowFlashSale(false)}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-black border-4 border-[#00FF00] p-8 max-w-md w-full space-y-6 shadow-[0_0_50px_rgba(0,255,0,0.3)]"
            >
              <div className="absolute -top-6 -right-6 bg-[#00FF00] text-black px-4 py-2 font-black rotate-12 text-xl">
                FLASH SALE!
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-4xl font-black italic tracking-tighter uppercase">STREET STARTER</h3>
                <p className="text-[#00FF00]/60 font-mono text-sm">Out of bars? Get back in the game.</p>
              </div>

              <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 p-4 rounded-sm space-y-3">
                <div className="flex items-center gap-3">
                  <Check size={18} className="text-[#00FF00]" />
                  <span className="font-mono text-sm">10 Rap Credits</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={18} className="text-[#00FF00]" />
                  <span className="font-mono text-sm">2 Premium Rhythmic Voices</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check size={18} className="text-[#00FF00]" />
                  <span className="font-mono text-sm">No Watermark Exports</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-3xl font-black">$1.00</div>
                <button 
                  onClick={handlePurchaseCredits}
                  className="bg-[#00FF00] text-black px-8 py-3 font-black text-lg hover:scale-105 transition-transform"
                >
                  GET IT NOW
                </button>
              </div>
              
              <button 
                onClick={() => setShowFlashSale(false)}
                className="w-full text-center text-[10px] font-mono opacity-40 hover:opacity-100 transition-opacity"
              >
                NO THANKS, I'LL KEEP IT LITE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setShowPremiumModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-black border-4 border-white p-8 max-w-lg w-full space-y-6 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
            >
              <div className="text-center space-y-2">
                <div className="inline-block bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-2">
                  Elite Access
                </div>
                <h3 className="text-5xl font-black italic tracking-tighter uppercase text-white">OG MEMBERSHIP</h3>
                <p className="text-white/60 font-mono text-sm">For the real hustlers. Unlimited everything.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Zap, text: 'Unlimited Bars' },
                  { icon: Mic2, text: 'All AI Voices' },
                  { icon: Music, text: 'Custom Beats' },
                  { icon: Share2, text: 'Video Creator' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-white/10 bg-white/5">
                    <item.icon size={16} className="text-white" />
                    <span className="text-xs font-mono text-white/80">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  onClick={handleUpgradePremium}
                  className="w-full bg-white text-black py-4 font-black text-xl tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-3"
                >
                  UPGRADE FOR $6/MO
                </button>
                <p className="text-center text-[10px] font-mono opacity-40 text-white">
                  Cancel anytime. No questions asked.
                </p>
              </div>

              <button 
                onClick={() => setShowPremiumModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="p-8 border-t border-[#00FF00]/10 text-center space-y-4">
        <div className="flex justify-center gap-6 opacity-40">
          <Share2 size={20} />
          <TrendingUp size={20} />
          <MapPin size={20} />
        </div>
        <p className="text-[10px] font-mono opacity-20">
          © 2026 GULLYAI LABS. BUILT FOR THE STREETS.
        </p>
      </footer>
    </div>
  );
}
