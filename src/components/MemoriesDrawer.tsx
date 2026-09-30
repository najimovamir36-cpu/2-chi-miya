import React, { useState } from 'react';
import { X, Plus, Search, Edit3, Trash2, Lock, Unlock, Calendar, Radio, Tag, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { MemoryItem } from './ResultCard.tsx';

interface MemoriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onRefresh: () => void;
  onSelectMemoryForSearch: (text: string) => void;
}

export const MemoriesDrawer: React.FC<MemoriesDrawerProps> = ({
  isOpen,
  onClose,
  memories,
  onRefresh,
  onSelectMemoryForSearch,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Ideas');
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formTags, setFormTags] = useState('');

  if (!isOpen) return null;

  const categories = ['all', 'Projects', 'Ideas', 'Knowledge', 'Personal', 'Work', 'Important', 'Private', 'Random thoughts'];

  const filtered = memories.filter((m) => {
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesSearch =
      m.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.content.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (m.tags && m.tags.some((t) => t.toLowerCase().includes(searchFilter.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const handleStartCreate = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('Ideas');
    setFormIsPrivate(false);
    setFormTags('');
    setIsCreating(true);
    setEditingMemory(null);
  };

  const handleStartEdit = (m: MemoryItem) => {
    setEditingMemory(m);
    setFormTitle(m.title);
    setFormContent(m.content.startsWith('🔒') ? '' : m.content);
    setFormCategory(m.category);
    setFormIsPrivate(Boolean(m.isPrivate));
    setFormTags(m.tags ? m.tags.join(', ') : '');
    setIsCreating(false);
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      if (isCreating) {
        // Create
        await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim() || formContent.slice(0, 30),
            content: formContent.trim(),
            category: formCategory,
            isPrivate: formIsPrivate,
            tags: tagsArray,
            source: 'Veb-sayt boshqaruvi',
          }),
        });
      } else if (editingMemory) {
        // Edit
        await fetch(`/api/memories/${editingMemory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
            isPrivate: formIsPrivate,
            tags: tagsArray,
          }),
        });
      }

      setIsCreating(false);
      setEditingMemory(null);
      onRefresh();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham bu xotirani o‘chirib tashlamoqchimisiz?')) return;
    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Barcha xotiralarni dastlabki holatga qaytarishni xohlaysizmi?')) return;
    try {
      await fetch('/api/memories/reset', { method: 'POST' });
      onRefresh();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#090a0f] border-l border-neutral-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-850 bg-neutral-900/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Mening xotiralarim</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                {memories.length} ta
              </span>
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              Egasi uchun to‘liq boshqaruv paneli
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yangi xotira</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create / Edit Form Modal inside Drawer */}
        {(isCreating || editingMemory) && (
          <form
            onSubmit={handleSaveMemory}
            className="p-5 border-b border-neutral-800 bg-[#0e0f17] space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase font-mono">
                {isCreating ? 'Yangi xotira kiritish' : 'Xotirani tahrirlash'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingMemory(null);
                }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Bekor qilish
              </button>
            </div>

            <div>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Sarlavha (ixtiyoriy)"
                className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Xotira matni (masalan: MobiCom logo ranglari qora-qizil bo'lishi kerak...)"
                rows={3}
                required
                className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-neutral-400 font-mono block mb-1">
                  Kategoriya:
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {categories.filter((c) => c !== 'all').map((c) => (
                    <option key={c} value={c} className="bg-neutral-900">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-neutral-400 font-mono block mb-1">
                  Teglar (vergul bilan):
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="mobicom, brend, logo"
                  className="w-full bg-black/60 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={formIsPrivate}
                  onChange={(e) => setFormIsPrivate(e.target.checked)}
                  className="rounded border-neutral-700 text-red-500 focus:ring-0 bg-neutral-900"
                />
                <span className={formIsPrivate ? 'text-red-400 font-bold' : ''}>
                  🔒 Maxfiy xotira (Parol talab qiladi)
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        )}

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-neutral-850 space-y-2.5 bg-neutral-950/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Xotiralar ichidan filtr qilish..."
              className="w-full bg-black/80 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`shrink-0 px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                  categoryFilter === cat
                    ? 'bg-neutral-200 text-black font-bold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat === 'all' ? 'Barchasi' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs font-mono">
              Hech qanday xotira topilmadi.
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className="group p-4 rounded-2xl bg-[#0c0d12] border border-neutral-850 hover:border-neutral-750 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-xs sm:text-sm">
                      {m.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {m.category}
                    </span>
                    {m.isPrivate && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-400 border border-red-900/40 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Maxfiy
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleStartEdit(m)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                      title="O‘chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  {m.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {m.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      {m.source || 'Telegram'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectMemoryForSearch(m.title);
                      onClose();
                    }}
                    className="text-emerald-400 hover:underline"
                  >
                    Miyadan qidirish →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-850 bg-neutral-900/40 flex items-center justify-between text-xs font-mono">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Dastlabki xotiralarni tiklash</span>
          </button>

          <span className="text-neutral-600">2-chi Miya Core</span>
        </div>
      </div>
    </div>
  );
};
