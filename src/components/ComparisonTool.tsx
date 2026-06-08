import { useState, useEffect, useRef } from "react";
import { PokemonDetail, BattleAnalysis } from "../types";
import { fetchPokemonDetail, fetchAllPokemonNames } from "../services/pokeApi";
import { getBattleAnalysis } from "../services/geminiService";
import { Sword, Shield, Zap, Heart, Activity, Loader2, ArrowRight, Sparkles, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ComparisonTool() {
  const [pokemon1, setPokemon1] = useState<PokemonDetail | null>(null);
  const [pokemon2, setPokemon2] = useState<PokemonDetail | null>(null);
  const [query1, setQuery1] = useState("");
  const [query2, setQuery2] = useState("");
  const [loading, setLoading] = useState({ p1: false, p2: false });
  const [analysis, setAnalysis] = useState<BattleAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [allNames, setAllNames] = useState<{ name: string; id: number }[]>([]);
  const [showSuggest1, setShowSuggest1] = useState(false);
  const [showSuggest2, setShowSuggest2] = useState(false);

  const wrapperRef1 = useRef<HTMLDivElement>(null);
  const wrapperRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllPokemonNames().then(setAllNames);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef1.current && !wrapperRef1.current.contains(event.target as Node)) {
        setShowSuggest1(false);
      }
      if (wrapperRef2.current && !wrapperRef2.current.contains(event.target as Node)) {
        setShowSuggest2(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    if (pokemon1 && pokemon2) {
      setAnalyzing(true);
      setAnalysis(null);
      getBattleAnalysis(pokemon1.name, pokemon2.name).then(res => {
        if (res) setAnalysis(res);
        setAnalyzing(false);
      });
    } else {
      setAnalysis(null);
    }
  }, [pokemon1, pokemon2]);

  const handleSearch = async (num: 1 | 2, name: string) => {
    if (!name) return;
    setLoading(prev => ({ ...prev, [num === 1 ? 'p1' : 'p2']: true }));
    try {
      const detail = await fetchPokemonDetail(name.toLowerCase());
      if (num === 1) setPokemon1(detail);
      else setPokemon2(detail);
    } catch (e) {
      alert("Pokemon tidak ditemukan!");
    } finally {
      setLoading(prev => ({ ...prev, [num === 1 ? 'p1' : 'p2']: false }));
    }
  };

  const statConfig = [
    { label: "HP", key: "hp" as keyof PokemonDetail["stats"], icon: Heart, color: "text-red-500" },
    { label: "Serangan", key: "attack" as keyof PokemonDetail["stats"], icon: Sword, color: "text-orange-500" },
    { label: "Pertahanan", key: "defense" as keyof PokemonDetail["stats"], icon: Shield, color: "text-blue-500" },
    { label: "Sp. Serangan", key: "specialAttack" as keyof PokemonDetail["stats"], icon: Zap, color: "text-purple-500" },
    { label: "Sp. Pertahanan", key: "specialDefense" as keyof PokemonDetail["stats"], icon: Activity, color: "text-green-500" },
    { label: "Kecepatan", key: "speed" as keyof PokemonDetail["stats"], icon: Zap, color: "text-pink-500" },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-white mb-2">Bandingkan Statistik</h2>
        <p className="text-slate-400">Bandingkan dua Pokemon untuk melihat siapa yang lebih unggul</p>
      </div>

      <div className={`grid grid-cols-1 ${pokemon1 && pokemon2 ? 'md:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-[1fr_auto_1fr]'} gap-8 items-start`}>
        {/* Slot 1 */}
        <div className="space-y-6 order-1">
          <div className="relative flex gap-2" ref={wrapperRef1}>
            <input
              type="text"
              placeholder="Nama Pokemon 1..."
              className="flex-1 px-4 py-3 bg-white/5 text-white placeholder-slate-400 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium w-full min-w-0"
              value={query1}
              onChange={(e) => {
                setQuery1(e.target.value);
                setShowSuggest1(true);
              }}
              onFocus={() => setShowSuggest1(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(1, query1);
                  setShowSuggest1(false);
                }
              }}
            />
            <button
              onClick={() => {
                handleSearch(1, query1);
                setShowSuggest1(false);
              }}
              disabled={loading.p1}
              className="shrink-0 bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 border border-red-500 flex items-center justify-center w-12"
            >
              {loading.p1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showSuggest1 && query1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-14 left-0 right-14 bg-slate-900 rounded-xl shadow-xl border border-white/10 max-h-60 overflow-y-auto z-50"
                >
                  {allNames.filter(p => p.name.toLowerCase().includes(query1.toLowerCase())).slice(0, 50).map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setQuery1(p.name);
                        setShowSuggest1(false);
                        handleSearch(1, p.name);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 capitalize text-sm text-slate-300 transition-colors border-b border-white/5 last:border-0"
                    >
                      {p.name}
                    </button>
                  ))}
                  {allNames.filter(p => p.name.toLowerCase().includes(query1.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500">Tidak ada hasil</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {pokemon1 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6 mb-4">
                <img src={pokemon1.image || undefined} alt={pokemon1.name} className="w-32 h-32 lg:w-40 lg:h-40 mx-auto object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-xl font-bold capitalize text-white">{pokemon1.name}</h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {pokemon1.types.map(t => (
                  <span key={t} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
                    <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${t}.svg`} alt={t} className="w-3 h-3 opacity-60" />
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="aspect-square bg-white/5 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-slate-400 font-bold p-4 text-center">
              Pilih Pokemon 1
            </div>
          )}
        </div>

        {/* Center: VS or Stats */}
        <div className="order-3 md:order-2 w-full mt-8 md:mt-0">
          {pokemon1 && pokemon2 ? (
            <div className="space-y-4">
              {statConfig.map((stat) => {
                const v1 = pokemon1.stats[stat.key];
                const v2 = pokemon2.stats[stat.key];
                const diff = v1 - v2;
                
                return (
                  <div key={stat.label} className="bg-white/5 p-3 lg:p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                      <stat.icon className={`w-3 h-3 lg:w-4 lg:h-4 ${stat.color}`} />
                      <span className="text-[10px] lg:text-xs font-black uppercase text-slate-400 tracking-widest">{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-6">
                      <div className="text-sm lg:text-lg font-black text-white w-8 lg:w-12 text-right">{v1}</div>
                      <div className="flex-1 relative h-2 lg:h-3 bg-white/10 rounded-full overflow-hidden flex">
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-500 z-10" />
                        <div 
                          className={`h-full transition-all duration-500 ease-out ${diff > 0 ? 'bg-green-500 rounded-r-lg' : 'bg-transparent'}`}
                          style={{ width: `${Math.max(0, (diff / 255) * 50)}%`, marginLeft: '50%' }}
                        />
                        <div 
                            className={`h-full transition-all duration-500 ease-out ${diff < 0 ? 'bg-red-500 rounded-l-lg' : 'bg-transparent'}`}
                            style={{ width: `${Math.max(0, (Math.abs(diff) / 255) * 50)}%`, marginLeft: `${50 - Math.max(0, (Math.abs(diff) / 255) * 50)}%` }}
                        />
                      </div>
                      <div className="text-sm lg:text-lg font-black text-white w-8 lg:w-12">{v2}</div>
                    </div>
                    <div className="flex justify-between mt-1 lg:mt-2 text-[8px] lg:text-[10px] font-bold uppercase tracking-widest">
                      <span className={diff > 0 ? "text-green-500" : "text-transparent"}>{diff > 0 ? `+${diff}` : "+0"}</span>
                      <span className={diff < 0 ? "text-red-500" : "text-transparent"}>{diff < 0 ? `+${Math.abs(diff)}` : "+0"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full pt-20">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-black italic transform -rotate-12 shadow-lg">VS</div>
            </div>
          )}
        </div>

        {/* Slot 2 */}
        <div className="space-y-6 order-2 md:order-3">
          <div className="relative flex gap-2" ref={wrapperRef2}>
            <input
              type="text"
              placeholder="Nama Pokemon 2..."
              className="flex-1 px-4 py-3 bg-white/5 text-white placeholder-slate-400 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium w-full min-w-0"
              value={query2}
              onChange={(e) => {
                setQuery2(e.target.value);
                setShowSuggest2(true);
              }}
              onFocus={() => setShowSuggest2(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(2, query2);
                  setShowSuggest2(false);
                }
              }}
            />
            <button
              onClick={() => {
                handleSearch(2, query2);
                setShowSuggest2(false);
              }}
              disabled={loading.p2}
              className="shrink-0 bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 border border-red-500 flex items-center justify-center w-12"
            >
              {loading.p2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showSuggest2 && query2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-14 left-0 right-14 bg-slate-900 rounded-xl shadow-xl border border-white/10 max-h-60 overflow-y-auto z-50"
                >
                  {allNames.filter(p => p.name.toLowerCase().includes(query2.toLowerCase())).slice(0, 50).map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setQuery2(p.name);
                        setShowSuggest2(false);
                        handleSearch(2, p.name);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 capitalize text-sm text-slate-300 transition-colors border-b border-white/5 last:border-0"
                    >
                      {p.name}
                    </button>
                  ))}
                  {allNames.filter(p => p.name.toLowerCase().includes(query2.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-500">Tidak ada hasil</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {pokemon2 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 lg:p-6 mb-4">
                <img src={pokemon2.image || undefined} alt={pokemon2.name} className="w-32 h-32 lg:w-40 lg:h-40 mx-auto object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-xl font-bold capitalize text-white">{pokemon2.name}</h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {pokemon2.types.map(t => (
                  <span key={t} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 px-2 py-0.5 rounded-full border border-white/10">
                    <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${t}.svg`} alt={t} className="w-3 h-3 opacity-60" />
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="aspect-square bg-white/5 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-slate-400 font-bold p-4 text-center">
              Pilih Pokemon 2
            </div>
          )}
        </div>
      </div>

      {/* AI Battle Analysis Section */}
      {pokemon1 && pokemon2 && (
        <div className="mt-12 bg-blue-500/10 rounded-2xl p-6 md:p-8 border border-blue-500/20 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-blue-500/20 transform rotate-12">
            <Sparkles className="w-40 h-40" />
          </div>

          <div className="relative z-10">
            <h3 className="text-lg font-black uppercase text-blue-400 tracking-widest mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> Analisis Pertarungan AI
            </h3>

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="font-bold text-blue-400 animate-pulse text-sm uppercase tracking-widest">Gemini sedang menganalisis pertarungan...</p>
              </div>
            ) : analysis ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
                <div className="bg-white/5 rounded-2xl p-6 shadow-sm border border-white/10">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-1">Prediksi Pemenang</h4>
                      <p className="text-xl font-bold text-white capitalize mb-2">{analysis.winner}</p>
                      <p className="text-slate-300 text-sm leading-relaxed">{analysis.explanation}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* P1 Win Conditions */}
                  <div className="bg-white/5 rounded-2xl p-6 shadow-sm border border-white/10">
                    <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Bagaimana <span className="text-red-400 capitalize">{pokemon1.name}</span> Menang?</h4>
                    <ul className="space-y-3">
                      {analysis.p1WinConditions.map((cond, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                          <span className="text-red-400 font-bold">•</span>
                          {cond}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* P2 Win Conditions */}
                  <div className="bg-white/5 rounded-2xl p-6 shadow-sm border border-white/10">
                    <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Bagaimana <span className="text-blue-400 capitalize">{pokemon2.name}</span> Menang?</h4>
                    <ul className="space-y-3">
                      {analysis.p2WinConditions.map((cond, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                          <span className="text-blue-400 font-bold">•</span>
                          {cond}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="mt-6 text-center text-slate-400 text-sm italic bg-white/5 p-6 rounded-2xl border border-white/10">
                Limit API / Gagal memuat analisis dari AI. Silakan coba lagi nanti.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
