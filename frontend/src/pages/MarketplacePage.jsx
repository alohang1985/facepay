import { useState, useEffect, useCallback } from 'react';
import { faces as facesApi } from '../services/api';
import FaceCard from '../components/common/FaceCard';

const filterDefs = [
  { key: 'gender', label: 'Gender', options: ['All', 'Male', 'Female'] },
  { key: 'ethnicity', label: 'Ethnicity', options: ['All', 'Korean', 'Asian', 'Caucasian', 'Latino'] },
  { key: 'style', label: 'Style', options: ['All', 'Casual', 'Business', 'Fitness', 'Elegant', 'Street', 'Professional', 'Trendy', 'Studio', 'Glamour', 'Outdoor', 'Mature', 'Lifestyle'] },
];

const sortOptions = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_low', label: 'Price: Low → High' },
  { key: 'price_high', label: 'Price: High → Low' },
  { key: 'name', label: 'Name A-Z' },
];

export default function MarketplacePage() {
  const [allFaces, setAllFaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ gender: 'All', ethnicity: 'All', style: 'All' });
  const [sort, setSort] = useState('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Load faces from API
  const loadFaces = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.gender !== 'All') params.gender = filters.gender;
      if (filters.ethnicity !== 'All') params.ethnicity = filters.ethnicity;
      if (filters.style !== 'All') params.style = filters.style;
      if (search) params.search = search;
      if (priceRange.min) params.min_price = priceRange.min;
      if (priceRange.max) params.max_price = priceRange.max;

      const data = await facesApi.list(params);
      setAllFaces(data.faces || []);
    } catch (e) {
      console.error('Failed to load faces:', e);
    }
    setLoading(false);
  }, [filters, search, priceRange]);

  useEffect(() => { loadFaces(); }, [loadFaces]);

  // Client-side sort
  const sorted = [...allFaces].sort((a, b) => {
    if (sort === 'price_low') return a.price - b.price;
    if (sort === 'price_high') return b.price - a.price;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return 0; // newest = default DB order
  });

  // Trending = top by price (simulated)
  const trending = [...allFaces].sort((a, b) => b.price - a.price).slice(0, 4);

  const updateFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen pt-[64px]">
      {/* Hero Banner */}
      <div className="relative h-[220px] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1920&h=400&fit=crop" alt="" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/60 to-dark" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 w-full">
            <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-2">Marketplace</div>
            <h1 className="text-[40px] font-extrabold tracking-[-1.5px]">Explore Faces</h1>
            <p className="text-white/35 text-[15px] mt-2">Browse {allFaces.length} verified faces for your next project</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        {/* Filters Bar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex gap-2.5 flex-wrap">
            {filterDefs.map((f) => (
              <select key={f.key} value={filters[f.key]} onChange={(e) => updateFilter(f.key, e.target.value)}
                className="h-10 px-4 bg-white/[0.03] border border-white/[0.08] rounded-full text-[12px] text-white/50 outline-none cursor-pointer hover:border-white/15 focus:border-gold/30 transition-colors">
                <option value="All">{f.label}</option>
                {f.options.filter(o => o !== 'All').map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="h-10 px-4 bg-white/[0.03] border border-white/[0.08] rounded-full text-[12px] text-white/50 outline-none cursor-pointer hover:border-white/15 focus:border-gold/30 transition-colors">
              {sortOptions.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 pr-5 w-[260px] bg-white/[0.03] border border-white/[0.08] rounded-full text-[13px] text-text-primary outline-none focus:border-gold/30 transition-colors placeholder:text-white/25"
              placeholder="Search faces..."
            />
            <svg className="absolute left-3.5 top-[11px] w-4 h-4 text-white/25" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>

        {/* Advanced Search Panel */}
        {showAdvanced && (
          <div className="mb-8 p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
            <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-4 font-semibold">Advanced Filters</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] text-white/30 mb-1 block">Min Price ($)</label>
                <input type="number" value={priceRange.min} onChange={(e) => setPriceRange(p => ({...p, min: e.target.value}))}
                  className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white outline-none focus:border-gold/30" placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] text-white/30 mb-1 block">Max Price ($)</label>
                <input type="number" value={priceRange.max} onChange={(e) => setPriceRange(p => ({...p, max: e.target.value}))}
                  className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white outline-none focus:border-gold/30" placeholder="999" />
              </div>
              <div className="flex items-end">
                <button onClick={loadFaces}
                  className="h-10 px-6 rounded-xl bg-gold text-dark text-[12px] font-bold cursor-pointer hover:bg-gold-light transition-all border-none">
                  Apply Filters
                </button>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setFilters({ gender: 'All', ethnicity: 'All', style: 'All' }); setPriceRange({ min: '', max: '' }); setSearch(''); }}
                  className="h-10 px-6 rounded-xl bg-transparent border border-white/[0.08] text-white/40 text-[12px] font-medium cursor-pointer hover:border-white/20 transition-all">
                  Reset All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(filters.gender !== 'All' || filters.ethnicity !== 'All' || filters.style !== 'All' || search) && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-[11px] text-white/20 uppercase tracking-wider">Active:</span>
            {Object.entries(filters).filter(([_, v]) => v !== 'All').map(([k, v]) => (
              <button key={k} onClick={() => updateFilter(k, 'All')}
                className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[11px] font-semibold cursor-pointer hover:bg-gold/20 transition-all flex items-center gap-1">
                {v} <span className="text-gold/50">×</span>
              </button>
            ))}
            {search && (
              <button onClick={() => setSearch('')}
                className="px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[11px] font-semibold cursor-pointer hover:bg-gold/20 transition-all flex items-center gap-1">
                "{search}" <span className="text-gold/50">×</span>
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="text-[12px] text-white/20 mb-5">{sorted.length} faces found</div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {sorted.map((face) => (
                <FaceCard key={face.id} face={face} />
              ))}
            </div>

            {sorted.length === 0 && (
              <div className="text-center py-32">
                <div className="text-[48px] mb-4">🔍</div>
                <div className="text-white/30 text-[16px] font-medium mb-2">No faces found</div>
                <div className="text-white/15 text-[13px]">Try adjusting your filters or search query</div>
              </div>
            )}
          </>
        )}

        {/* Bottom Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
          {/* Trending Faces */}
          <div onClick={() => setSort('price_high')}
            className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-white/[0.06] rounded-2xl p-7 cursor-pointer hover:border-white/[0.12] transition-all duration-300 group">
            <div className="text-[24px] mb-3">🔥</div>
            <h3 className="text-[16px] font-bold mb-2 group-hover:text-gold transition-colors duration-300">Trending Faces</h3>
            <p className="text-[13px] text-white/35 mb-4">Most popular this month</p>
            {trending.slice(0, 3).map((f) => (
              <div key={f.id} className="flex items-center gap-2 py-1">
                <img src={f.photo_url || f.photo || 'https://via.placeholder.com/32'} alt="" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-[12px] text-white/50 truncate">{f.name}</span>
                <span className="text-[11px] text-gold ml-auto">${f.price}</span>
              </div>
            ))}
          </div>

          {/* Advanced Search */}
          <div onClick={() => setShowAdvanced(!showAdvanced)}
            className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-white/[0.06] rounded-2xl p-7 cursor-pointer hover:border-white/[0.12] transition-all duration-300 group">
            <div className="text-[24px] mb-3">🔍</div>
            <h3 className="text-[16px] font-bold mb-2 group-hover:text-gold transition-colors duration-300">Advanced Search</h3>
            <p className="text-[13px] text-white/35 mb-3">Filter by price range and more</p>
            <div className="text-[12px] text-blue-400/60">{showAdvanced ? 'Click to hide ↑' : 'Click to expand ↓'}</div>
          </div>

          {/* Licensing Guide */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-white/[0.06] rounded-2xl p-7 cursor-pointer hover:border-white/[0.12] transition-all duration-300 group"
            onClick={() => document.getElementById('licensing-guide')?.scrollIntoView({ behavior: 'smooth' }) || setShowGuide(true)}>
            <div className="text-[24px] mb-3">📋</div>
            <h3 className="text-[16px] font-bold mb-2 group-hover:text-gold transition-colors duration-300">Licensing Guide</h3>
            <p className="text-[13px] text-white/35 mb-3">Understand license types</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-white/30"><span>Standard License</span><span className="text-gold">1x base price</span></div>
              <div className="flex justify-between text-white/30"><span>Extended License</span><span className="text-gold">2.5x base price</span></div>
              <div className="flex justify-between text-white/30"><span>Duration: 3/6/12 months</span><span className="text-gold">1x/1.5x/2x</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
