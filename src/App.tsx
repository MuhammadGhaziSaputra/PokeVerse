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
  const [typeFilter, setTypeFilter] = useState("");
  const [genFilter, setGenFilter] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileTick, setProfileTick] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
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
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans selection:bg-red-100 selection:text-red-900">
      {/* Sidebar */}
      <aside className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-64 bg-white border-t md:border-t-0 md:border-r border-slate-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-sm z-40 flex md:flex-col p-2 md:p-4 overflow-x-auto md:overflow-y-auto">
        <div className="hidden md:flex items-center justify-center md:justify-start gap-3 mb-10 mt-2 px-2">
           <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center rotate-3 shadow-lg shadow-red-200 shrink-0">
              <div className="w-4 h-4 bg-white rounded-full border-2 border-slate-900 relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-900 -translate-y-1/2" />
              </div>
           </div>
           <h1 className="text-xl font-black tracking-tighter uppercase italic text-slate-900">Poke<span className="text-red-600">Verse</span></h1>
        </div>

        <nav className="flex md:flex-col gap-1 md:gap-2 flex-1 justify-around md:justify-start">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-xl text-[10px] md:text-sm font-bold transition-all md:w-full justify-center md:justify-start ${
                view === item.id 
                  ? "bg-red-50 text-red-600" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className={`shrink-0 ${view === item.id ? "w-6 h-6 md:w-5 md:h-5 text-red-600 drop-shadow-md" : "w-5 h-5"}`} />
              <span className={`md:block ${view === item.id ? "block" : "hidden sm:block"}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="hidden md:flex mt-auto pt-8 border-t border-slate-100 flex-col gap-4">
          {user ? (
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-3 p-3 rounded-xl transition-all w-full justify-start hover:bg-slate-50 group border border-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-colors shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-sm font-bold text-slate-800 truncate">{user.displayName || "User"}</span>
                  <span className="text-xs font-medium text-slate-500">Edit Profil</span>
                </div>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full justify-start text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full justify-start bg-slate-900 text-white hover:bg-red-600 shadow-md shadow-slate-200"
            >
              <LogIn className="w-5 h-5 shrink-0" />
              <span>Masuk</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0">
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
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 md:mb-4 tracking-tight leading-none uppercase">Jelajahi <br/><span className="text-red-600">Dunia Pokemon.</span></h2>
                  <p className="text-slate-500 font-medium max-w-md text-sm md:text-base">Telusuri semua generasi 1-9. Pelajari statistik, tipe, dan kemampuan tersembunyi dari setiap Pokemon.</p>
                </div>
                <div className="flex gap-2 md:gap-4">
                   <div className="p-3 md:p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Spesies</span>
                      <span className="text-xl md:text-2xl font-black text-slate-900">1025+</span>
                   </div>
                   <div className="p-3 md:p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Generasi</span>
                      <span className="text-xl md:text-2xl font-black text-slate-900">1-9</span>
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

        <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
               <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full border border-slate-900 relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-900 -translate-y-1/2" />
                  </div>
               </div>
               <span className="text-sm font-black tracking-tighter uppercase italic text-slate-900">PokeVerse</span>
            </div>
            <p className="text-slate-400 text-xs font-medium">Bertenaga PokeAPI & Gemini AI. Dibuat untuk para Trainer di seluruh dunia.</p>
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
