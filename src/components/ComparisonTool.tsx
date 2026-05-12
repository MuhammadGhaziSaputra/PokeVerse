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
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Bandingkan Statistik</h2>
        <p className="text-slate-500">Bandingkan dua Pokemon untuk melihat siapa yang lebih unggul</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-8 items-start">
        {/* Slot 1 */}
        <div className="space-y-6">
          <div className="relative flex gap-2" ref={wrapperRef1}>
            <input
              type="text"
              placeholder="Nama Pokemon 1..."
              className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
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
              className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading.p1 ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showSuggest1 && query1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-14 left-0 right-14 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50"
                >
                  {allNames.filter(p => p.name.toLowerCase().includes(query1.toLowerCase())).slice(0, 50).map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setQuery1(p.name);
                        setShowSuggest1(false);
                        handleSearch(1, p.name);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 capitalize text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                    >
                      {p.name}
                    </button>
                  ))}
                  {allNames.filter(p => p.name.toLowerCase().includes(query1.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400">Tidak ada hasil</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {pokemon1 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="bg-slate-50 rounded-2xl p-6 mb-4">
                <img src={pokemon1.image || undefined} alt={pokemon1.name} className="w-40 h-40 mx-auto object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-xl font-bold capitalize text-slate-900">{pokemon1.name}</h3>
              <div className="flex justify-center gap-2 mt-2">
                {pokemon1.types.map(t => (
                  <span key={t} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${t}.svg`} alt={t} className="w-3 h-3 opacity-60" />
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-bold">
              Pilih Pokemon 1
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="hidden md:flex flex-col items-center justify-center h-full pt-20">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-black italic transform -rotate-12 shadow-lg">VS</div>
        </div>

        {/* Slot 2 */}
        <div className="space-y-6">
          <div className="relative flex gap-2" ref={wrapperRef2}>
            <input
              type="text"
              placeholder="Nama Pokemon 2..."
              className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
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
              className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading.p2 ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showSuggest2 && query2 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-14 left-0 right-14 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50"
                >
                  {allNames.filter(p => p.name.toLowerCase().includes(query2.toLowerCase())).slice(0, 50).map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setQuery2(p.name);
                        setShowSuggest2(false);
                        handleSearch(2, p.name);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 capitalize text-sm text-slate-700 transition-colors border-b border-slate-50 last:border-0"
                    >
                      {p.name}
                    </button>
                  ))}
                  {allNames.filter(p => p.name.toLowerCase().includes(query2.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400">Tidak ada hasil</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {pokemon2 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="bg-slate-50 rounded-2xl p-6 mb-4">
                <img src={pokemon2.image || undefined} alt={pokemon2.name} className="w-40 h-40 mx-auto object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-xl font-bold capitalize text-slate-900">{pokemon2.name}</h3>
              <div className="flex justify-center gap-2 mt-2">
                {pokemon2.types.map(t => (
                  <span key={t} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${t}.svg`} alt={t} className="w-3 h-3 opacity-60" />
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 font-bold">
              Pilih Pokemon 2
            </div>
          )}
        </div>
      </div>

      {pokemon1 && pokemon2 && (
        <div className="mt-12 space-y-4">
          {statConfig.map((stat) => {
            const v1 = pokemon1.stats[stat.key];
            const v2 = pokemon2.stats[stat.key];
            const diff = v1 - v2;
            
            return (
              <div key={stat.label} className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{stat.label}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-lg font-black text-slate-900 w-12 text-right">{v1}</div>
                  <div className="flex-1 relative h-3 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white z-10" />
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${diff > 0 ? 'bg-green-500 rounded-r-lg' : 'bg-transparent'}`}
                      style={{ width: `${Math.max(0, (diff / 255) * 50)}%`, marginLeft: '50%' }}
                    />
                    <div 
                        className={`h-full transition-all duration-500 ease-out ${diff < 0 ? 'bg-red-500 rounded-l-lg' : 'bg-transparent'}`}
                        style={{ width: `${Math.max(0, (Math.abs(diff) / 255) * 50)}%`, marginLeft: `${50 - Math.max(0, (Math.abs(diff) / 255) * 50)}%` }}
                    />
                  </div>
                  <div className="text-lg font-black text-slate-900 w-12">{v2}</div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-widest">
                  <span className={diff > 0 ? "text-green-600" : "text-slate-400"}>{diff > 0 ? `+${diff}` : ""}</span>
                  <span className={diff < 0 ? "text-red-600" : "text-slate-400"}>{diff < 0 ? `+${Math.abs(diff)}` : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Battle Analysis Section */}
      {pokemon1 && pokemon2 && (
        <div className="mt-12 bg-blue-50/50 rounded-2xl p-6 md:p-8 border border-blue-100 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-blue-100 opacity-50 transform rotate-12">
            <Sparkles className="w-40 h-40" />
          </div>

          <div className="relative z-10">
            <h3 className="text-lg font-black uppercase text-blue-900 tracking-widest mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> Analisis Pertarungan AI
            </h3>

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="font-bold text-blue-400 animate-pulse text-sm uppercase tracking-widest">Gemini sedang menganalisis pertarungan...</p>
              </div>
            ) : analysis ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-50">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-1">Prediksi Pemenang</h4>
                      <p className="text-xl font-bold text-slate-900 capitalize mb-2">{analysis.winner}</p>
                      <p className="text-slate-600 text-sm leading-relaxed">{analysis.explanation}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* P1 Win Conditions */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-50">
                    <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Bagaimana <span className="text-red-500 capitalize">{pokemon1.name}</span> Menang?</h4>
                    <ul className="space-y-3">
                      {analysis.p1WinConditions.map((cond, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                          <span className="text-red-500 font-bold">•</span>
                          {cond}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* P2 Win Conditions */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-50">
                    <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Bagaimana <span className="text-blue-500 capitalize">{pokemon2.name}</span> Menang?</h4>
                    <ul className="space-y-3">
                      {analysis.p2WinConditions.map((cond, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-600 leading-relaxed">
                          <span className="text-blue-500 font-bold">•</span>
                          {cond}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
