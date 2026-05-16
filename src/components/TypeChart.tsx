import { useState } from "react";
import { ShieldAlert, ShieldCheck, ShieldOff, Swords } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const allTypes = [
  "normal", "fire", "water", "grass", "electric", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy"
];

// 0: Immune, 0.5: Not very effective, 1: Normal, 2: Super effective
const typeEffectiveness: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, water: 1, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

// Helper to get defensive multiplier
const getDefensiveMultiplier = (defendingTypes: string[], attackingType: string) => {
  let multiplier = 1;
  for (const defType of defendingTypes) {
    // Default to 1 if not defined in matrix (meaning normal effectiveness)
    // We need to look up attackingType -> defType
    const eff = typeEffectiveness[attackingType]?.[defType];
    if (eff !== undefined) {
      multiplier *= eff;
    }
  }
  return multiplier;
};

const typeColors: Record<string, string> = {
  "normal": "bg-slate-400 text-white",
  "fire": "bg-orange-500 text-white",
  "water": "bg-blue-500 text-white",
  "grass": "bg-green-500 text-white",
  "electric": "bg-yellow-400 text-slate-900",
  "ice": "bg-blue-200 text-slate-900",
  "fighting": "bg-red-700 text-white",
  "poison": "bg-purple-500 text-white",
  "ground": "bg-yellow-700 text-white",
  "flying": "bg-indigo-300 text-slate-900",
  "psychic": "bg-pink-500 text-white",
  "bug": "bg-lime-500 text-slate-900",
  "rock": "bg-yellow-800 text-white",
  "ghost": "bg-purple-800 text-white",
  "dragon": "bg-indigo-700 text-white",
  "dark": "bg-slate-900 text-white",
  "steel": "bg-slate-500 text-white",
  "fairy": "bg-pink-300 text-slate-900",
};

export default function TypeChart() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      }
      if (prev.length >= 2) {
        return [prev[1], type];
      }
      return [...prev, type];
    });
  };

  const calculateDefenses = () => {
    if (selectedTypes.length === 0) return null;

    const weak: string[] = [];
    const veryWeak: string[] = [];
    const resist: string[] = [];
    const veryResist: string[] = [];
    const immune: string[] = [];

    allTypes.forEach(atkType => {
      const multiplier = getDefensiveMultiplier(selectedTypes, atkType);
      if (multiplier === 4) veryWeak.push(atkType);
      else if (multiplier === 2) weak.push(atkType);
      else if (multiplier === 0.5) resist.push(atkType);
      else if (multiplier === 0.25) veryResist.push(atkType);
      else if (multiplier === 0) immune.push(atkType);
    });

    return { veryWeak, weak, resist, veryResist, immune };
  };

  const defenses = calculateDefenses();

  const TypeBadge = ({ type }: { type: string }) => {
    return (
      <span className={`px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${typeColors[type] || "bg-slate-200"}`}>
        <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`} alt={type} className="w-3.5 h-3.5" />
        {type}
      </span>
    );
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/10">
      <div className="text-center mb-10">
        <div className="inline-flex p-3 bg-blue-500/20 rounded-2xl mb-4">
          <ShieldCheck className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Analisis Tipe Pokemon</h2>
        <p className="text-slate-400">Pilih 1 atau 2 tipe untuk melihat kelemahan dan kekuatannya (Bertahan)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-10">
        {allTypes.map(type => {
          const isSelected = selectedTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`p-3 rounded-xl flex items-center justify-center gap-2 border border-white/10 font-bold uppercase tracking-wider text-xs transition-all ${
                isSelected 
                  ? `border-transparent shadow-md scale-105 ${typeColors[type]}` 
                  : "bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <img 
                src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`} 
                alt={type} 
                className={`w-4 h-4 ${isSelected ? "" : "opacity-40 grayscale"}`} 
              />
              {type}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedTypes.length > 0 ? (
          <motion.div
            key={selectedTypes.join("-")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-black/20 rounded-3xl p-6 border border-white/5"
          >
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tipe Terpilih:</span>
              {selectedTypes.map(t => <TypeBadge key={t} type={t} />)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weaknesses */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-400 mb-4">
                  <Swords className="w-5 h-5" />
                  <h3 className="font-black uppercase tracking-widest">Kelemahan (Menerima Lebih Banyak Kerusakan)</h3>
                </div>
                
                {defenses?.veryWeak.length ? (
                   <div className="bg-white/5 p-4 rounded-2xl shadow-sm border border-red-500/10">
                      <span className="text-xs font-bold text-slate-400 block mb-2">Sangat Lemah (4x Damage)</span>
                      <div className="flex flex-wrap gap-2">
                        {defenses.veryWeak.map(t => <TypeBadge key={t} type={t} />)}
                      </div>
                   </div>
                ) : null}

                {defenses?.weak.length ? (
                   <div className="bg-white/5 p-4 rounded-2xl shadow-sm border border-white/5">
                      <span className="text-xs font-bold text-slate-400 block mb-2">Lemah (2x Damage)</span>
                      <div className="flex flex-wrap gap-2">
                        {defenses.weak.map(t => <TypeBadge key={t} type={t} />)}
                      </div>
                   </div>
                ) : null}

                {!defenses?.veryWeak.length && !defenses?.weak.length && (
                  <p className="text-sm text-slate-500 font-medium">Tidak ada kelemahan.</p>
                )}
              </div>

              {/* Resistances */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-black uppercase tracking-widest">Ketahanan (Menerima Lebih Sedikit Kerusakan)</h3>
                </div>
                
                {defenses?.immune.length ? (
                   <div className="bg-white/5 p-4 rounded-2xl shadow-sm border border-green-500/20">
                      <span className="text-xs font-bold text-slate-400 block mb-2 flex items-center gap-1">
                        <ShieldOff className="w-3 h-3" /> Kebal (0x Damage)
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {defenses.immune.map(t => <TypeBadge key={t} type={t} />)}
                      </div>
                   </div>
                ) : null}

                {defenses?.veryResist.length ? (
                   <div className="bg-white/5 p-4 rounded-2xl shadow-sm border border-white/5">
                      <span className="text-xs font-bold text-slate-400 block mb-2">Sangat Tahan (0.25x Damage)</span>
                      <div className="flex flex-wrap gap-2">
                        {defenses.veryResist.map(t => <TypeBadge key={t} type={t} />)}
                      </div>
                   </div>
                ) : null}

                {defenses?.resist.length ? (
                   <div className="bg-white/5 p-4 rounded-2xl shadow-sm border border-white/5">
                      <span className="text-xs font-bold text-slate-400 block mb-2">Tahan (0.5x Damage)</span>
                      <div className="flex flex-wrap gap-2">
                        {defenses.resist.map(t => <TypeBadge key={t} type={t} />)}
                      </div>
                   </div>
                ) : null}
                
                {!defenses?.immune.length && !defenses?.veryResist.length && !defenses?.resist.length && (
                  <p className="text-sm text-slate-500 font-medium">Tidak ada ketahanan.</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest"
          >
            Silahkan pilih tipe untuk melihat analisis
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
