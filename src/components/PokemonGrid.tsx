import { useEffect, useState, useRef, useCallback } from "react";
import { fetchPokemonList, fetchAllPokemonNames, fetchPokemonByList, fetchPokemonByTypes } from "../services/pokeApi";
import { PokemonBasic } from "../types";
import PokemonCard from "./PokemonCard";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  onSelect: (id: number) => void;
  searchQuery: string;
  typeFilter: string[];
  genFilter: string;
}

const getGenRange = (gen: string): [number, number] | null => {
  switch(gen) {
    case "1": return [1, 151];
    case "2": return [152, 251];
    case "3": return [252, 386];
    case "4": return [387, 493];
    case "5": return [494, 649];
    case "6": return [650, 721];
    case "7": return [722, 809];
    case "8": return [810, 905];
    case "9": return [906, 1025];
    default: return null;
  }
};

export default function PokemonGrid({ onSelect, searchQuery, typeFilter, genFilter }: Props) {
  const [pokemon, setPokemon] = useState<PokemonBasic[]>([]);
  const [allNames, setAllNames] = useState<{ name: string; id: number }[]>([]);
  
  // Search state
  const [filteredNames, setFilteredNames] = useState<{ name: string; id: number }[]>([]);
  const [searchResults, setSearchResults] = useState<PokemonBasic[]>([]);
  const [searchOffset, setSearchOffset] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const loadingRef = useRef(loading);
  const searchingRef = useRef(searching);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    searchingRef.current = searching;
  }, [searching]);

  const limit = 20;

  // Initial load: Paginated list + All names for searching
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const initialList = await fetchPokemonList(limit, 0);
        if (mounted) {
          setPokemon(initialList);
        }
      } catch (e) {
        console.error("Error fetching initial list", e);
      } finally {
        if (mounted) setLoading(false);
      }
      
      // Fetch all names independently so it doesn't block the UI
      try {
        const names = await fetchAllPokemonNames();
        if (mounted) {
          setAllNames(names);
        }
      } catch (e) {
        console.error("Error fetching all names", e);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // Handle Search & Filter logic
  useEffect(() => {
    let mounted = true;
    const handleSearch = async () => {
      setHasMoreSearch(true);
      // If no query and no filter, we just show the standard paginated list
      if (!searchQuery && typeFilter.length === 0 && !genFilter) {
        if (mounted) {
          setFilteredNames([]);
          setSearchResults([]);
          setSearchOffset(0);
          setSearching(false);
        }
        return;
      }

      setSearching(true);
      try {
        const genRange = genFilter ? getGenRange(genFilter) : null;
        
        let baseList = allNames;
        if (typeFilter.length > 0) {
          baseList = await fetchPokemonByTypes(typeFilter);
        }
        
        // Filter from the list of names
        let filtered = baseList.filter(p => {
          let match = true;
          
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const isMatchName = p.name.toLowerCase().includes(searchLower);
            const isMatchId = p.id.toString() === searchQuery || 
                              p.id.toString().padStart(3, '0') === searchQuery || 
                              p.id.toString().padStart(4, '0') === searchQuery;
            match = match && (isMatchName || isMatchId);
          }
          
          if (genRange) {
            match = match && (p.id >= genRange[0] && p.id <= genRange[1]);
          }

          return match;
        });

        if (mounted) {
          setFilteredNames(filtered);
          setSearchOffset(limit);
        }

        // Limit results to top 'limit' for performance on initial search
        const topMatches = filtered.slice(0, limit);
        
        // Fetch basic details (images/types) for the matches
        const details = await fetchPokemonByList(topMatches);

        if (mounted) setSearchResults(details);
      } catch (e) {
        console.error("Search error", e);
      } finally {
        if (mounted) setSearching(false);
      }
    };

    // Debounce search to save API calls
    const timer = setTimeout(handleSearch, 500);
    return () => {
      clearTimeout(timer);
      mounted = false;
    };
  }, [searchQuery, typeFilter, genFilter, allNames]);

  const loadMore = async () => {
    if (loading || searching) return;
    
    setLoading(true);
    try {
      const isInSearchMode = searchQuery || typeFilter.length > 0 || genFilter;
      
      if (isInSearchMode) {
        // Load more search results
        const nextBatchNames = filteredNames.slice(searchOffset, searchOffset + limit);
        if (nextBatchNames.length > 0) {
          const details = await fetchPokemonByList(nextBatchNames);
          if (details.length === 0) setHasMoreSearch(false);
          setSearchResults(prev => [...prev, ...details]);
          setSearchOffset(prev => prev + limit);
        } else {
          setHasMoreSearch(false);
        }
      } else {
        // Load more normal list
        const nextOffset = pokemon.length;
        const newList = await fetchPokemonList(limit, nextOffset);
        if (newList.length === 0) setHasMoreNormal(false);
        setPokemon(prev => [...prev, ...newList]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isInSearchMode = searchQuery || typeFilter.length > 0 || genFilter;
  const currentDisplay = isInSearchMode ? searchResults : pokemon;
  
  const [hasMoreSearch, setHasMoreSearch] = useState(true);
  const [hasMoreNormal, setHasMoreNormal] = useState(true);

  const hasMore = isInSearchMode ? (searchOffset < filteredNames.length && hasMoreSearch) : (pokemon.length < 1025 && hasMoreNormal);

  const observer = useRef<IntersectionObserver | null>(null);
  
  const loadMoreRef = useRef(loadMore);
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (hasMore && !loadingRef.current && !searchingRef.current) {
           loadMoreRef.current();
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [hasMore]);

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
    // Determine which cards get the 2x size for bento grid. 
    return index % 14 === 0 || index % 14 === 7;
  };

  return (
    <div className="w-full">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 grid-flow-dense"
      >
        {currentDisplay.map((p: PokemonBasic, index: number) => (
          <motion.div key={p.id} variants={item} className={isCardLarge(index) ? "md:col-span-2 md:row-span-2" : ""}>
            <PokemonCard 
              pokemon={p} 
              onClick={onSelect} 
              isLarge={isCardLarge(index)} 
            />
          </motion.div>
        ))}
      </motion.div>
      
      {(loading || searching) && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      )}
      
      {!loading && !searching && hasMore && (
        <div ref={lastElementRef} className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-4 border-white/10 border-t-white animate-spin"></div>
        </div>
      )}

      {currentDisplay.length === 0 && !loading && !searching && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest">Tidak ada Pokemon yang cocok</p>
        </div>
      )}
    </div>
  );
}
