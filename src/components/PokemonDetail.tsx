import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PokemonDetail as IPokemonDetail, MoveRecommendation } from "../types";
import { X, Ruler, Weight, Zap, Shield, Sword, Heart, Activity, Target, Sparkles, Volume2, ArrowRight } from "lucide-react";
import { getBestMoves } from "../services/geminiService";

interface Props {
  pokemon: IPokemonDetail | null;
  onClose: () => void;
  onPokemonSelect?: (id: number) => void;
}

const typeColors: Record<string, string> = {
  normal: "from-slate-400 to-slate-500",
  fire: "from-orange-500 to-orange-600",
  water: "from-blue-500 to-blue-600",
  grass: "from-green-500 to-green-600",
  electric: "from-yellow-400 to-yellow-500",
  ice: "from-blue-200 to-blue-300",
  fighting: "from-red-700 to-red-800",
  poison: "from-purple-500 to-purple-600",
  ground: "from-yellow-700 to-yellow-800",
  flying: "from-indigo-300 to-indigo-400",
  psychic: "from-pink-500 to-pink-600",
  bug: "from-lime-500 to-lime-600",
  rock: "from-yellow-800 to-yellow-900",
  ghost: "from-purple-800 to-purple-900",
  dragon: "from-indigo-700 to-indigo-800",
  dark: "from-slate-800 to-slate-900",
  steel: "from-slate-500 to-slate-600",
  fairy: "from-pink-300 to-pink-400",
};

export default function PokemonDetail({ pokemon, onClose, onPokemonSelect }: Props) {
  const [bestMoves, setBestMoves] = useState<MoveRecommendation[]>([]);
  const [loadingMoves, setLoadingMoves] = useState(false);
  const [isShiny, setIsShiny] = useState(false);

  const [activeTab, setActiveTab] = useState<"info" | "stats" | "moves">("info");

  useEffect(() => {
    if (pokemon) {
      setLoadingMoves(true);
      setBestMoves([]);
      setIsShiny(false);
      // Reset active tab when opening a new pokemon so it always starts at info
      setActiveTab("info");
      getBestMoves(pokemon.name).then((moves) => {
        if (moves) setBestMoves(moves);
        setLoadingMoves(false);
      });
    }
  }, [pokemon]);

  const playCry = () => {
    if (pokemon?.cries) {
      const audio = new Audio(pokemon.cries);
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Error playing cry", e));
    }
  };

  if (!pokemon) return null;

  const mainType = pokemon.types[0];
  const bgGradient = typeColors[mainType] || "from-slate-200 to-slate-300";

  const currentImage = isShiny && pokemon.shinyImage ? pokemon.shinyImage : pokemon.image;

  const statConfig = [
    { label: "HP", value: pokemon.stats.hp, icon: Heart, color: "bg-red-500" },
    { label: "SERANGAN", value: pokemon.stats.attack, icon: Sword, color: "bg-orange-500" },
    { label: "PERTAHANAN", value: pokemon.stats.defense, icon: Shield, color: "bg-blue-500" },
    { label: "SP. SERANGAN", value: pokemon.stats.specialAttack, icon: Zap, color: "bg-purple-500" },
    { label: "SP. PERTAHANAN", value: pokemon.stats.specialDefense, icon: Activity, color: "bg-green-500" },
    { label: "KECEPATAN", value: pokemon.stats.speed, icon: Zap, color: "bg-pink-500" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
  
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          layoutId={`pokemon-${pokemon.id}`}
          className="relative bg-[#0B1021] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
          id={`pokemon-detail-${pokemon.id}`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className={`w-full md:w-2/5 p-8 bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center relative min-h-[300px]`}>
            {pokemon.cries && (
              <button 
                onClick={playCry}
                className="absolute top-4 left-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors shadow-sm"
                title="Dengarkan Suara"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
            
            {pokemon.shinyImage && (
              <button 
                onClick={() => setIsShiny(!isShiny)}
                className={`absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isShiny ? 'bg-yellow-400 text-yellow-900 border border-yellow-300' : 'bg-black/20 text-white hover:bg-black/40 border border-white/20'}`}
                title="Lihat Versi Shiny"
              >
                <Sparkles className="w-3 h-3" /> Shiny
              </button>
            )}

            <img
              src={currentImage || undefined}
              alt={pokemon.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (pokemon.fallbackImage && target.src !== pokemon.fallbackImage && target.src !== pokemon.spriteImage) {
                  target.src = pokemon.fallbackImage;
                } else if (pokemon.spriteImage && target.src !== pokemon.spriteImage) {
                  target.src = pokemon.spriteImage;
                } else {
                  target.style.display = 'none';
                }
              }}
              className="w-full max-w-[250px] h-auto object-contain z-10 drop-shadow-2xl transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-4xl !font-heading font-black text-white capitalize mt-6 text-center drop-shadow-md">
              {pokemon.name}
            </h2>
            <div className="flex gap-2 mt-4">
              {pokemon.types.map((type) => (
                <span key={type} className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border border-white/20 shadow-inner">
                  <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`} alt={type} className="w-4 h-4 invert contrast-200 brightness-200" />
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col text-white">
            <div className="flex border-b border-white/10 p-4 gap-2 overflow-x-auto scrollbar-hide shrink-0">
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'info' ? 'bg-white/20 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Informasi Umum
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'stats' ? 'bg-white/20 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Statistik & AI
              </button>
              <button 
                onClick={() => setActiveTab('moves')}
                className={`flex-1 min-w-[100px] px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'moves' ? 'bg-white/20 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Moveset
              </button>
            </div>

            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              {activeTab === 'info' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center shadow-inner">
                      <Weight className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xl font-black text-white">{pokemon.weight} kg</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Berat</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center shadow-inner">
                      <Ruler className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xl font-black text-white">{pokemon.height} m</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Tinggi</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono flex items-center gap-2">
                      <Target className="w-4 h-4 cursor-pointer" /> Kemampuan (Abilities)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pokemon.abilities && pokemon.abilities.map((ability) => (
                        <span key={ability.name} className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider border shadow-md flex items-center gap-2 ${ability.isHidden ? 'bg-purple-900/40 border-purple-500/50 text-purple-200' : 'bg-white/10 border-white/20 text-white'}`}>
                          {ability.name.replace('-', ' ')}
                          {ability.isHidden && <span className="text-[9px] uppercase bg-purple-500/50 px-1.5 py-0.5 rounded-full text-white">Hidden</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">Peluang Penemuan</h3>
                    <p className="text-slate-300 leading-relaxed text-sm italic bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner">
                      "{pokemon.description}"
                    </p>
                  </div>

                  {pokemon.evolutionChain && pokemon.evolutionChain.length > 1 && (
                    <div className="overflow-hidden">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Rantai Evolusi
                      </h3>
                      <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {pokemon.evolutionChain.map((evo, i) => (
                          <div key={evo.id} className="flex items-center gap-4 shrink-0">
                            <div 
                              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${pokemon.id === evo.id ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
                              onClick={() => {
                                if (pokemon.id !== evo.id && onPokemonSelect) {
                                  onPokemonSelect(evo.id);
                                }
                              }}
                            >
                              <img 
                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png`}
                                alt={evo.name}
                                className="w-16 h-16 object-contain drop-shadow-lg"
                              />
                              <span className="text-[10px] font-bold tracking-widest text-white uppercase mt-2">{evo.name}</span>
                            </div>
                            {i < pokemon.evolutionChain!.length - 1 && (
                              <div className="text-slate-500">
                                <ArrowRight className="w-5 h-5 opacity-50" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Statistik Dasar
                    </h3>
                    <div className="space-y-4 md:space-y-5">
                      {statConfig.map((stat, i) => (
                        <div key={stat.label} className="flex items-center gap-4">
                          <div className="w-24 shrink-0 text-[10px] font-bold text-slate-400 tracking-wider">
                            {stat.label}
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 bg-white/5 h-3 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
                              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                              <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: `${(stat.value / 255) * 100}%`, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.1 }}
                                className={`h-full relative overflow-hidden ${stat.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                              >
                                 <div className="absolute inset-0 bg-white/20 w-8 blur-md -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                              </motion.div>
                            </div>
                            <div className="w-8 shrink-0 text-right text-xs font-black text-white">
                              {stat.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Strategi AI
                    </h3>
                    {loadingMoves ? (
                      <div className="flex bg-white/5 border border-white/10 rounded-2xl p-6 items-center justify-center animate-pulse shadow-inner">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> Memuat Data Strategi...</span>
                      </div>
                    ) : bestMoves.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {bestMoves.map((move, i) => (
                          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-bold text-white tracking-wider">{move.name}</span>
                              <span className="text-[10px] bg-white/10 border border-white/20 px-2 py-1 rounded-full font-bold text-white uppercase tracking-widest shadow-inner">{move.type}</span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{move.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm italic bg-white/5 p-4 rounded-xl border border-white/5">Limit API / Gagal memuat data strategi dari AI. Silakan coba lagi nanti.</div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'moves' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sword className="w-4 h-4" /> Daftar Jurus (Moveset)
                  </h3>
                  
                  {!pokemon.moves || pokemon.moves.length === 0 ? (
                    <div className="text-slate-400 text-sm italic bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">Data jurus tidak tersedia.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] pr-2 overflow-y-auto custom-scrollbar">
                      {pokemon.moves.sort((a,b) => (a.levelLearnedAt ?? 0) - (b.levelLearnedAt ?? 0)).map((move, i) => (
                        <div key={`${move.name}-${i}`} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-colors group shadow-sm">
                          <span className="font-bold text-sm text-white capitalize tracking-wide group-hover:text-red-400 transition-colors">
                            {move.name.replace('-', ' ')}
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            {move.method === 'level-up' && move.levelLearnedAt ? (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-500/30">Lv. {move.levelLearnedAt}</span>
                            ) : (
                              <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-white/10">{move.method?.replace('-', ' ')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
