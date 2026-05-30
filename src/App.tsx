/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { PokemonDetail as IPokemonDetail, PokemonBasic } from "./types";
import { fetchPokemonDetail, fetchPokemonList } from "./services/pokeApi";
import PokemonGrid from "./components/PokemonGrid";
import PokemonDetail from "./components/PokemonDetail";
import ComparisonTool from "./components/ComparisonTool";
import TeamBuilder from "./components/TeamBuilder";
import SearchFilter from "./components/SearchFilter";
import TypeChart from "./components/TypeChart";
import PokeChat from "./components/PokeChat";
import ProfileModal from "./components/ProfileModal";
import DailyGacha from "./components/DailyGacha";
import { motion, AnimatePresence } from "motion/react";
import { LayoutGrid, ArrowLeftRight, Users, Sparkles, PieChart, X, LogIn, LogOut, Settings, Gift } from "lucide-react";
import { auth } from "./services/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";

const PokeballIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <path d="M2.05 12h6.95" />
    <path d="M15 12h6.95" />
  </svg>
);

type View = "grid" | "compare" | "team" | "chart" | "gacha";

export default function App() {
  const [selectedPokemon, setSelectedPokemon] = useState<IPokemonDetail | null>(null);
  const [view, setView] = useState<View>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [genFilter, setGenFilter] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileTick, setProfileTick] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/unauthorized-domain') {
        setLoginError("Domain ini belum diotorisasi di Firebase. Tambahkan domain ini ke Firebase Console > Authentication > Settings > Authorized domains.");
      } else {
        setLoginError(e.message || "Gagal login. Coba lagi.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPokemon = async (id: number) => {
    try {
      const detail = await fetchPokemonDetail(id);
      setSelectedPokemon(detail);
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { id: "grid", label: "Pokedex", icon: LayoutGrid },
    { id: "compare", label: "Bandingkan", icon: ArrowLeftRight },
    { id: "team", label: "Tim AI", icon: Sparkles },
    { id: "chart", label: "Analisis Tipe", icon: PieChart },
    { id: "gacha", label: "Daily Encounter", icon: Gift },
  ];

  return (
    <div className="min-h-screen flex bg-[#0B1021] text-white font-sans selection:bg-red-500/30 selection:text-white relative overflow-hidden">
      {/* Background Particles/Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Sidebar / Bottom Navigation */}
      <nav className="fixed bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 left-1/2 -translate-x-1/2 md:left-4 md:-translate-x-0 w-[calc(100%-2rem)] md:w-auto bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl z-40 flex md:flex-col p-2 rounded-2xl md:min-h-[400px]">
        <div className="hidden md:flex flex-col items-center gap-1 mb-8 mt-2">
           <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center rotate-12 shadow-lg shadow-red-500/20 shrink-0 mb-2">
              <div className="w-4 h-4 bg-white rounded-full border-[3px] border-[#0B1021] relative">
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[#0B1021] -translate-y-1/2" />
              </div>
           </div>
        </div>

        <div className="flex md:flex-col gap-2 flex-1 justify-around md:justify-center w-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`group flex md:flex-col items-center gap-1 md:gap-1.5 p-2 rounded-xl text-[9px] font-bold transition-all ${
                view === item.id 
                  ? "bg-white/10 text-white shadow-inner" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className={`shrink-0 transition-transform group-hover:scale-110 ${view === item.id ? "w-6 h-6 md:w-6 md:h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "w-5 h-5"}`} />
              <span className={`tracking-wider uppercase ${view === item.id ? "block" : "hidden sm:block"}`}>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex md:mt-auto md:pt-4 border-l md:border-l-0 md:border-t border-white/10 md:flex-col gap-1 items-center justify-center pl-2 md:pl-0 shrink-0">
          {user ? (
            <>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors mx-auto"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors mx-auto"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 transition-colors mx-auto relative group"
            >
              <LogIn className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:block absolute left-14 bg-white/10 backdrop-blur-md px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Masuk</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-24 flex flex-col min-h-screen pb-24 md:pb-0 relative z-10 w-full overflow-hidden">
        {loginError && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-sm w-full bg-red-900/50 backdrop-blur-md border border-red-500/50 text-red-200 p-4 rounded-2xl shadow-2xl z-50 flex justify-between items-start">
            <div>
              <p className="font-bold text-sm">Gagal Login</p>
              <p className="text-xs mt-1">{loginError}</p>
            </div>
            <button onClick={() => setLoginError(null)} className="text-red-500 hover:text-red-700 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-12 flex-1">
        <AnimatePresence mode="wait">
          {view === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center justify-center mb-12 mt-8 text-center">
                <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase !font-heading bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent drop-shadow-sm">
                  Poke<span className="text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-600">Nexus</span>
                </h2>
                <p className="text-slate-400 font-medium max-w-md text-sm md:text-base mb-8">Eksplorasi dengan pengalaman baru. Lebih cepat, lebih indah.</p>
                
                <div className="flex gap-4">
                   <div className="px-6 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center">
                      <span className="text-2xl font-black text-white">1025</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Spesies</span>
                   </div>
                   <div className="px-6 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col items-center">
                      <span className="text-2xl font-black text-white">1-9</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Generasi</span>
                   </div>
                </div>
              </div>

              <SearchFilter onSearch={setSearchQuery} onFilterType={setTypeFilter} onFilterGen={setGenFilter} />
              
              <PokemonGrid 
                onSelect={handleSelectPokemon} 
                searchQuery={searchQuery}
                typeFilter={typeFilter}
                genFilter={genFilter}
              />
            </motion.div>
          )}

          {view === "compare" && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ComparisonTool />
            </motion.div>
          )}

          {view === "team" && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TeamBuilder />
            </motion.div>
          )}

          {view === "chart" && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TypeChart />
            </motion.div>
          )}

          {view === "gacha" && (
            <motion.div
              key="gacha"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DailyGacha />
            </motion.div>
          )}

        </AnimatePresence>
        </main>

        <footer className="border-t border-white/5 py-8 mt-auto z-10 w-full backdrop-blur-xl bg-transparent">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-500 text-xs font-medium">✨ Dibuat untuk pengalaman Pokemon terbaik.</p>
          </div>
        </footer>
      </div>

      <PokemonDetail 
        pokemon={selectedPokemon} 
        onClose={() => setSelectedPokemon(null)} 
      />

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 p-3 md:p-4 text-white rounded-full shadow-xl hover:scale-105 transition-all duration-300 z-[60] flex items-center justify-center ${
          isChatOpen 
            ? 'bg-slate-900 hover:bg-slate-900 shadow-slate-500/30 rotate-90' 
            : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
        }`}
      >
        {isChatOpen ? <X className="w-6 h-6 md:w-8 md:h-8" /> : <PokeballIcon className="w-6 h-6 md:w-8 md:h-8" />}
      </button>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="fixed bottom-36 md:bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-[450px] z-50 origin-bottom-right max-h-[70vh] flex flex-col"
          >
            <div className="shadow-2xl rounded-3xl flex-1 flex flex-col overflow-hidden">
              <PokeChat onClose={() => setIsChatOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileModalOpen && user && (
          <ProfileModal user={user} onClose={() => setIsProfileModalOpen(false)} onUpdate={() => setProfileTick(t => t + 1)} />
        )}
      </AnimatePresence>
    </div>
  );
}
