// frontend-integration/LeadPopup.updated.tsx
// Full replacement for src/components/LeadPopup.tsx

import { useState, useEffect } from "react";
import { X, Rocket } from "lucide-react";
import { captureLead } from "../lib/api";

export default function LeadPopup() {
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("popup-dismissed");
      if (!dismissed) setShow(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("popup-dismissed", "1");
    setShow(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await captureLead({ ...form, source: "popup" });
      setSubmitted(true);
      setTimeout(handleDismiss, 2500);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}>
      <div className="popup-card animate-fade-in-up">
        <button onClick={handleDismiss} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <Rocket size={28} className="text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">You're All Set!</h3>
            <p className="text-gray-400 text-sm">We'll contact you within 24 hours with your free strategy!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                style={{ background: "rgba(255,106,0,0.15)", color: "#FF6A00" }}>
                LIMITED TIME OFFER
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Get Your Free<br />
                <span className="gradient-text">Marketing Strategy</span>
              </h3>
              <p className="text-gray-400 text-sm">
                Book a free 30-minute consultation and receive a custom digital marketing audit.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="text" placeholder="Your Name" required
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-500 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <input type="email" placeholder="Email Address" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-500 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <input type="tel" placeholder="Phone Number"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-500 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button type="submit" disabled={loading} className="btn-orange w-full mt-2 py-3">
                {loading ? "Submitting..." : "Claim My Free Strategy Session 🚀"}
              </button>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </form>

            <p className="text-xs text-gray-500 text-center mt-3">
              No credit card required. 100% free consultation.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
