import { useEffect, useState } from "react";
import { fetchPokemonList, fetchAllPokemonNames, fetchPokemonByList, fetchPokemonByType } from "../services/pokeApi";
import { PokemonBasic } from "../types";
import PokemonCard from "./PokemonCard";
import { Loader2 } from "lucide-react";

interface Props {
  onSelect: (id: number) => void;
  searchQuery: string;
  typeFilter: string;
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
      // If no query and no filter, we just show the standard paginated list
      if (!searchQuery && !typeFilter && !genFilter) {
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
        if (typeFilter) {
          baseList = await fetchPokemonByType(typeFilter);
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
      const isInSearchMode = searchQuery || typeFilter || genFilter;
      
      if (isInSearchMode) {
        // Load more search results
        const nextBatchNames = filteredNames.slice(searchOffset, searchOffset + limit);
        if (nextBatchNames.length > 0) {
          const details = await fetchPokemonByList(nextBatchNames);
          setSearchResults(prev => [...prev, ...details]);
          setSearchOffset(prev => prev + limit);
        }
      } else {
        // Load more normal list
        const nextOffset = pokemon.length;
        const newList = await fetchPokemonList(limit, nextOffset);
        setPokemon(prev => [...prev, ...newList]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isInSearchMode = searchQuery || typeFilter || genFilter;
  const currentDisplay = isInSearchMode ? searchResults : pokemon;

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {currentDisplay.map((p: PokemonBasic) => (
          <PokemonCard key={p.id} pokemon={p} onClick={onSelect} />
        ))}
      </div>
      
      {(loading || searching) && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      )}
      
      {!loading && !searching && (!isInSearchMode || searchOffset < filteredNames.length) && (
        <div className="flex justify-center py-10">
          <button
            onClick={loadMore}
            className="bg-red-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-red-600 transition-colors"
            id="load-more-btn"
          >
            Muat Lebih Banyak
          </button>
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
