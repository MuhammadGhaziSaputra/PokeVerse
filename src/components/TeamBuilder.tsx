import { useState, FormEvent, useEffect, useRef } from "react";
import { getTeamRecommendation } from "../services/geminiService";
import { fetchAllPokemonNames } from "../services/pokeApi";
import { TeamRecommendation } from "../types";
import { Sparkles, Loader2, Shield, Sword, HelpCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function PokemonAutocomplete({ 
  value, 
  onChange, 
  allPokemon, 
  index 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  allPokemon: { name: string; id: number }[];
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = value ? allPokemon.filter(p => p.name.toLowerCase().includes(value.toLowerCase())) : allPokemon;

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 capitalize"
        placeholder={`Pokemon ${index + 1}`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto"
          >
            {filtered.slice(0, 50).map(poke => (
              <button
                key={poke.id}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-white/10 text-white capitalize transition-colors"
                onClick={() => {
                  onChange(poke.name);
                  setIsOpen(false);
                }}
              >
                {poke.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-slate-400 text-sm">Tidak ditemukan</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TeamBuilder() {
  const [mode, setMode] = useState<"build" | "counter">("build");
  const [preference, setPreference] = useState("");
  const [counterTeam, setCounterTeam] = useState<string[]>(["", "", "", "", "", ""]);
  const [allPokemon, setAllPokemon] = useState<{name: string, id: number}[]>([]);
  const [recommendations, setRecommendations] = useState<TeamRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllPokemonNames().then(setAllPokemon).catch(console.error);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const query = mode === "build" ? preference : counterTeam.filter(Boolean).join(", ");
    if (!query) return;
    
    setLoading(true);
    setRecommendations(null);
    try {
      const result = await getTeamRecommendation(query, mode);
      setRecommendations(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/10 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-red-500/20 rounded-2xl mb-4">
          {mode === "build" ? (
            <Sparkles className="w-6 h-6 text-red-400" />
          ) : (
            <Sword className="w-6 h-6 text-red-400" />
          )}
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Arsitek Tim AI</h2>
        <p className="text-slate-400">
          {mode === "build" 
            ? "Jelaskan gaya bermainmu dan biarkan Gemini membangun tim impianmu" 
            : "Masukkan 6 Pokemon lawan dan dapatkan tim counter yang jitu"}
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMode("build")}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
              mode === "build" ? "bg-red-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Bangun Tim
          </button>
          <button
            onClick={() => setMode("counter")}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-colors ${
              mode === "counter" ? "bg-red-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Counter Tim
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-12">
        {mode === "build" ? (
          <div className="relative">
            <textarea
              placeholder="Contoh: 'Saya ingin tim yang berfokus pada tipe Api untuk Gen 9', atau 'Saya ingin tim seimbang dengan setidaknya satu tipe Hantu...'"
              className="w-full px-6 py-4 bg-white/5 text-white rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[120px] font-medium placeholder:text-slate-400 resize-none"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !preference}
              className="absolute bottom-4 right-4 bg-red-500 border border-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Bangun Tim"}
            </button>
          </div>
        ) : (
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-white font-bold mb-4">Pilih 6 Pokemon Lawan:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {counterTeam.map((p, i) => (
                <PokemonAutocomplete
                  key={i}
                  value={p}
                  onChange={(val) => {
                    const newTeam = [...counterTeam];
                    newTeam[i] = val;
                    setCounterTeam(newTeam);
                  }}
                  allPokemon={allPokemon}
                  index={i}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || counterTeam.filter(Boolean).length === 0}
                className="bg-red-500 border border-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cari Counter"}
              </button>
            </div>
          </div>
        )}
      </form>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-red-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-red-500 font-bold animate-pulse">Gemini sedang menyusun strategi timmu...</p>
          </motion.div>
        )}

        {recommendations && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {recommendations.map((rec, i) => (
              <motion.div
                key={rec.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-red-500/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-black capitalize text-white group-hover:text-red-400 transition-colors">{rec.name}</h3>
                  <div className="px-3 py-1 bg-black/20 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {rec.role}
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  "{rec.reason}"
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {recommendations && recommendations.length === 0 && (
          <div className="text-center text-slate-400 text-sm italic bg-white/5 p-6 rounded-2xl border border-white/10 mt-6">
            Limit API / Gagal menyusun tim dari AI. Silakan coba lagi nanti.
          </div>
        )}
      </AnimatePresence>

      {!loading && !recommendations && (
        <div className="border-2 border-dashed border-white/10 rounded-3xl py-20 flex flex-col items-center justify-center text-slate-500">
           <HelpCircle className="w-12 h-12 mb-4 opacity-20" />
           <p className="font-bold">Rencana tim akan muncul di sini</p>
        </div>
      )}
    </div>
  );
}
