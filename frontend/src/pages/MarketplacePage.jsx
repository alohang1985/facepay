import { useState } from 'react';
import { faces } from '../data/faces';
import FaceCard from '../components/common/FaceCard';

const filters = [
  { label: 'Gender', options: ['All', 'Male', 'Female'] },
  { label: 'Age', options: ['All', '20s', '30s', '40s', '50+'] },
  { label: 'Ethnicity', options: ['All', 'Asian', 'Caucasian', 'Latino'] },
  { label: 'Style', options: ['All', 'Casual', 'Business', 'Elegant', 'Street'] },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const filtered = faces.filter((f) => !search || f.name.toLowerCase().includes(search.toLowerCase()));

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
            <p className="text-white/35 text-[15px] mt-2">Browse verified faces for your next project</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10">
        {/* Filters Bar */}
        <div className="flex items-center justify-between mb-10 gap-4 flex-wrap">
          <div className="flex gap-2.5 flex-wrap">
            {filters.map((f) => (
              <select key={f.label} className="h-10 px-4 bg-white/[0.03] border border-white/[0.08] rounded-full text-[12px] text-white/50 outline-none cursor-pointer hover:border-white/15 focus:border-gold/30 transition-colors appearance-auto">
                <option>{f.label}</option>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ))}
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

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {filtered.map((face) => (
            <FaceCard key={face.id} face={face} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-32 text-white/25 text-[15px]">No faces found matching your search.</div>
        )}

        {/* Bottom Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
          {[
            { title: 'Trending Faces', desc: 'Most licensed this month', gradient: 'from-amber-500/10 to-orange-500/5', icon: '🔥' },
            { title: 'Advanced Search', desc: 'Filter by specific attributes', gradient: 'from-blue-500/10 to-indigo-500/5', icon: '🔍' },
            { title: 'Licensing Guide', desc: 'Learn about license types', gradient: 'from-emerald-500/10 to-teal-500/5', icon: '📋' },
          ].map((card) => (
            <div key={card.title} className={`bg-gradient-to-br ${card.gradient} border border-white/[0.06] rounded-2xl p-7 cursor-pointer hover:border-white/[0.12] transition-all duration-300 group`}>
              <div className="text-[24px] mb-3">{card.icon}</div>
              <h3 className="text-[16px] font-bold mb-1 group-hover:text-gold transition-colors duration-300">{card.title}</h3>
              <p className="text-[13px] text-white/35">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
