import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { faces as facesApi, licenses, wishlist as wishApi, reviews as reviewsApi, similar as similarApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { getFaceById } from '../data/faces';

export default function FaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [licenseType, setLicenseType] = useState('standard');
  const [showPurchase, setShowPurchase] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [duration, setDuration] = useState(3);
  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [inWishlist, setInWishlist] = useState(false);
  const [rvws, setRvws] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [similarFaces, setSimilarFaces] = useState([]);

  // Try API first, fallback to local data
  const [face, setFace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facesApi.get(id)
      .then(setFace)
      .catch(() => setFace(getFaceById(id)))
      .finally(() => setLoading(false));
    if (user) {
      wishApi.check(id).then((d) => setInWishlist(d.in_wishlist)).catch(() => {});
    }
    loadReviews();
    similarApi.find(id).then((d) => setSimilarFaces(d.similar || [])).catch(() => {});
  }, [id, user]);

  const loadReviews = () => {
    reviewsApi.forFace(id).then((d) => {
      setRvws(d.reviews || []);
      setAvgRating(d.average_rating || 0);
      setTotalReviews(d.total_reviews || 0);
    }).catch(() => {});
  };

  const submitReview = async () => {
    if (!user) { navigate('/login'); return; }
    if (!myRating) { toast.error('Please select a rating'); return; }
    setSubmittingReview(true);
    try {
      await reviewsApi.create({ face_id: face.id, rating: myRating, comment: myComment });
      toast.success('Review submitted!');
      setMyRating(0); setMyComment('');
      loadReviews();
    } catch (e) { toast.error(e.message); }
    setSubmittingReview(false);
  };

  const toggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (inWishlist) {
        await wishApi.remove(face.id);
        setInWishlist(false);
        toast.info('Removed from wishlist');
      } else {
        await wishApi.add(face.id);
        setInWishlist(true);
        toast.success('Added to wishlist!');
      }
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="min-h-screen pt-[64px] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-gold/20 border-t-gold animate-spin" /></div>;
  if (!face) return <div className="min-h-screen pt-[64px] flex items-center justify-center text-white/30">Face not found</div>;

  const handlePurchase = async () => {
    if (!user) { navigate('/login'); return; }
    if (!purpose) { setError('Please enter usage purpose'); return; }
    setPurchasing(true);
    setError('');
    try {
      await licenses.purchase({
        face_id: face.id,
        license_type: licenseType,
        usage_purpose: purpose,
        duration_months: duration,
      });
      setSuccess(true);
      toast.success('License purchased successfully!');
      setTimeout(() => navigate('/my-licenses'), 2000);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
    setPurchasing(false);
  };

  const photo = face.photo_url || face.photo;
  const price = face.price;
  const extPrice = Math.round(price * 2.5);
  const selectedPrice = licenseType === 'extended' ? extPrice : price;

  const morePhotos = [
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
  ];

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="relative h-[280px] overflow-hidden">
        <img src={photo} alt="" className="w-full h-full object-cover blur-3xl scale-125 opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/40 to-dark" />
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 -mt-44 relative z-10 pb-24">
        <Link to="/marketplace" className="text-white/30 text-[13px] no-underline hover:text-gold transition-colors duration-200 mb-8 inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          Back to Marketplace
        </Link>

        <div className="flex gap-12 flex-col lg:flex-row mt-4">
          <div className="w-full lg:w-[400px] shrink-0">
            <img src={photo} alt={face.name} className="w-full aspect-[3/4] object-cover rounded-2xl shadow-2xl shadow-black/50" />
            <div className="mt-5">
              <div className="text-[12px] text-white/30 mb-3 uppercase tracking-wider font-medium">More Photos</div>
              <div className="flex gap-2.5">
                {morePhotos.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-[68px] h-[68px] rounded-xl object-cover border border-white/[0.06] opacity-60 hover:opacity-100 cursor-pointer transition-all duration-200 hover:border-gold/30" />
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-[36px] font-extrabold tracking-[-1.5px]">{face.name}</h1>
              <button onClick={toggleWishlist}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] cursor-pointer border transition-all duration-200 ${
                  inWishlist ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-white/[0.04] border-white/[0.08] text-white/20 hover:text-danger hover:border-danger/20'
                }`}>
                {inWishlist ? '♥' : '♡'}
              </button>
            </div>
            <p className="text-white/30 text-[14px] mb-7">Age: {face.age} · Ethnicity: {face.ethnicity} · {face.location}</p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[12px] font-semibold mb-7">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Verified Model
            </div>

            <div className="space-y-2.5 mb-7">
              {['ID Verified', 'Licensed for Commercial Use', 'Global Legal Protection'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-[14px] text-white/50">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  {item}
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap mb-8">
              {(face.tags || '').split(' · ').filter(Boolean).map((tag) => (
                <span key={tag} className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[12px] text-white/40">{tag}</span>
              ))}
            </div>

            {/* License Options */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] mb-8">
              <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-5 font-semibold">License Options</div>
              <div className="space-y-2.5">
                {[
                  { id: 'standard', name: 'Standard License', desc: 'General commercial use', p: price },
                  { id: 'extended', name: 'Extended License', desc: 'Unlimited usage, all platforms', p: extPrice },
                ].map((opt) => (
                  <label key={opt.id} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all duration-200 ${licenseType === opt.id ? 'bg-gold/[0.06] border-gold/25' : 'border-transparent hover:bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${licenseType === opt.id ? 'border-gold' : 'border-white/15'}`}>
                        {licenseType === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                      </div>
                      <input type="radio" name="lic" checked={licenseType === opt.id} onChange={() => setLicenseType(opt.id)} className="hidden" />
                      <div>
                        <div className="text-[14px] font-semibold">{opt.name}</div>
                        <div className="text-[12px] text-white/30 mt-0.5">{opt.desc}</div>
                      </div>
                    </div>
                    <div className="text-gold font-bold text-[18px]">${opt.p}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <button onClick={() => { if (!user) navigate('/login'); else setShowPurchase(true); }}
                className="flex-1 py-4 rounded-full bg-gold text-dark font-bold text-[13px] tracking-wide hover:bg-gold-light hover:shadow-[0_0_40px_rgba(201,169,110,0.2)] transition-all duration-300 border-none cursor-pointer">
                License Now — ${selectedPrice}
              </button>
              <button className="flex-1 py-4 rounded-full border border-white/10 text-white/50 font-medium text-[13px] tracking-wide hover:border-gold/25 hover:text-gold transition-all duration-300 bg-transparent cursor-pointer">
                Request Custom
              </button>
            </div>

            {/* Purchase Modal */}
            {showPurchase && (
              <div className="mt-6 p-6 rounded-2xl bg-gold/[0.04] border border-gold/20">
                <div className="text-[11px] uppercase tracking-[2px] text-gold/60 mb-5 font-semibold">Complete Purchase</div>

                {success ? (
                  <div className="text-center py-8">
                    <div className="text-emerald-400 text-[48px] mb-3">✓</div>
                    <div className="text-[18px] font-bold mb-2">License Purchased!</div>
                    <div className="text-white/30 text-[13px]">Redirecting to your licenses...</div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Usage Purpose</label>
                      <select value={purpose} onChange={(e) => setPurpose(e.target.value)}
                        className="w-full py-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30">
                        <option value="">Select purpose...</option>
                        <option>YouTube Ad Campaign</option>
                        <option>Social Media Content</option>
                        <option>E-Commerce Product</option>
                        <option>Website Banner</option>
                        <option>Print Advertising</option>
                        <option>Email Marketing</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="text-[11px] uppercase tracking-[2px] text-white/25 mb-2 block font-semibold">Duration</label>
                      <div className="flex gap-2">
                        {[3, 6, 12].map((m) => (
                          <button key={m} onClick={() => setDuration(m)}
                            className={`flex-1 py-3 rounded-xl text-[13px] font-semibold border cursor-pointer transition-all ${
                              duration === m ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-transparent border-white/[0.08] text-white/30 hover:border-white/15'
                            }`}>
                            {m} months
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-5 p-4 rounded-xl bg-white/[0.03]">
                      <span className="text-white/40 text-[13px]">Total Price</span>
                      <span className="text-gold font-extrabold text-[24px]">${(selectedPrice * {3:1,6:1.5,12:2}[duration]).toFixed(2)}</span>
                    </div>

                    {error && <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[13px]">{error}</div>}

                    <div className="flex gap-3">
                      <button onClick={handlePurchase} disabled={purchasing}
                        className="flex-1 py-4 rounded-full bg-gold text-dark font-bold text-[13px] tracking-wide hover:bg-gold-light transition-all border-none cursor-pointer disabled:opacity-50">
                        {purchasing ? 'Processing...' : 'Confirm Purchase'}
                      </button>
                      <button onClick={() => setShowPurchase(false)}
                        className="px-6 py-4 rounded-full border border-white/10 text-white/40 text-[13px] bg-transparent cursor-pointer hover:border-white/20 transition-all">
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar Faces */}
        {similarFaces.length > 0 && (
          <div className="max-w-[1100px] mx-auto px-6 lg:px-10 pb-12">
            <h2 className="text-[22px] font-bold tracking-[-0.5px] mb-6">Similar Faces</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {similarFaces.map((sf) => (
                <Link key={sf.id} to={`/face/${sf.id}`} className="group block no-underline">
                  <div className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={sf.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face'} alt={sf.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-white text-[12px] font-semibold truncate">{sf.name}</div>
                      <div className="text-gold text-[11px] font-bold">${sf.price}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 pb-24">
          <div className="border-t border-white/[0.06] pt-12">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-[24px] font-bold tracking-[-0.5px]">Reviews</h2>
              {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gold text-[18px]">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5-Math.round(avgRating))}</span>
                  <span className="text-white/40 text-[14px]">{avgRating} ({totalReviews})</span>
                </div>
              )}
            </div>

            {/* Write Review */}
            <div className="p-6 rounded-2xl bg-white/[0.025] border border-white/[0.06] mb-6">
              <div className="text-[11px] uppercase tracking-[2px] text-white/25 mb-4 font-semibold">Write a Review</div>
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((s) => (
                  <button key={s} onClick={() => setMyRating(s)}
                    className={`text-[24px] bg-transparent border-none cursor-pointer transition-colors ${s <= myRating ? 'text-gold' : 'text-white/15 hover:text-gold/40'}`}>★</button>
                ))}
              </div>
              <textarea value={myComment} onChange={(e) => setMyComment(e.target.value)} rows={3} placeholder="Share your experience..."
                className="w-full py-3 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-text-primary text-[14px] outline-none focus:border-gold/30 transition-colors placeholder:text-white/15 resize-none mb-4" />
              <button onClick={submitReview} disabled={submittingReview || !myRating}
                className="px-6 py-3 rounded-full bg-gold text-dark font-bold text-[13px] hover:bg-gold-light transition-all border-none cursor-pointer disabled:opacity-30">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>

            {/* Review List */}
            {rvws.length === 0 ? (
              <div className="text-center py-12 text-white/15 text-[14px]">No reviews yet. Be the first!</div>
            ) : (
              <div className="space-y-3">
                {rvws.map((r) => (
                  <div key={r.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-[14px]">{r.user_name || 'Anonymous'}</span>
                        <span className="text-gold text-[13px] ml-2">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                      </div>
                      <span className="text-white/15 text-[11px]">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="text-white/40 text-[13px] leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
