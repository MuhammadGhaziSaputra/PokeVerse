import { useState } from "react";
import { updateProfile, User } from "firebase/auth";
import { X, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  user: User;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function ProfileModal({ user, onClose, onUpdate }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(user, {
        displayName
      });
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating profile", error);
      alert("Gagal mengupdate profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Edit Profil</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nama</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                placeholder="Masukkan nama"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : (
              <>
                <Save className="w-5 h-5" />
                Simpan
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
