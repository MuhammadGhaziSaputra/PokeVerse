import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../services/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { fetchPokemonDetail } from "../services/pokeApi";
import { PokemonDetail } from "../types";
import { LogIn, Gift, Sparkles, Coins, Gamepad2, CheckCircle2, XCircle } from "lucide-react";

export default function DailyGacha() {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(0);
  const [canPlayTrivia, setCanPlayTrivia] = useState(false);
  const [catching, setCatching] = useState(false);
  const [caughtPokemonDetail, setCaughtPokemonDetail] = useState<PokemonDetail | null>(null);
  const [collectionList, setCollectionList] = useState<any[]>([]);

  // Trivia States
  const [triviaStage, setTriviaStage] = useState<'idle'|'loading'|'playing'|'won'|'lost'>('idle');
  const [triviaOptions, setTriviaOptions] = useState<any[]>([]);
  const [triviaAnswer, setTriviaAnswer] = useState<any>(null);

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

      if (userDoc.exists()) {
        const data = userDoc.data();
        currentTokens = data.tokens || 0;
        
        // Process Daily Login
        if (data.lastLoginDate !== today) {
          currentTokens += 1; // give daily login token
          await setDoc(userRef, { lastLoginDate: today, tokens: currentTokens }, { merge: true });
        }

        if (data.lastTriviaDate === today) {
          hasTriviaToday = true;
        }
      } else {
        // New User today
        currentTokens = 1;
        await setDoc(userRef, { lastLoginDate: today, tokens: currentTokens }, { merge: true });
      }

      setTokens(currentTokens);
      setCanPlayTrivia(!hasTriviaToday);
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

  const handleCatch = async () => {
    if (!user || catching || tokens <= 0) return;
    setCatching(true);
    
    try {
      // Random Pokemon ID between 1 and 1025
      const randomId = Math.floor(Math.random() * 1025) + 1;
      const pokemon = await fetchPokemonDetail(randomId);
      
      const basicData = {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.image,
        types: pokemon.types,
        caughtAt: new Date().toISOString()
      };

      if (pokemon.cries) {
        const audio = new Audio(pokemon.cries);
        audio.volume = 0.5;
        audio.play().catch(e => console.error("Error playing cry", e));
      }

      // Save to Firebase
      const pokemonRef = doc(db, "users", user.uid, "caughtPokemon", pokemon.id.toString());
      await setDoc(pokemonRef, basicData, { merge: true });

      const newTokens = tokens - 1;
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { tokens: newTokens }, { merge: true });
      setTokens(newTokens);

      setCaughtPokemonDetail(pokemon);
      
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
    } finally {
      setCatching(false);
    }
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
        <div className="bg-white px-4 py-2 rounded-full font-bold text-slate-800 shadow-sm border border-slate-100 flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-500" />
          <span>{tokens} Token Gacha</span>
        </div>
      </div>

      {/* Gacha Section */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-red-600/5 rotate-3 scale-110 -translate-x-1/4 rounded-[100px]" />
        
        <div className="relative flex justify-between items-center z-10 flex-col md:flex-row gap-6 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center justify-center md:justify-start gap-3 uppercase tracking-tight mb-2">
              <Gift className="w-8 h-8 text-red-500" />
              Tangkap Harian
            </h2>
            <p className="text-slate-500 max-w-md font-medium">Gunakan 1 Token untuk menangkap Pokemon acak! Kamu mendapatkan 1 Token gratis setiap hari dari login.</p>
          </div>
          
          <div className="flex flex-col items-center">
            {tokens > 0 ? (
              <button
                onClick={handleCatch}
                disabled={catching}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 disabled:scale-95 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                {catching ? "Memancing..." : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Tangkap (1 Token)
                  </>
                )}
              </button>
            ) : (
              <div className="bg-slate-100 text-slate-500 px-6 py-4 rounded-xl font-bold border border-slate-200 flex flex-col items-center">
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
                    className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-black uppercase tracking-wider transition-all shadow-lg shadow-black/10 active:scale-95"
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
                            className="bg-white/20 hover:bg-white border border-white/30 hover:border-white hover:text-indigo-600 px-4 py-3 rounded-xl font-bold uppercase tracking-wider transition-all active:scale-95 text-sm"
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

      {/* Caught Pokemon Result */}
      <AnimatePresence>
        {caughtPokemonDetail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-amber-50 rounded-3xl border-2 border-amber-200 p-8 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <h3 className="text-2xl font-black text-amber-900 mb-6 uppercase tracking-tight relative z-10">Pokemon Ditangkap!</h3>
            
            <motion.div 
               initial={{ rotate: -180, scale: 0 }}
               animate={{ rotate: 0, scale: 1 }}
               transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
               className="w-48 h-48 mx-auto mb-6 relative z-10 drop-shadow-2xl"
            >
              <img 
                src={caughtPokemonDetail.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${caughtPokemonDetail.id}.png`} 
                alt={caughtPokemonDetail.name}
                className="w-full h-full object-contain" 
              />
            </motion.div>

            <h4 className="text-3xl font-black capitalize text-amber-800 mb-2 relative z-10">
              {caughtPokemonDetail.name}
            </h4>
            <div className="flex justify-center gap-2 relative z-10">
              {caughtPokemonDetail.types.map((type: string) => (
                <span key={type} className="flex items-center gap-1.5 px-3 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold uppercase">
                  <img src={`https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`} alt={type} className="w-3.5 h-3.5 opacity-60 mix-blend-multiply" />
                  {type}
                </span>
              ))}
            </div>

            <button 
              onClick={() => setCaughtPokemonDetail(null)}
              className="mt-8 px-6 py-2 bg-amber-800 text-white rounded-lg font-bold hover:bg-amber-900 transition-colors relative z-10"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collection Gallery */}
      <div>
        <h3 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight">Koleksi Saya ({collectionList.length})</h3>
        
        {collectionList.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-medium">
            Belum ada Pokemon di koleksimu. Tangkap sekarang!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {collectionList.map((pokemon) => (
              <div 
                key={pokemon.id} 
                className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => {
                  const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`;
                  const audio = new Audio(cryUrl);
                  audio.volume = 0.5;
                  audio.play().catch(e => console.error("Error playing cry", e));
                }}
              >
                <span className="text-[10px] font-black text-slate-400 self-start mb-2">#{String(pokemon.id).padStart(3, '0')}</span>
                <img src={pokemon.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`} alt={pokemon.name} className="w-20 h-20 object-contain mb-3 drop-shadow-md" />
                <h4 className="font-bold text-slate-800 capitalize text-sm mb-2 text-center">{pokemon.name}</h4>
                <div className="flex flex-wrap justify-center gap-1 w-full">
                  {pokemon.types.map((type: string) => (
                    <span key={type} className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
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
    </div>
  );
}
