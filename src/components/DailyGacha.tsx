import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { fetchPokemonDetail } from "../services/pokeApi";
import { PokemonDetail } from "../types";
import { LogIn, Gift, Sparkles, Coins, Gamepad2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

const MYTHICALS = [151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809, 893];
const LEGENDARIES = [144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384, 480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 643, 644, 645, 646, 716, 717, 718, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 888, 889, 890, 891, 892, 894, 895, 896, 897, 898];

const getRarity = (id: number) => {
  if (MYTHICALS.includes(id)) return "MYTHICAL";
  if (LEGENDARIES.includes(id)) return "LEGENDARY";
  return "COMMON";
};

const getRandomPokemonId = () => {
  const roll = Math.random();
  if (roll < 0.05) { // 5% chance
    return MYTHICALS[Math.floor(Math.random() * MYTHICALS.length)];
  } else if (roll < 0.15) { // 10% chance
    return LEGENDARIES[Math.floor(Math.random() * LEGENDARIES.length)];
  } else {
    // Prevent getting mythical/legendary in the common pool just to keep it strict
    let id = Math.floor(Math.random() * 1025) + 1;
    while (MYTHICALS.includes(id) || LEGENDARIES.includes(id)) {
      id = Math.floor(Math.random() * 1025) + 1;
    }
    return id;
  }
};

export default function DailyGacha() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(0);
  const [canPlayTrivia, setCanPlayTrivia] = useState(false);
  const [canPlayTypeTrivia, setCanPlayTypeTrivia] = useState(false);
  const [canPlayStatTrivia, setCanPlayStatTrivia] = useState(false);
  const [gachaStage, setGachaStage] = useState<'idle' | 'fetching' | 'ready' | 'opening'>('idle');
  const [pendingPokemon, setPendingPokemon] = useState<PokemonDetail | null>(null);
  const [caughtPokemonDetail, setCaughtPokemonDetail] = useState<PokemonDetail | null>(null);
  const [collectionList, setCollectionList] = useState<any[]>([]);

  // Trivia 1 States
  const [triviaStage, setTriviaStage] = useState<'idle'|'loading'|'playing'|'won'|'lost'>('idle');
  const [triviaOptions, setTriviaOptions] = useState<any[]>([]);
  const [triviaAnswer, setTriviaAnswer] = useState<any>(null);

  // Trivia 2 States (Tebak Tipe)
  const [typeTriviaStage, setTypeTriviaStage] = useState<'idle'|'loading'|'playing'|'won'|'lost'>('idle');
  const [typeTriviaOptions, setTypeTriviaOptions] = useState<string[]>([]);
  const [typeTriviaAnswer, setTypeTriviaAnswer] = useState<any>(null);

  // Trivia 3 States (Tebak Prioritas Stat/Highest Stat)
  const [statTriviaStage, setStatTriviaStage] = useState<'idle'|'loading'|'playing'|'won'|'lost'>('idle');
  const [statTriviaOptions, setStatTriviaOptions] = useState<string[]>(['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']);
  const [statTriviaAnswer, setStatTriviaAnswer] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        checkUserData(u.uid);
        loadCollection(u.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkUserData = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      const today = new Date().toISOString().split('T')[0];

      let currentTokens = 0;
      let hasTriviaToday = false;
      let hasTypeTriviaToday = false;
      let hasStatTriviaToday = false;

      if (userDoc.exists()) {
        const data = userDoc.data();
        currentTokens = data.tokens || 0;
        
        // Process Daily Login
        if (data.lastLoginDate !== today) {
          currentTokens += 1; // give daily login token
          await setDoc(userRef, { lastLoginDate: today, tokens: currentTokens }, { merge: true });
        }

        if (data.lastTriviaDate === today) hasTriviaToday = true;
        if (data.lastTypeTriviaDate === today) hasTypeTriviaToday = true;
        if (data.lastStatTriviaDate === today) hasStatTriviaToday = true;
      } else {
        // New User today
        currentTokens = 1;
        await setDoc(userRef, { lastLoginDate: today, tokens: currentTokens }, { merge: true });
      }

      setTokens(currentTokens);
      setCanPlayTrivia(!hasTriviaToday);
      setCanPlayTypeTrivia(!hasTypeTriviaToday);
      setCanPlayStatTrivia(!hasStatTriviaToday);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCollection = async (uid: string) => {
    try {
      const collRef = collection(db, "users", uid, "caughtPokemon");
      const collDocs = await getDocs(collRef);
      const items = collDocs.docs.map(doc => doc.data());
      // Sort by id
      items.sort((a, b) => a.id - b.id);
      setCollectionList(items);
    } catch (e) {
      console.error(e);
    }
  };

  const resetMissionsForDemo = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { 
        lastTriviaDate: null,
        lastTypeTriviaDate: null,
        lastStatTriviaDate: null
      }, { merge: true });
      
      setCanPlayTrivia(true);
      setCanPlayTypeTrivia(true);
      setCanPlayStatTrivia(true);
      alert("Misi berhasil di-reset untuk demo!");
    } catch (e) {
      console.error(e);
      alert("Gagal mereset misi: " + (e as Error).message);
    }
  };

  const handleCatch = async () => {
    if (!user || gachaStage !== 'idle' || tokens <= 0) return;
    setGachaStage('fetching');
    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
      const randomId = getRandomPokemonId();
      const pokemonReq = fetchPokemonDetail(randomId);
      
      const [, pokemon] = await Promise.all([minDelay, pokemonReq]);
      const rarity = getRarity(pokemon.id);
      
      const basicData = {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.image,
        types: pokemon.types,
        rarity,
        caughtAt: new Date().toISOString()
      };

      // Save to Firebase
      const pokemonRef = doc(db, "users", user.uid, "caughtPokemon", pokemon.id.toString());
      await setDoc(pokemonRef, basicData, { merge: true });

      const newTokens = tokens - 1;
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { tokens: newTokens }, { merge: true });
      setTokens(newTokens);

      setPendingPokemon(pokemon);
      setGachaStage('ready');
      
      // Update collection list locally
      setCollectionList(prev => {
        const alreadyHas = prev.some(p => p.id === pokemon.id);
        if (alreadyHas) return prev;
        const newList = [...prev, basicData];
        return newList.sort((a, b) => a.id - b.id);
      });

    } catch (e) {
      console.error("Gacha error", e);
      alert("Terjadi kesalahan saat memancing Pokemon.");
      setGachaStage('idle');
    }
  };

  const handleOpenPokeball = () => {
    setGachaStage('opening');
    setTimeout(() => {
        if (pendingPokemon?.cries) {
          const audio = new Audio(pendingPokemon.cries);
          audio.volume = 0.5;
          audio.play().catch(e => console.error("Error playing cry", e));
        }
        setCaughtPokemonDetail(pendingPokemon);
        setGachaStage('idle');
        setPendingPokemon(null);
    }, 1500);
  };

  const startTrivia = async () => {
    setTriviaStage('loading');
    try {
      // get 4 random Pokemon
      const randomIds: number[] = [];
      while(randomIds.length < 4) {
        const id = Math.floor(Math.random() * 1025) + 1;
        if(!randomIds.includes(id)) {
            randomIds.push(id);
        }
      }
      
      const reqs = randomIds.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json()));
      const responses = await Promise.all(reqs);
      
      const formattedOptions = responses.map(d => ({
        id: d.id,
        name: d.name,
        image: d.sprites?.other?.["official-artwork"]?.front_default || ""
      })).filter(o => o.image !== "");

      if (formattedOptions.length < 4) {
         setTriviaStage('idle');
         return;
      }
      
      const answerIdx = Math.floor(Math.random() * 4);
      setTriviaOptions(formattedOptions);
      setTriviaAnswer(formattedOptions[answerIdx]);
      setTriviaStage('playing');
    } catch (e) {
      console.error(e);
      setTriviaStage('idle');
    }
  };

  const handleAnswer = async (id: number) => {
    if (!user) return;
    const isCorrect = id === triviaAnswer.id;
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, "users", user.uid);

    if (isCorrect) {
      setTriviaStage('won');
      const newTokens = tokens + 1;
      setTokens(newTokens);
      await setDoc(userRef, { tokens: newTokens, lastTriviaDate: today }, { merge: true });
    } else {
      setTriviaStage('lost');
      await setDoc(userRef, { lastTriviaDate: today }, { merge: true });
    }
    setCanPlayTrivia(false);
  };

  const startTypeTrivia = async () => {
    setTypeTriviaStage('loading');
    try {
      const id = Math.floor(Math.random() * 1025) + 1;
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();
      
      const realType = data.types[0].type.name;
      const allTypes = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
      
      const options = [realType];
      while(options.length < 4) {
        const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
        if (!options.includes(randomType)) options.push(randomType);
      }
      options.sort(() => Math.random() - 0.5);
      
      setTypeTriviaOptions(options);
      setTypeTriviaAnswer({
        image: data.sprites?.other?.["official-artwork"]?.front_default,
        name: data.name,
        type: realType
      });
      setTypeTriviaStage('playing');
    } catch (e) {
      setTypeTriviaStage('idle');
    }
  };

  const handleTypeAnswer = async (selectedType: string) => {
    if (!user) return;
    const isCorrect = selectedType === typeTriviaAnswer.type;
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, "users", user.uid);

    if (isCorrect) {
      setTypeTriviaStage('won');
      const newTokens = tokens + 1;
      setTokens(newTokens);
      await setDoc(userRef, { tokens: newTokens, lastTypeTriviaDate: today }, { merge: true });
    } else {
      setTypeTriviaStage('lost');
      await setDoc(userRef, { lastTypeTriviaDate: today }, { merge: true });
    }
    setCanPlayTypeTrivia(false);
  };

  const startStatTrivia = async () => {
    setStatTriviaStage('loading');
    try {
      const id = Math.floor(Math.random() * 1025) + 1;
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await res.json();
      
      let highestValue = -1;
      let highestStat = "";
      
      data.stats.forEach((s: any) => {
         if (s.base_stat > highestValue) {
            highestValue = s.base_stat;
            highestStat = s.stat.name;
         }
      });
      
      setStatTriviaOptions(['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']);
      setStatTriviaAnswer({
        image: data.sprites?.other?.["official-artwork"]?.front_default,
        name: data.name,
        highestStat: highestStat
      });
      setStatTriviaStage('playing');
    } catch (e) {
      setStatTriviaStage('idle');
    }
  };

  const handleStatAnswer = async (selectedStat: string) => {
    if (!user) return;
    const isCorrect = selectedStat === statTriviaAnswer.highestStat;
    const today = new Date().toISOString().split('T')[0];
    const userRef = doc(db, "users", user.uid);

    if (isCorrect) {
      setStatTriviaStage('won');
      const newTokens = tokens + 1;
      setTokens(newTokens);
      await setDoc(userRef, { tokens: newTokens, lastStatTriviaDate: today }, { merge: true });
    } else {
      setStatTriviaStage('lost');
      await setDoc(userRef, { lastStatTriviaDate: today }, { merge: true });
    }
    setCanPlayStatTrivia(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-500 font-medium">Memuat data...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <LogIn className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Masuk untuk Menangkap!</h2>
        <p className="text-slate-500 max-w-sm mb-6">Kamu perlu login untuk menyimpan Pokemon hasil tangkapan harianmu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Info */}
      <div className="flex justify-end mb-4">
        <div className="bg-[#131b2f] px-4 py-2 rounded-full font-bold text-white shadow-sm border border-white/10 flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500" />
          <span>{tokens} Token Gacha</span>
        </div>
      </div>

      {/* Gacha Section */}
      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-red-600/10 rotate-3 scale-110 -translate-x-1/4 rounded-[100px]" />
        
        <div className="relative flex justify-between items-center z-10 flex-col md:flex-row gap-6 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3 uppercase tracking-tight mb-2">
              <Gift className="w-8 h-8 text-red-500" />
              Tangkap Harian
            </h2>
            <p className="text-slate-400 max-w-md font-medium">Gunakan 1 Token untuk menangkap Pokemon acak! Kamu mendapatkan 1 Token gratis setiap hari dari login.</p>
          </div>
          
          <div className="flex flex-col items-center">
            {tokens > 0 ? (
              <button
                onClick={handleCatch}
                disabled={gachaStage !== 'idle'}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 disabled:scale-95 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {gachaStage !== 'idle' ? "Memancing..." : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Tangkap (1 Token)
                  </>
                )}
              </button>
            ) : (
              <div className="bg-white/5 text-slate-400 px-6 py-4 rounded-xl font-bold border border-white/10 flex flex-col items-center">
                <span>Token Habis</span>
                <span className="text-xs mt-1 opacity-80">Selesaikan misi untuk tambahan token!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trivia Mission Section */}
      {canPlayTrivia && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-indigo-400/30">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-8 h-8 text-indigo-200" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Misi Harian: Who's That Pokemon?</h2>
            </div>
            
            {triviaStage === 'idle' && (
               <div>
                  <p className="mb-6 text-indigo-100 font-medium">Tebak siluet Pokemon ini dengan benar untuk mendapatkan 1 Token Gacha tambahan!</p>
                  <button 
                    onClick={startTrivia}
                    className="bg-white text-indigo-900 hover:bg-white/90 border border-white/20 px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg shadow-black/10 active:scale-95"
                  >
                    Mulai Main
                  </button>
               </div>
            )}

            {triviaStage === 'loading' && (
               <div className="flex items-center gap-3 py-6">
                 <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                 <span className="font-bold animate-pulse">Menyiapkan Misi...</span>
               </div>
            )}

            {triviaStage === 'playing' && triviaAnswer && (
               <div className="flex flex-col md:flex-row gap-8 items-center bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
                  <div className="w-48 h-48 bg-white/20 rounded-full flex flex-col items-center justify-center p-4 drop-shadow-xl relative overflow-hidden">
                     <img 
                       src={triviaAnswer.image} 
                       alt="Mystery Pokemon" 
                       className="w-full h-full object-contain filter brightness-0 invert pointer-events-none drop-shadow-md select-none" 
                     />
                  </div>
                  <div className="flex-1 w-full">
                     <h3 className="text-xl font-bold mb-4 text-center md:text-left">Pilih Jawaban yang Benar:</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {triviaOptions.map(opt => (
                          <button 
                            key={opt.id}
                            onClick={() => handleAnswer(opt.id)}
                            className="bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white text-white px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all active:scale-95 text-sm"
                          >
                            {opt.name}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Trivia result */}
      <AnimatePresence>
         {triviaStage === 'won' && (
            <motion.div 
               initial={{opacity: 0, height: 0}} 
               animate={{opacity: 1, height: 'auto'}} 
               className="bg-green-100 border border-green-200 p-6 rounded-2xl flex items-center gap-4 text-green-800 font-bold"
            >
               <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
               <div>
                  <p className="text-lg">Tebakanmu Benar!</p>
                  <p className="text-sm font-medium opacity-80">Kamu mendapatkan 1 Token Gacha. Silahkan memancing.</p>
               </div>
            </motion.div>
         )}
         {triviaStage === 'lost' && (
            <motion.div 
               initial={{opacity: 0, height: 0}} 
               animate={{opacity: 1, height: 'auto'}} 
               className="bg-red-100 border border-red-200 p-6 rounded-2xl flex items-center gap-4 text-red-800 font-bold"
            >
               <XCircle className="w-8 h-8 text-red-500 shrink-0" />
               <div>
                  <p className="text-lg">Tebakanmu Salah!</p>
                  <p className="text-sm font-medium opacity-80">Sayang sekali, coba lagi besok ya.</p>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Type Trivia Mission */}
      {canPlayTypeTrivia && (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-emerald-400/30 mt-6">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-8 h-8 text-emerald-200" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Misi Harian: Tebak Tipe Pokemon</h2>
            </div>
            
            {typeTriviaStage === 'idle' && (
               <div>
                  <p className="mb-6 text-emerald-100 font-medium">Tebak tipe dari Pokemon di bawah ini untuk mendapatkan 1 Token Gacha lagi!</p>
                  <button 
                    onClick={startTypeTrivia}
                    className="bg-white text-emerald-900 hover:bg-white/90 border border-white/20 px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg shadow-black/10 active:scale-95"
                  >
                    Mulai Main
                  </button>
               </div>
            )}

            {typeTriviaStage === 'loading' && (
               <div className="flex items-center gap-3 py-6">
                 <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                 <span className="font-bold animate-pulse">Menyiapkan Misi...</span>
               </div>
            )}

            {typeTriviaStage === 'playing' && typeTriviaAnswer && (
               <div className="flex flex-col md:flex-row gap-8 items-center bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
                  <div className="w-48 h-48 bg-white/20 rounded-xl flex flex-col items-center justify-center p-4 drop-shadow-xl relative overflow-hidden">
                     <img 
                       src={typeTriviaAnswer.image} 
                       alt="Pokemon" 
                       className="w-full h-full object-contain drop-shadow-md select-none" 
                     />
                  </div>
                  <div className="flex-1 w-full">
                     <h3 className="text-xl font-bold mb-4 text-center md:text-left">Apa tipe {typeTriviaAnswer.name}?</h3>
                     <div className="grid grid-cols-2 gap-3">
                        {typeTriviaOptions.map((opt: string) => (
                          <button 
                            key={opt}
                            onClick={() => handleTypeAnswer(opt)}
                            className="bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white text-white flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all active:scale-95 text-sm"
                          >
                            <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${opt}.svg`} className="w-4 h-4 invert" alt={opt}/>
                            {opt}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Type Trivia result */}
      <AnimatePresence>
         {typeTriviaStage === 'won' && (
            <motion.div 
               initial={{opacity: 0, height: 0}} 
               animate={{opacity: 1, height: 'auto'}} 
               className="bg-green-100 border border-green-200 p-6 rounded-2xl flex items-center gap-4 text-green-800 font-bold mt-4"
            >
               <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
               <div>
                  <p className="text-lg">Tebakan Tipe Benar!</p>
                  <p className="text-sm font-medium opacity-80">Kamu mendapatkan 1 Token Gacha. Silahkan memancing.</p>
               </div>
            </motion.div>
         )}
         {typeTriviaStage === 'lost' && (
            <motion.div 
               initial={{opacity: 0, height: 0}} 
               animate={{opacity: 1, height: 'auto'}} 
               className="bg-red-100 border border-red-200 p-6 rounded-2xl flex items-center gap-4 text-red-800 font-bold mt-4"
            >
               <XCircle className="w-8 h-8 text-red-500 shrink-0" />
               <div>
                  <p className="text-lg">Tebakan Tipe Salah!</p>
                  <p className="text-sm font-medium opacity-80">Sayang sekali, coba lagi besok ya.</p>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Stat Trivia Mission */}
      {canPlayStatTrivia && (
        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-rose-400/30 mt-6">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-8 h-8 text-rose-200" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Misi Harian: Tebak Stat Tertinggi</h2>
            </div>
            
            {statTriviaStage === 'idle' && (
               <div>
                  <p className="mb-6 text-rose-100 font-medium">Tebak Base Stat apa yang paling tinggi dari Pokemon ini untuk mendapatkan 1 Token Gacha lagi!</p>
                  <button 
                    onClick={startStatTrivia}
                    className="bg-white text-rose-900 hover:bg-white/90 border border-white/20 px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg shadow-black/10 active:scale-95"
                  >
                    Mulai Main
                  </button>
               </div>
            )}

            {statTriviaStage === 'loading' && (
               <div className="flex items-center gap-3 py-6">
                 <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                 <span className="font-bold animate-pulse">Menyiapkan Misi...</span>
               </div>
            )}

            {statTriviaStage === 'playing' && statTriviaAnswer && (
               <div className="flex flex-col md:flex-row gap-8 items-center bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20">
                  <div className="w-48 h-48 bg-white/20 rounded-xl flex flex-col items-center justify-center p-4 drop-shadow-xl relative overflow-hidden">
                     <img 
                       src={statTriviaAnswer.image} 
                       alt="Pokemon" 
                       className="w-full h-full object-contain drop-shadow-md select-none" 
                     />
                  </div>
                  <div className="flex-1 w-full">
                     <h3 className="text-xl font-bold mb-4 text-center md:text-left">Apa Stat tertinggi dari {statTriviaAnswer.name}?</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {statTriviaOptions.map((opt: string) => (
                          <button 
                            key={opt}
                            onClick={() => handleStatAnswer(opt)}
                            className="bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white text-white px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all active:scale-95 text-xs"
                          >
                            {opt}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Stat Trivia result */}
      <AnimatePresence>
         {statTriviaStage === 'won' && (
            <motion.div 
               initial={{opacity: 0, height: 0}} 
               animate={{opacity: 1, height: 'auto'}} 
               className="bg-green-100 border border-green-200 p-6 rounded-2xl flex items-center gap-4 text-green-800 font-bold mt-4"
            >
               <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
               <div>
                  <p className="text-lg">Tebakan Stat Benar!</p>
                  <p className="text-sm font-medium opacity-80">Kamu mendapatkan 1 Token Gacha. Silahkan memancing.</p>
               </div>
            </motion.div>
         )}
         {statTriviaStage === 'lost' && (
            <motion.div 
               initial={{opacity: 0, height: 0}} 
               animate={{opacity: 1, height: 'auto'}} 
               className="bg-red-100 border border-red-200 p-6 rounded-2xl flex items-center gap-4 text-red-800 font-bold mt-4"
            >
               <XCircle className="w-8 h-8 text-red-500 shrink-0" />
               <div>
                  <p className="text-lg">Tebakan Stat Salah!</p>
                  <p className="text-sm font-medium opacity-80">Sayang sekali, coba lagi besok ya.</p>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Caught Pokemon Result */}
      <AnimatePresence>
        {gachaStage !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
              {gachaStage === 'fetching' && (
                <div className="flex flex-col items-center">
                  <motion.img 
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                    alt="Pokeball"
                    className="w-32 h-32"
                    style={{ imageRendering: 'pixelated' }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  />
                  <p className="text-white font-bold text-xl mt-4 animate-pulse">Sedang memancing...</p>
                </div>
              )}

              {gachaStage === 'ready' && (
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ 
                      rotate: [0, -15, 15, -15, 15, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      repeatDelay: 1,
                      duration: 0.8
                    }}
                    onClick={handleOpenPokeball}
                    className="cursor-pointer"
                  >
                    <img 
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                      alt="Pokeball"
                      className="w-48 h-48 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </motion.div>
                  <p className="text-white font-bold text-2xl mt-8 animate-bounce">Tertangkap! Tap untuk membuka!</p>
                </div>
              )}

              {gachaStage === 'opening' && (
                <div className="flex flex-col items-center relative">
                  <motion.div
                    initial={{ scale: 1, filter: "brightness(1) blur(0px)" }}
                    animate={{ scale: 2, opacity: 0, filter: "brightness(2) blur(10px)" }}
                    transition={{ duration: 1.5, ease: "easeIn" }}
                  >
                    <img 
                      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" 
                      alt="Pokeball"
                      className="w-48 h-48"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </motion.div>
                  <motion.div 
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{ opacity: 1, scale: 5 }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="absolute inset-0 bg-white rounded-full z-10"
                     style={{ mixBlendMode: "overlay" }}
                  />
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {caughtPokemonDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className={`rounded-3xl border-4 p-8 text-center relative overflow-hidden max-w-sm w-full mx-auto shadow-2xl ${
                getRarity(caughtPokemonDetail.id) === 'MYTHICAL' ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-black border-fuchsia-500 shadow-[0_0_40px_rgba(217,70,239,0.5)]' :
                getRarity(caughtPokemonDetail.id) === 'LEGENDARY' ? 'bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-yellow-600 to-amber-800 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.5)]' :
                'bg-blue-900 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]'
              }`}
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
              
              {(getRarity(caughtPokemonDetail.id) === 'MYTHICAL' || getRarity(caughtPokemonDetail.id) === 'LEGENDARY') && (
                 <>
                   <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                      className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.2)_360deg)] z-0"
                   />
                   <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.5] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                      className="absolute inset-0 border-4 border-white/30 rounded-3xl z-0"
                   />
                   <motion.div
                      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:200%_100%] z-10 pointer-events-none"
                      style={{ mixBlendMode: 'overlay' }}
                   />
                 </>
              )}

              <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight relative z-10 ${
                getRarity(caughtPokemonDetail.id) === 'MYTHICAL' ? 'text-purple-300' :
                getRarity(caughtPokemonDetail.id) === 'LEGENDARY' ? 'text-amber-300' :
                'text-blue-300'
              }`}>
                Pokemon Ditangkap!
              </h3>
              <p className={`text-sm font-bold uppercase tracking-widest relative z-10 mb-6 ${
                getRarity(caughtPokemonDetail.id) === 'MYTHICAL' ? 'text-purple-400' :
                getRarity(caughtPokemonDetail.id) === 'LEGENDARY' ? 'text-amber-400' :
                'text-blue-400'
              }`}>
                {getRarity(caughtPokemonDetail.id)} TIER
              </p>
              
              <motion.div 
                 initial={{ rotate: -180, scale: 0 }}
                 animate={{ rotate: 0, scale: 1 }}
                 transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                 className={`w-48 h-48 mx-auto mb-6 relative z-10 drop-shadow-2xl flex items-center justify-center rounded-full bg-white/10 border-4 border-white/20`}
              >
                <motion.img 
                  src={caughtPokemonDetail.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${caughtPokemonDetail.id}.png`} 
                  alt={caughtPokemonDetail.name}
                  className="w-3/4 h-3/4 object-contain relative z-20" 
                  animate={
                    (getRarity(caughtPokemonDetail.id) === 'MYTHICAL' || getRarity(caughtPokemonDetail.id) === 'LEGENDARY') 
                    ? { y: [0, -10, 0], filter: ["drop-shadow(0 0 10px rgba(255,255,255,0.5))", "drop-shadow(0 0 25px rgba(255,255,255,0.9))", "drop-shadow(0 0 10px rgba(255,255,255,0.5))"] }
                    : {}
                  }
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              </motion.div>

              <h4 className={`text-4xl font-black capitalize mb-2 relative z-10 !font-heading ${
                getRarity(caughtPokemonDetail.id) === 'MYTHICAL' ? 'text-purple-100' :
                getRarity(caughtPokemonDetail.id) === 'LEGENDARY' ? 'text-amber-100' :
                'text-white'
              }`}>
                {caughtPokemonDetail.name}
              </h4>
              <div className="flex justify-center gap-2 relative z-10">
                {caughtPokemonDetail.types.map((type: string) => (
                  <span key={type} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase backdrop-blur-md border ${
                    getRarity(caughtPokemonDetail.id) === 'MYTHICAL' ? 'bg-purple-900/50 text-purple-200 border-purple-500/50' :
                    getRarity(caughtPokemonDetail.id) === 'LEGENDARY' ? 'bg-amber-900/50 text-amber-200 border-amber-500/50' :
                    'bg-blue-900/50 text-blue-200 border-blue-500/50'
                  }`}>
                    <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`} alt={type} className="w-3.5 h-3.5 opacity-80 invert contrast-200 brightness-200" />
                    {type}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => setCaughtPokemonDetail(null)}
                className="mt-8 px-6 py-2 bg-black/30 hover:bg-black/50 border border-white/20 text-white rounded-lg font-bold transition-colors relative z-10 w-full"
              >
                Simpan ke Koleksi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collection Gallery */}
      <div>
        <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Koleksi Saya ({collectionList.length})</h3>
        
        {collectionList.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl text-slate-400 font-medium">
            Belum ada Pokemon di koleksimu. Tangkap sekarang!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {collectionList.map((pokemon) => (
              <div 
                key={pokemon.id} 
                className={`rounded-2xl border-2 p-4 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden ${
                  getRarity(pokemon.id) === 'MYTHICAL' ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-black border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]' :
                  getRarity(pokemon.id) === 'LEGENDARY' ? 'bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-yellow-300 via-yellow-600 to-amber-800 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' :
                  'bg-[linear-gradient(to_bottom_right,_var(--tw-gradient-stops))] from-slate-500 via-slate-700 to-slate-900 border-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.3)]'
                }`}
                onClick={() => {
                  const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`;
                  const audio = new Audio(cryUrl);
                  audio.volume = 0.5;
                  audio.play().catch(e => console.error("Error playing cry", e));
                }}
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                <span className={`text-[10px] font-black self-start mb-2 relative z-10 ${
                  getRarity(pokemon.id) === 'MYTHICAL' ? 'text-purple-300' :
                  getRarity(pokemon.id) === 'LEGENDARY' ? 'text-yellow-200' :
                  'text-slate-300'
                }`}>#{String(pokemon.id).padStart(3, '0')}</span>
                <img src={pokemon.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`} alt={pokemon.name} className="w-20 h-20 object-contain mb-3 drop-shadow-md relative z-10" />
                <h4 className={`font-bold capitalize text-sm mb-2 text-center relative z-10 ${
                  getRarity(pokemon.id) === 'MYTHICAL' ? 'text-fuchsia-100' :
                  getRarity(pokemon.id) === 'LEGENDARY' ? 'text-amber-100' :
                  'text-slate-100'
                }`}>{pokemon.name}</h4>
                <div className="flex flex-wrap justify-center gap-1 w-full relative z-10">
                  {pokemon.types.map((type: string) => (
                    <span key={type} className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      getRarity(pokemon.id) === 'MYTHICAL' ? 'bg-purple-900/50 text-fuchsia-200 border border-fuchsia-500/30' :
                      getRarity(pokemon.id) === 'LEGENDARY' ? 'bg-amber-900/50 text-yellow-200 border border-yellow-500/30' :
                      'bg-slate-800/50 text-slate-200 border border-slate-400/30'
                    }`}>
                      <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`} alt={type} className="w-2.5 h-2.5 opacity-50" />
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-8 border-t border-white/10 flex justify-center">
        <button 
          onClick={resetMissionsForDemo}
          className="text-white/30 hover:text-white/60 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Misi (Untuk Demo)
        </button>
      </div>
    </div>
  );
}
