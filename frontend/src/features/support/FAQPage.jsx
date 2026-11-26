import React, { useState, useEffect } from 'react';
import { ChevronDown, MessageCircle, Sparkles } from 'lucide-react';

const CATEGORIES = ['All', 'Pemesanan', 'Pembayaran', 'Perjalanan', 'Lainnya'];

function SkeletonItem() {
  return (
    <div className="bg-white border border-[#EAE7DF] rounded-3xl overflow-hidden p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-[#EAE7DF] animate-pulse rounded-md w-3/4" />
        <div className="h-5 w-5 bg-[#EAE7DF] animate-pulse rounded-full flex-shrink-0" />
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/faqs');
        const json = await res.json();
        if (json.success && json.data) {
          setFaqs(json.data);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const filtered = faqs.filter((faq) => {
    const matchesSearch =
      search.trim() === '' ||
      faq.question?.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory =
      activeCategory === 'All' ||
      (faq.category && faq.category.toLowerCase() === activeCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-[#FCFCFA] min-h-screen py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#08261E]/5 border border-[#08261E]/10 text-xs font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            PUSAT INFORMASI & BANTUAN
          </div>
          <h1 className="font-serif font-bold tracking-tight text-[#08261E] text-4xl sm:text-5xl">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="leading-relaxed text-[#08261E]/70 text-base">
            Temukan klarifikasi transparan seputar reservasi eksklusif, standardisasi keamanan, ketentuan reschedule, dan fasilitas atelier kami.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center">
          <input
            type="text"
            placeholder="Ketik kata kunci (misal: pembayaran, reschedule, bagasi)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
            className="bg-white border border-[#EAE7DF] focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059] rounded-2xl text-[#08261E] px-5 py-3.5 w-full max-w-md shadow-sm text-sm transition-all placeholder:text-[#08261E]/40"
          />
        </div>

        {/* FAQ Categories: horizontal scroll pill tabs */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide justify-center">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#08261E] text-[#C5A059] shadow-md'
                    : 'bg-white border border-[#EAE7DF] text-[#08261E]/70 hover:border-[#C5A059] hover:text-[#08261E]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Accordion FAQ items */}
        <div className="max-w-3xl mx-auto space-y-3.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#EAE7DF] rounded-3xl p-8 shadow-sm">
              <p className="text-[#08261E]/70 leading-relaxed text-sm">
                Tidak ada topik pertanyaan yang cocok dengan pencarian Anda. Silakan hubungi Concierge kami langsung.
              </p>
            </div>
          ) : (
            filtered.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.id || index}
                  className={`bg-white rounded-3xl overflow-hidden border transition-all duration-300 shadow-sm ${
                    isOpen ? 'border-[#C5A059] ring-1 ring-[#C5A059]/20' : 'border-[#EAE7DF] hover:border-[#08261E]/20'
                  }`}
                >
                  {/* Question row */}
                  <button
                    type="button"
                    onClick={() => toggleAccordion(index)}
                    className="w-full text-left flex items-center justify-between p-6 cursor-pointer hover:bg-[#FCFCFA] transition"
                  >
                    <span className="font-serif font-bold text-[#08261E] pr-4 text-base">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#C5A059] flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {/* Answer panel */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="border-t border-[#EAE7DF] px-6 pb-6 pt-4 bg-[#FCFCFA]/40">
                      <p className="text-[#08261E]/70 leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CTA Section at bottom */}
        <div className="bg-[#08261E] rounded-3xl p-8 sm:p-10 text-center space-y-4 border border-white/10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-serif font-bold text-white text-2xl sm:text-3xl">
            Punya Pertanyaan Spesifik?
          </h3>
          <p className="leading-relaxed text-white/70 text-sm max-w-md mx-auto">
            Hubungi konsultan perjalanan pribadi kami via WhatsApp untuk diskusi custom itinerary atau bantuan instan.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/6281234567890?text=Halo%20Jelajah%20Trip%2C%20saya%20ingin%20bertanya%20mengenai%20layanan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#C5A059] hover:bg-[#b08d4b] text-[#08261E] rounded-2xl px-6 py-3.5 font-bold text-sm tracking-wide transition-all shadow-md active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              Chat Langsung via WhatsApp
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
