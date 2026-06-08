import React from "react";
import { motion } from "motion/react";
import { PokemonBasic } from "../types";

import { Heart } from "lucide-react";

interface Props {
  pokemon: PokemonBasic;
  onClick: (id: number) => void;
  isLarge?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
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

export const typeHexColors: Record<string, string> = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0",
  grass: "#7AC74C", electric: "#F7D02C", ice: "#96D9D6",
  fighting: "#C22E28", poison: "#A33EA1", ground: "#E2BF65",
  flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC",
  dark: "#705746", steel: "#B7B7CE", fairy: "#D685AD"
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

const PokemonCard: React.FC<Props> = ({ pokemon, onClick, isLarge = false, isFavorite = false, onToggleFavorite }) => {
  const mainColor = typeHexColors[pokemon.types[0]] || "#ffffff";
  return (
    <motion.div
      layoutId={`pokemon-${pokemon.id}`}
      onClick={() => onClick(pokemon.id)}
      whileHover={{ y: -5, scale: 1.02, boxShadow: `0 0 30px -10px ${mainColor}` }}
      className={`relative group bg-white/5 backdrop-blur-lg rounded-3xl p-4 cursor-pointer border border-white/10 hover:border-white/30 transition-all overflow-hidden h-full flex flex-col justify-between ${isLarge ? "md:p-8" : ""}`}
      id={`pokemon-card-${pokemon.id}`}
    >
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500" 
        style={{ background: `radial-gradient(circle at top right, ${mainColor}, transparent 60%)` }}
      />
      <div className={`relative w-full aspect-square mb-4 bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-white/5 group-hover:bg-white/10 transition-colors`}>
        <img
          src={pokemon.image || undefined}
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
          className="w-full h-full object-contain filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-white/50 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded shadow-sm border border-white/10">
          {getPokemonGeneration(pokemon.id)}
        </span>
        <span className="absolute top-2 right-2 text-xs font-mono font-bold w-12 text-center text-white/50 bg-black/30 backdrop-blur-md px-1 py-0.5 rounded shadow-sm border border-white/10">
          #{String(pokemon.id).padStart(3, '0')}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(pokemon.id);
          }}
          className={`absolute bottom-2 right-2 p-2 rounded-full backdrop-blur-md border shadow-sm transition-all hover:scale-110 ${isFavorite ? "bg-red-500/80 border-red-400 text-white" : "bg-black/30 border-white/10 text-white/50 hover:bg-black/50 hover:text-white"}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
        </button>
      </div>
      <h3 className={`font-black capitalize text-white mb-3 truncate !font-heading ${isLarge ? "text-2xl" : "text-xl"}`}>
        {pokemon.name}
      </h3>
      <div className="flex flex-wrap gap-2">
        {pokemon.types.map((type) => (
          <span
            key={type}
            className={`${typeColors[type] || "bg-white/10 text-white"} text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 border border-white/10`}
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
