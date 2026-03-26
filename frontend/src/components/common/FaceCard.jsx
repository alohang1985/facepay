import { Link } from 'react-router-dom';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face';

export default function FaceCard({ face, large }) {
  const photo = face.photo_url || face.photo || PLACEHOLDER;

  return (
    <Link
      to={`/face/${face.id}`}
      className="group block relative overflow-hidden rounded-2xl no-underline"
    >
      <div className={`relative overflow-hidden ${large ? 'aspect-[3/4]' : 'aspect-[3/4]'}`}>
        <img
          src={photo}
          alt={face.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pb-5">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-white font-bold text-[17px] leading-tight truncate">{face.name}</h3>
              <p className="text-white/40 text-[12px] mt-1.5 truncate">{face.tags}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-gold font-bold text-[20px] leading-none">${face.price}</div>
              <div className="text-white/30 text-[10px] mt-1 tracking-wide">/license</div>
            </div>
          </div>
        </div>

        {/* Hover glow */}
        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 border-2 border-gold/0 group-hover:border-gold/20 rounded-2xl transition-all duration-500" />

        {/* Badge */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          <span className="text-[10px] text-white/80 font-medium tracking-wide">Verified</span>
        </div>
      </div>
    </Link>
  );
}
