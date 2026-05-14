import { Search, Layers } from "lucide-react";
import { useState, useRef } from "react";
import { typeHexColors } from "./PokemonCard";

interface Props {
  onSearch: (query: string) => void;
  onFilterType: (type: string) => void;
  onFilterGen: (gen: string) => void;
}

const ALL_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy"
];

const GENERATIONS = [
  { label: "Gen 1", id: "1" },
  { label: "Gen 2", id: "2" },
  { label: "Gen 3", id: "3" },
  { label: "Gen 4", id: "4" },
  { label: "Gen 5", id: "5" },
  { label: "Gen 6", id: "6" },
  { label: "Gen 7", id: "7" },
  { label: "Gen 8", id: "8" },
  { label: "Gen 9", id: "9" }
];

export default function SearchFilter({ onSearch, onFilterType, onFilterGen }: Props) {
  const [activeType, setActiveType] = useState<string>("");
  const [activeGen, setActiveGen] = useState<string>("");
  
  const genScrollRef = useRef<HTMLDivElement>(null);
  const typeScrollRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const startDrag = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  const onDrag = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll speed
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleTypeClick = (type: string) => {
    const newType = activeType === type ? "" : type;
    setActiveType(newType);
    onFilterType(newType);
  };

  const handleGenClick = (gen: string) => {
    const newGen = activeGen === gen ? "" : gen;
    setActiveGen(newGen);
    onFilterGen(newGen);
  };

  return (
    <div className="flex flex-col gap-6 mb-12">
      {/* Search Bar - Floating Glassmorphism Style */}
      <div className="relative group max-w-2xl mx-auto w-full">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-white transition-colors" />
        <input
          type="text"
          placeholder="Cari Pokemon..."
          className="w-full pl-16 pr-6 py-5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl focus:ring-2 focus:ring-white/50 transition-all outline-none text-white font-medium text-lg placeholder:text-slate-500"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Interactive Filters */}
      <div className="flex flex-col gap-4">
         {/* Generation Filter */}
         <div 
           ref={genScrollRef}
           onMouseDown={(e) => startDrag(e, genScrollRef)}
           onMouseLeave={stopDrag}
           onMouseUp={stopDrag}
           onMouseMove={(e) => onDrag(e, genScrollRef)}
           className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
         >
           <div className="flex items-center gap-2 px-4 shrink-0 text-slate-400 font-bold uppercase tracking-widest text-xs pointer-events-none">
              <Layers className="w-4 h-4" /> Gen:
           </div>
           {GENERATIONS.map(g => (
             <button
               key={g.id}
               onClick={() => !isDragging && handleGenClick(g.id)}
               className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                 activeGen === g.id 
                   ? "bg-white text-slate-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105" 
                   : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
               }`}
             >
               {g.label}
             </button>
           ))}
         </div>

         {/* Type Filter */}
         <div 
           ref={typeScrollRef}
           onMouseDown={(e) => startDrag(e, typeScrollRef)}
           onMouseLeave={stopDrag}
           onMouseUp={stopDrag}
           onMouseMove={(e) => onDrag(e, typeScrollRef)}
           className={`flex gap-2 overflow-x-auto pb-4 scrollbar-hide select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
         >
           <div className="flex items-center justify-center shrink-0 px-4 text-slate-400 font-bold uppercase tracking-widest text-xs pointer-events-none">
             Type:
           </div>
           {ALL_TYPES.map(t => {
             const color = typeHexColors[t];
             const isActive = activeType === t;
             return (
               <button
                 key={t}
                 onClick={() => !isDragging && handleTypeClick(t)}
                 style={{
                    backgroundColor: isActive ? color : 'rgba(255,255,255,0.05)',
                    borderColor: isActive ? color : 'rgba(255,255,255,0.1)',
                    boxShadow: isActive ? `0 0 20px -5px ${color}` : 'none'
                 }}
                 className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                   isActive ? "text-white scale-105" : "text-slate-400 hover:text-white hover:bg-white/10"
                 }`}
               >
                 <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${t}.svg`} alt={t} className={`w-4 h-4 pointer-events-none ${isActive ? 'invert contrast-200 brightness-200' : 'opacity-60 grayscale'}`} />
                 {t}
               </button>
             );
           })}
         </div>
      </div>
    </div>
  );
}
