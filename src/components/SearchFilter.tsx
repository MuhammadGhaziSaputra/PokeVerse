import { Search, Filter, SlidersHorizontal, Layers } from "lucide-react";

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
  { label: "Gen 1 (Kanto)", id: "1", range: [1, 151] },
  { label: "Gen 2 (Johto)", id: "2", range: [152, 251] },
  { label: "Gen 3 (Hoenn)", id: "3", range: [252, 386] },
  { label: "Gen 4 (Sinnoh)", id: "4", range: [387, 493] },
  { label: "Gen 5 (Unova)", id: "5", range: [494, 649] },
  { label: "Gen 6 (Kalos)", id: "6", range: [650, 721] },
  { label: "Gen 7 (Alola)", id: "7", range: [722, 809] },
  { label: "Gen 8 (Galar)", id: "8", range: [810, 905] },
  { label: "Gen 9 (Paldea)", id: "9", range: [906, 1025] }
];

export default function SearchFilter({ onSearch, onFilterType, onFilterGen }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-10">
      <div className="relative flex-1 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
        <input
          type="text"
          placeholder="Cari nama Pokemon atau ID..."
          className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-red-500 transition-all outline-none text-slate-900 font-medium"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      
      <div className="relative">
        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <select
          className="pl-10 pr-10 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-red-500 appearance-none outline-none text-slate-900 font-bold text-sm uppercase tracking-wider cursor-pointer"
          onChange={(e) => onFilterGen(e.target.value)}
        >
          <option value="">Semua Gen</option>
          {GENERATIONS.map(g => (
            <option key={g.id} value={g.id}>{g.label}</option>
          ))}
        </select>
        <SlidersHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      <div className="relative">
        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <select
          className="pl-10 pr-10 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm focus:ring-2 focus:ring-red-500 appearance-none outline-none text-slate-900 font-bold text-sm uppercase tracking-wider cursor-pointer"
          onChange={(e) => onFilterType(e.target.value)}
        >
          <option value="">Semua Tipe</option>
          {ALL_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <SlidersHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
