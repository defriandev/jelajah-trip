import React, { useState, useEffect } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

const CATEGORIES = ['All', 'Pemesanan', 'Pembayaran', 'Perjalanan', 'Lainnya'];

function SkeletonItem() {
  return (
    <div className="bg-white border border-[#E6E4DD] rounded-2xl overflow-hidden p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-[#E6E4DD] animate-pulse rounded-md w-3/4" />
        <div className="h-5 w-5 bg-[#E6E4DD] animate-pulse rounded-full flex-shrink-0" />
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
    <div className="bg-[#FAF9F6] min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D97736]">
            PUSAT BANTUAN
          </p>
          <h1 className="font-display font-bold tracking-[-0.03em] text-[#14211D] text-4xl">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="leading-[1.65] text-[#4A5550]">
            Temukan jawaban seputar pemesanan paket wisata, pembayaran, ketentuan reschedule, dan fasilitas perjalanan.
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-center">
          <input
            type="text"
            placeholder="Cari pertanyaan seputar perjalanan..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
            className="bg-white border border-[#E6E4DD] focus:border-[#0F4C3A] focus:outline-none focus:ring-1 focus:ring-[#0F4C3A] rounded-xl text-[#14211D] px-4 py-3 w-full max-w-md shadow-sm"
          />
        </div>

        {/* FAQ Categories: horizontal scroll pill tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-center">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0F4C3A] text-white'
                    : 'bg-white border border-[#E6E4DD] text-[#4A5550] hover:border-[#0F4C3A]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Accordion FAQ items */}
        <div className="max-w-3xl mx-auto space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SkeletonItem key={i} />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#E6E4DD] rounded-2xl p-8">
              <p className="text-[#4A5550] leading-[1.65]">
                Tidak ada pertanyaan yang cocok dengan kriteria pencarian atau kategori ini.
              </p>
            </div>
          ) : (
            filtered.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.id || index}
                  className={`bg-white rounded-2xl overflow-hidden border transition-colors duration-200 ${
                    isOpen ? 'border-[#0F4C3A]' : 'border-[#E6E4DD]'
                  }`}
                >
                  {/* Question row */}
                  <div
                    onClick={() => toggleAccordion(index)}
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#FAF9F6] transition"
                  >
                    <span className="font-semibold text-[#14211D] pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#0F4C3A] flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    />
                  </div>

                  {/* Answer panel */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="border-t border-[#E6E4DD] px-5 pb-5 pt-4">
                      <p className="text-[#4A5550] leading-[1.65]">
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
        <div className="bg-[#14211D] rounded-2xl p-8 text-center space-y-4">
          <h3 className="font-display font-bold text-white text-2xl">
            Masih punya pertanyaan?
          </h3>
          <p className="leading-[1.65] text-[#FAF9F6]/80 text-sm max-w-md mx-auto">
            Hubungi customer service kami langsung melalui WhatsApp untuk konsultasi paket wisata, custom itinerary, atau pertanyaan lainnya.
          </p>
          <div>
            <a
              href="https://wa.me/6281234567890?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20paket%20wisata"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0F4C3A] hover:bg-[#0A3629] text-white rounded-xl px-6 py-3.5 font-semibold transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Chat via WhatsApp
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
