import { Search, Layers, ArrowUpDown, ChevronDown, Heart } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { typeHexColors } from "./PokemonCard";

interface Props {
  onSearch: (query: string) => void;
  onFilterType: (types: string[]) => void;
  onFilterGen: (gen: string) => void;
  onSort: (sort: string) => void;
  currentSort: string;
  isFavoritesOnly?: boolean;
  onToggleFavorites?: () => void;
}

const ALL_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy"
];

const SORT_OPTIONS = [
  { value: "id_asc", label: "Pokedex Number" },
  { value: "bst_desc", label: "Base Stat (Tertinggi)" },
  { value: "bst_asc", label: "Base Stat (Terendah)" },
  { value: "name_asc", label: "Abjad (A-Z)" },
  { value: "name_desc", label: "Abjad (Z-A)" }
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

export default function SearchFilter({ onSearch, onFilterType, onFilterGen, onSort, currentSort, isFavoritesOnly = false, onToggleFavorites }: Props) {
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeGen, setActiveGen] = useState<string>("");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  
  const genScrollRef = useRef<HTMLDivElement>(null);
  const typeScrollRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    let newTypes = [...activeTypes];
    if (newTypes.includes(type)) {
      newTypes = newTypes.filter(t => t !== type);
    } else {
      if (newTypes.length < 2) {
        newTypes.push(type);
      } else {
        newTypes.shift();
        newTypes.push(type);
      }
    }
    setActiveTypes(newTypes);
    onFilterType(newTypes);
  };

  const handleGenClick = (gen: string) => {
    const newGen = activeGen === gen ? "" : gen;
    setActiveGen(newGen);
    onFilterGen(newGen);
  };

  return (
    <div className="flex flex-col gap-6 mb-12">
      <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto w-full">
        {/* Search Bar - Floating Glassmorphism Style */}
        <div className="relative group flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Cari Pokemon..."
            className="w-full pl-16 pr-6 py-5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl focus:ring-2 focus:ring-white/50 transition-all outline-none text-white font-medium text-lg placeholder:text-slate-500"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative shrink-0 flex gap-4" ref={sortRef}>
           <button
             onClick={() => setIsSortOpen(!isSortOpen)}
             className="w-full md:w-auto h-full px-6 py-5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl focus:ring-2 focus:ring-white/50 transition-all outline-none text-white font-medium hover:bg-white/15 flex items-center justify-between gap-4"
           >
             <div className="flex items-center gap-3">
               <ArrowUpDown className="w-5 h-5 text-slate-400" />
               <span>{SORT_OPTIONS.find(o => o.value === currentSort)?.label || "Sortir"}</span>
             </div>
             <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isSortOpen ? "rotate-180" : ""}`} />
           </button>

           <AnimatePresence>
             {isSortOpen && (
               <motion.div
                 initial={{ opacity: 0, y: -10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: -10, scale: 0.95 }}
                 transition={{ duration: 0.2 }}
                 className="absolute top-full mt-2 w-full md:w-64 right-0 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top"
               >
                 {SORT_OPTIONS.map(opt => (
                   <button
                     key={opt.value}
                     onClick={() => {
                       onSort(opt.value);
                       setIsSortOpen(false);
                     }}
                     className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors hover:bg-white/10 ${
                       currentSort === opt.value ? "text-red-400 tracking-wide" : "text-slate-300"
                     }`}
                   >
                     {opt.label}
                   </button>
                 ))}
               </motion.div>
             )}
           </AnimatePresence>
           
           {onToggleFavorites && (
             <button
                onClick={onToggleFavorites}
                className={`hidden md:flex items-center gap-3 h-full px-6 py-5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border ${isFavoritesOnly ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/10 backdrop-blur-xl text-slate-300 hover:text-white hover:bg-white/15 border-white/20 shadow-2xl'}`}
              >
                <Heart className={`w-5 h-5 ${isFavoritesOnly ? 'fill-current' : ''}`} />
                {isFavoritesOnly ? 'Semua' : 'Favorit'}
              </button>
           )}
        </div>
      </div>
      
      {onToggleFavorites && (
         <button
            onClick={onToggleFavorites}
            className={`md:hidden flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border ${isFavoritesOnly ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 border-white/20 shadow-2xl'}`}
          >
            <Heart className={`w-5 h-5 ${isFavoritesOnly ? 'fill-current' : ''}`} />
            {isFavoritesOnly ? 'Semua Pokemon' : 'Hanya Favorit'}
          </button>
       )}

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
             const isActive = activeTypes.includes(t);
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
