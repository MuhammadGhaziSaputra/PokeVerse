import React from "react";
import { motion } from "motion/react";
import { PokemonBasic } from "../types";

interface Props {
  pokemon: PokemonBasic;
  onClick: (id: number) => void;
}

const typeColors: Record<string, string> = {
  normal: "bg-slate-400",
  fire: "bg-orange-500",
  water: "bg-blue-500",
  grass: "bg-green-500",
  electric: "bg-yellow-400 text-slate-900",
  ice: "bg-blue-200 text-slate-900",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-yellow-700",
  flying: "bg-indigo-300 text-slate-900",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-yellow-800",
  ghost: "bg-purple-800",
  dragon: "bg-indigo-700",
  dark: "bg-slate-900",
  steel: "bg-slate-500 text-white",
  fairy: "bg-pink-300 text-slate-900",
};

export function getPokemonGeneration(id: number): string {
  if (id <= 151) return "Gen 1";
  if (id <= 251) return "Gen 2";
  if (id <= 386) return "Gen 3";
  if (id <= 493) return "Gen 4";
  if (id <= 649) return "Gen 5";
  if (id <= 721) return "Gen 6";
  if (id <= 809) return "Gen 7";
  if (id <= 905) return "Gen 8";
  return "Gen 9";
}

const PokemonCard: React.FC<Props> = ({ pokemon, onClick }) => {
  return (
    <motion.div
      layoutId={`pokemon-${pokemon.id}`}
      onClick={() => onClick(pokemon.id)}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white rounded-2xl p-4 shadow-lg cursor-pointer border border-slate-100 hover:shadow-xl transition-all"
      id={`pokemon-card-${pokemon.id}`}
    >
      <div className="relative aspect-square mb-4 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-4">
        <img
          src={pokemon.image || undefined}
          alt={pokemon.name}
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
        <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-slate-400 bg-white/80 px-2 py-0.5 rounded shadow-sm">
          {getPokemonGeneration(pokemon.id)}
        </span>
        <span className="absolute top-2 right-2 text-xs font-mono font-bold w-12 text-center text-slate-400 bg-white/80 px-1 py-0.5 rounded shadow-sm">
          #{String(pokemon.id).padStart(3, '0')}
        </span>
      </div>
      <h3 className="text-lg font-bold capitalize text-slate-900 mb-2 truncate">
        {pokemon.name}
      </h3>
      <div className="flex gap-2">
        {pokemon.types.map((type) => (
          <span
            key={type}
            className={`${typeColors[type] || "bg-slate-200"} text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm flex items-center gap-1`}
          >
            <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`} alt={type} className="w-3 h-3 invert contrast-200 brightness-200" />
            {type}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default PokemonCard;
