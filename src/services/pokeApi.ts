import { PokemonBasic, PokemonDetail, PokemonStats } from "../types";
import { translateDescription } from "./geminiService";

const BASE_URL = "https://pokeapi.co/api/v2";

export const fetchAllPokemonNames = async (): Promise<{ name: string; id: number }[]> => {
  const response = await fetch(`${BASE_URL}/pokemon?limit=2000`);
  const data = await response.json();
  return data.results.map((p: any) => {
    const segments = p.url.split("/");
    const id = parseInt(segments[segments.length - 2]);
    return { name: p.name, id };
  });
};

export const fetchPokemonByType = async (type: string): Promise<{ name: string; id: number }[]> => {
  const response = await fetch(`${BASE_URL}/type/${type}`);
  const data = await response.json();
  return data.pokemon.map((p: any) => {
    const segments = p.pokemon.url.split("/");
    const id = parseInt(segments[segments.length - 2]);
    return { name: p.pokemon.name, id };
  });
};

export const fetchPokemonByList = async (list: { name: string; id: number }[]): Promise<PokemonBasic[]> => {
  const results: PokemonBasic[] = [];
  
  // Fetch in smaller chunks or sequentially
  const chunkSize = 5;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (p) => {
      try {
        const response = await fetch(`${BASE_URL}/pokemon/${p.id}`);
        if (!response.ok) return null;
        const detailData = await response.json();
        
        return {
          id: detailData.id,
          name: detailData.name,
          image: detailData.sprites?.other?.["official-artwork"]?.front_default || detailData.sprites?.front_default || "",
          types: detailData.types.map((t: any) => t.type.name),
        };
      } catch (e) {
        console.error("Failed to fetch detail for", p.name, e);
        return null;
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...(chunkResults.filter(Boolean) as PokemonBasic[]));
  }
  
  return results;
};

export const fetchPokemonList = async (limit: number = 20, offset: number = 0): Promise<PokemonBasic[]> => {
  try {
    const response = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (!data || !data.results) {
      console.error("Invalid data format from PokeAPI", data);
      return [];
    }

    const results: PokemonBasic[] = [];
    const chunkSize = 15;
    for (let i = 0; i < data.results.length; i += chunkSize) {
      const chunk = data.results.slice(i, i + chunkSize);
      const chunkPromises = chunk.map(async (pokemon: any) => {
        try {
          const detailResponse = await fetch(pokemon.url);
          if (!detailResponse.ok) return null;
          const detailData = await detailResponse.json();
          
          return {
            id: detailData.id,
            name: detailData.name,
            image: detailData.sprites?.other?.["official-artwork"]?.front_default || detailData.sprites?.front_default || "",
            types: detailData.types.map((t: any) => t.type.name),
          };
        } catch (e) {
          console.error("Failed to fetch detail for", pokemon.name, e);
          return null;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...(chunkResults.filter(Boolean) as PokemonBasic[]));
    }
    
    return results;
  } catch(e) {
    console.error("PokeAPI error:", e);
    return [];
  }
};

export const fetchPokemonDetail = async (idOrName: string | number): Promise<PokemonDetail> => {
  const response = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
  const data = await response.json();
  
  const speciesResponse = await fetch(data.species.url);
  const speciesData = await speciesResponse.json();
  const rawDescription = speciesData.flavor_text_entries.find((entry: any) => entry.language.name === "en")?.flavor_text || "No description available.";
  let description = rawDescription.replace(/[\n\f]/g, ' ');
  try {
    description = await translateDescription(description);
  } catch (e) {
    console.error("Gemini context translate error:", e);
  }

  const stats: PokemonStats = {
    hp: data.stats[0].base_stat,
    attack: data.stats[1].base_stat,
    defense: data.stats[2].base_stat,
    specialAttack: data.stats[3].base_stat,
    specialDefense: data.stats[4].base_stat,
    speed: data.stats[5].base_stat,
  };

  const abilities = data.abilities.map((a: any) => a.ability.name);

  const cries = data.cries?.latest || null;
  const shinyImage = data.sprites?.other?.["official-artwork"]?.front_shiny || data.sprites?.front_shiny || null;

  let evolutionChain: {id: number, name: string}[] = [];
  try {
    if (speciesData.evolution_chain?.url) {
      const evoResponse = await fetch(speciesData.evolution_chain.url);
      const evoData = await evoResponse.json();
      
      let currentEvo = evoData.chain;
      while (currentEvo) {
        const urlSegments = currentEvo.species.url.split('/');
        const id = parseInt(urlSegments[urlSegments.length - 2]);
        evolutionChain.push({ id, name: currentEvo.species.name });
        currentEvo = currentEvo.evolves_to[0]; // follow primary path
      }
    }
  } catch(e) {
    console.error("Failed to fetch evolution chain", e);
  }

  return {
    id: data.id,
    name: data.name,
    image: data.sprites?.other?.["official-artwork"]?.front_default || data.sprites?.front_default || "",
    types: data.types.map((t: any) => t.type.name),
    stats,
    height: data.height / 10,
    weight: data.weight / 10,
    abilities,
    description,
    cries,
    shinyImage,
    evolutionChain
  };
};

export const searchPokemon = async (query: string): Promise<PokemonBasic[]> => {
  // PokeAPI doesn't have a partial search, so we usually fetch all names and filter or just try direct hit
  try {
    const detail = await fetchPokemonDetail(query.toLowerCase());
    return [{
      id: detail.id,
      name: detail.name,
      image: detail.image,
      types: detail.types
    }];
  } catch (e) {
    return [];
  }
};
