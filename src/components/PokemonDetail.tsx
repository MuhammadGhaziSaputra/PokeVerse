import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PokemonDetail as IPokemonDetail, MoveRecommendation } from "../types";
import { X, Ruler, Weight, Zap, Shield, Sword, Heart, Activity, Target, Sparkles, Volume2 } from "lucide-react";
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

  useEffect(() => {
    if (pokemon) {
      setLoadingMoves(true);
      setBestMoves([]);
      setIsShiny(false);
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
          className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
          id={`pokemon-detail-${pokemon.id}`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className={`w-full md:w-2/5 p-8 bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center relative min-h-[300px]`}>
            {pokemon.cries && (
              <button 
                onClick={playCry}
                className="absolute top-4 left-4 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors shadow-sm"
                title="Dengarkan Suara"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
            
            {pokemon.shinyImage && (
              <button 
                onClick={() => setIsShiny(!isShiny)}
                className={`absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-full backdrop-blur-md transition-colors shadow-sm flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${isShiny ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white hover:bg-white/40 border border-white/30'}`}
                title="Lihat Versi Shiny"
              >
                <Sparkles className="w-3 h-3" /> Shiny
              </button>
            )}

            <img
              src={currentImage || undefined}
              alt={pokemon.name}
              className="w-full max-w-[200px] h-auto object-contain z-10 drop-shadow-2xl transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-3xl font-black text-white capitalize mt-6 text-center">
              {pokemon.name}
            </h2>
            <div className="flex gap-2 mt-4">
              {pokemon.types.map((type) => (
                <span key={type} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border border-white/30">
                  <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`} alt={type} className="w-4 h-4 invert contrast-200 brightness-200" />
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center">
                <Weight className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-lg font-bold text-slate-900">{pokemon.weight} kg</span>
                <span className="text-xs text-slate-400 uppercase font-bold">Berat</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center">
                <Ruler className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-lg font-bold text-slate-900">{pokemon.height} m</span>
                <span className="text-xs text-slate-400 uppercase font-bold">Tinggi</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Statistik Dasar
              </h3>
              <div className="space-y-4">
                {statConfig.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase">
                      <span className="text-slate-500">{stat.label}</span>
                      <span className="text-slate-900">{stat.value}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.value / 255) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${stat.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Kemampuan</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {pokemon.abilities.map((ability) => (
                  <span key={ability} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold capitalize">
                    {ability.replace('-', ' ')}
                  </span>
                ))}
              </div>
              
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Deskripsi</h3>
              <p className="text-slate-600 leading-relaxed text-sm italic mb-8">
                "{pokemon.description}"
              </p>

              {pokemon.evolutionChain && pokemon.evolutionChain.length > 1 && (
                <div className="mb-8 overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Evolusi
                  </h3>
                  <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {pokemon.evolutionChain.map((evo, i) => (
                      <div key={evo.id} className="flex items-center gap-2 shrink-0">
                        <div 
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-colors cursor-pointer ${pokemon.id === evo.id ? 'border-red-500 bg-red-50' : 'border-slate-100 hover:border-red-300'}`}
                          onClick={() => {
                            if (pokemon.id !== evo.id && onPokemonSelect) {
                              onPokemonSelect(evo.id);
                              onClose();
                            }
                          }}
                        >
                          <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png`}
                            alt={evo.name}
                            className="w-16 h-16 object-contain drop-shadow-md"
                          />
                          <span className="text-xs font-bold text-slate-700 capitalize mt-2">{evo.name}</span>
                        </div>
                        {i < pokemon.evolutionChain!.length - 1 && (
                          <div className="text-slate-300">
                            <Sword className="w-4 h-4 rotate-180" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Serangan Terbaik
                </h3>
                {loadingMoves ? (
                  <div className="flex bg-slate-50 rounded-2xl p-6 items-center justify-center animate-pulse">
                     <span className="text-xs font-bold text-slate-400 uppercase">Memuat Serangan...</span>
                  </div>
                ) : bestMoves.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {bestMoves.map((move, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900">{move.name}</span>
                          <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-500 uppercase">{move.type}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{move.description}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
