import { useState, FormEvent } from "react";
import { getTeamRecommendation } from "../services/geminiService";
import { TeamRecommendation } from "../types";
import { Sparkles, Loader2, Shield, Sword, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function TeamBuilder() {
  const [preference, setPreference] = useState("");
  const [recommendations, setRecommendations] = useState<TeamRecommendation[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!preference) return;
    setLoading(true);
    setRecommendations(null);
    try {
      const result = await getTeamRecommendation(preference);
      setRecommendations(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/10 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-red-500/20 rounded-2xl mb-4">
          <Sparkles className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Arsitek Tim AI</h2>
        <p className="text-slate-400">Jelaskan gaya bermainmu dan biarkan Gemini membangun tim impianmu</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-12">
        <div className="relative">
          <textarea
            placeholder="Contoh: 'Saya ingin tim yang berfokus pada tipe Api untuk Gen 9', atau 'Saya ingin tim seimbang dengan setidaknya satu tipe Hantu...'"
            className="w-full px-6 py-4 bg-white/5 text-white rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[120px] font-medium placeholder:text-slate-400 resize-none"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !preference}
            className="absolute bottom-4 right-4 bg-red-500 border border-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Bangun Tim"}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-red-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-red-500 font-bold animate-pulse">Gemini sedang menyusun strategi timmu...</p>
          </motion.div>
        )}

        {recommendations && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {recommendations.map((rec, i) => (
              <motion.div
                key={rec.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-red-500/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-black capitalize text-white group-hover:text-red-400 transition-colors">{rec.name}</h3>
                  <div className="px-3 py-1 bg-black/20 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {rec.role}
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  "{rec.reason}"
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && !recommendations && (
        <div className="border-2 border-dashed border-white/10 rounded-3xl py-20 flex flex-col items-center justify-center text-slate-500">
           <HelpCircle className="w-12 h-12 mb-4 opacity-20" />
           <p className="font-bold">Rencana tim akan muncul di sini</p>
        </div>
      )}
    </div>
  );
}
