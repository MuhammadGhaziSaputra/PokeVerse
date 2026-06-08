export interface PokemonBasic {
  id: number;
  name: string;
  image: string;
  fallbackImage?: string;
  spriteImage?: string;
  types: string[];
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
}

export interface PokemonMove {
  name: string;
  levelLearnedAt?: number;
  method?: string;
}

export interface PokemonDetail extends PokemonBasic {
  stats: PokemonStats;
  height: number;
  weight: number;
  abilities: PokemonAbility[];
  moves?: PokemonMove[];
  description: string;
  cries?: string;
  shinyImage?: string;
  evolutionChain?: { id: number; name: string }[];
}

export interface TeamRecommendation {
  name: string;
  reason: string;
  role: string;
}

export interface MoveRecommendation {
  name: string;
  type: string;
  description: string;
}

export interface BattleAnalysis {
  winner: string;
  explanation: string;
  p1WinConditions: string[];
  p2WinConditions: string[];
}
