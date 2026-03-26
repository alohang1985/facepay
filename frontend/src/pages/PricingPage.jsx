import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptions } from '../services/api';
import { useToast } from '../components/common/Toast';

const plans = [
  { id: 'free', name: 'Free', price: 0, licenses: 2, features: ['2 licenses/month', 'Basic search', 'Standard support'] },
  { id: 'starter', name: 'Starter', price: 29, licenses: 10, features: ['10 licenses/month', 'Advanced filters', 'Priority support', 'API access'], popular: true },
  { id: 'pro', name: 'Pro', price: 79, licenses: 50, features: ['50 licenses/month', 'Bulk licensing', 'Dedicated manager', 'Custom contracts', 'API access'] },
  { id: 'enterprise', name: 'Enterprise', price: 199, licenses: 999, features: ['Unlimited licenses', 'White-label option', 'SLA guarantee', 'Custom integration', 'Priority API'] },
];

export default function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [subscribing, setSubscribing] = useState('');

  const handleSubscribe = async (plan) => {
    if (!user) { navigate('/login'); return; }
    setSubscribing(plan);
    try {
      await subscriptions.subscribe(plan);
      toast.success(`Subscribed to ${plan} plan!`);
      navigate('/dashboard');
    } catch (e) { toast.error(e.message); }
    setSubscribing('');
  };

  return (
    <div className="min-h-screen pt-[64px]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">
        <div className="text-center mb-16">
          <div className="text-[11px] uppercase tracking-[3px] text-gold/80 font-semibold mb-3">Pricing</div>
          <h1 className="text-[42px] font-extrabold tracking-[-1.5px] mb-4">Choose Your Plan</h1>
          <p className="text-white/30 text-[16px] max-w-[480px] mx-auto">Scale your face licensing needs with flexible plans</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div key={plan.id} className={`p-7 rounded-2xl border transition-all relative ${
              plan.popular ? 'bg-gold/[0.05] border-gold/25 scale-[1.02]' : 'bg-white/[0.025] border-white/[0.06]'
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-dark text-[10px] font-bold tracking-wider">POPULAR</div>
              )}
              <div className="text-[13px] text-white/40 font-semibold mb-2">{plan.name}</div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-[40px] font-black text-white tracking-[-2px]">${plan.price}</span>
                <span className="text-white/20 text-[13px] mb-2">/month</span>
              </div>
              <div className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-[13px] text-white/45">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </div>
                ))}
              </div>
              <button onClick={() => handleSubscribe(plan.id)} disabled={subscribing === plan.id}
                className={`w-full py-3.5 rounded-full font-bold text-[13px] cursor-pointer border-none transition-all disabled:opacity-50 ${
                  plan.popular ? 'bg-gold text-dark hover:bg-gold-light' : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1]'
                }`}>
                {subscribing === plan.id ? 'Processing...' : plan.price === 0 ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
