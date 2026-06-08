import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { fetchAllPokemonNames } from "../services/pokeApi";
import { PokemonBasic } from "../types";
import PokemonCard from "./PokemonCard";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  onSelect: (id: number) => void;
  searchQuery: string;
  typeFilter: string[];
  genFilter: string;
  sortFilter: string;
  favoritesOnly?: boolean;
  favorites?: number[];
  onToggleFavorite?: (id: number) => void;
}

interface PokemonMetadata {
  id: number;
  name: string;
  bst: number;
  types: string[];
  species_id: number;
  generation_id: number;
}

export default function PokemonGrid({ onSelect, searchQuery, typeFilter, genFilter, sortFilter, favoritesOnly, favorites, onToggleFavorite }: Props) {
  const [allMetadata, setAllMetadata] = useState<PokemonMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Initial load: Fetch all metadata once!
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const data = await fetchAllPokemonNames();
        if (mounted) {
          setAllMetadata(data as PokemonMetadata[]);
        }
      } catch (e) {
        console.error("Error fetching all metadata", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // Filter and sort in memory seamlessly
  const filteredMetadata = useMemo(() => {
    let result = [...allMetadata];

    if (favoritesOnly && favorites) {
      result = result.filter(p => favorites.includes(p.id));
    }

    result = result.filter(p => {
      let match = true;

      // Filter by generation
      if (genFilter) {
        match = match && (p.generation_id.toString() === genFilter);
      }

      // Filter by type (must have all selected types)
      if (typeFilter.length > 0) {
        const hasAllTypes = typeFilter.every(t => p.types.includes(t));
        match = match && hasAllTypes;
      }

      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const isMatchName = p.name.toLowerCase().includes(searchLower);
        const isMatchId = p.id.toString() === searchQuery || 
                          p.id.toString().padStart(3, '0') === searchQuery || 
                          p.id.toString().padStart(4, '0') === searchQuery ||
                          p.species_id.toString() === searchQuery ||
                          p.species_id.toString().padStart(3, '0') === searchQuery;
        match = match && (isMatchName || isMatchId);
      }

      return match;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortFilter) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "bst_desc":
          return b.bst - a.bst || a.id - b.id; // secondary sort by id
        case "bst_asc":
          return a.bst - b.bst || a.id - b.id;
        case "id_asc":
        default:
          return a.id - b.id;
      }
    });

    return result;
  }, [allMetadata, searchQuery, typeFilter, genFilter, sortFilter, favoritesOnly, favorites]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, genFilter, sortFilter, favoritesOnly]);

  // Derive the displayed pokemon!
  const displayedItems = useMemo(() => {
    return filteredMetadata.slice(0, page * limit).map(p => ({
      id: p.id,
      name: p.name,
      types: p.types,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
      fallbackImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.species_id}.png`,
      spriteImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
    } as PokemonBasic));
  }, [filteredMetadata, page, limit]);

  const hasMore = displayedItems.length < filteredMetadata.length;

  const loadMore = useCallback(() => {
    if (hasMore) setPage(p => p + 1);
  }, [hasMore]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const isCardLarge = (index: number) => {
    return index % 14 === 0 || index % 14 === 7;
  };

  return (
    <div className="w-full min-h-[400px]">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 grid-flow-dense"
      >
        {displayedItems.map((p, index) => (
          <motion.div key={p.id} variants={item} className={isCardLarge(index) ? "md:col-span-2 md:row-span-2" : ""}>
            <PokemonCard 
              pokemon={p} 
              onClick={onSelect} 
              isLarge={isCardLarge(index)} 
              isFavorite={favorites?.includes(p.id)}
              onToggleFavorite={onToggleFavorite}
            />
          </motion.div>
        ))}
      </motion.div>
      
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-red-500" />
        </div>
      )}
      
      {!loading && hasMore && (
        <div ref={lastElementRef} className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-4 border-white/10 border-t-white animate-spin"></div>
        </div>
      )}

      {displayedItems.length === 0 && !loading && (
        <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-3xl border border-dashed border-white/20">
          <p className="text-slate-400 font-bold uppercase tracking-widest">Tidak ada Pokemon yang cocok</p>
        </div>
      )}
    </div>
  );
}
