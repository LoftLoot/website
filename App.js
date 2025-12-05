// src/App.js
import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useDeferredValue } from 'react';
import { Search, X, Filter, ChevronDown, ArrowUp } from 'lucide-react';

import { 
    processProductData, 
    SORT_OPTIONS, ITEMS_PER_PAGE, FILTER_COLORS, TYPE_CONFIG, ORGANIZATION_SCHEMA, 
    SORT_STRATEGIES
} from './data';
import { useSearchIndex } from './hooks/useSearchIndex';
import Header from './components/Header';
import Hero from './components/Hero'; // New Import
import Footer from './components/Footer'; // New Import
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import AboutSection from './components/AboutSection';

// --- STYLES & HELPERS ---

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&family=Outfit:wght@300;400;500;700;900&display=swap');
        .font-jua { font-family: 'Jua', sans-serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }
        @keyframes deal-bottom { 0% { transform: translateY(100px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes tear-off { 0% { transform: rotate(0deg); } 20% { transform: rotate(-5deg); } 40% { transform: rotate(5deg); } 60% { transform: rotate(-2deg); } 100% { transform: translateY(150%) rotate(10deg); opacity: 0; } }
        .animate-deal-bottom { animation: deal-bottom 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-tear-off { animation: tear-off 0.8s ease-in forwards; }
        .ticker-wrapper:hover .animate-marquee-slow { animation-play-state: paused; }
    `}</style>
);

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("UI Error:", error, errorInfo); }
  render() { if (this.state.hasError) return <div className="p-8 text-center text-[#d35153] font-bold text-xl">Something went wrong. Please refresh.</div>; return this.props.children; }
}

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

const useSEO = ({ title, description, image, canonical }) => {
    useEffect(() => {
        if (title) document.title = title;
        if (description) {
            let meta = document.querySelector("meta[name='description']");
            if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
            meta.content = description;
        }
        if (canonical) {
            let link = document.querySelector("link[rel='canonical']");
            if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
            link.href = canonical;
        }
    }, [title, description, image, canonical]);
};

// --- FILTER COMPONENTS ---

const FilterGroup = ({ title, options, selected, onChange, color, availableSet }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="mb-6 border-b border-[#514d46]/10 pb-6 last:border-0">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full mb-3 group"><h3 className="font-bold text-[#514d46] uppercase tracking-widest text-sm group-hover:text-[#487ec8] transition-colors">{title}</h3><ChevronDown size={16} className={`text-[#514d46]/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>
            {isOpen && (
                <div className="space-y-2 animate-fade-in">
                    <button onClick={() => onChange("All")} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${selected === "All" ? "bg-[#514d46] text-white shadow-md" : "text-[#514d46]/60 hover:bg-[#514d46]/5 hover:text-[#514d46]"}`}><div className={`w-2 h-2 rounded-full ${selected === "All" ? "bg-white" : "bg-[#514d46]/20"}`}></div>All {title}</button>
                    {options.map((opt) => {
                         const isAvailable = !availableSet || availableSet.includes(opt);
                         const label = title === 'Type' && TYPE_CONFIG[opt] ? TYPE_CONFIG[opt].plural : opt;
                         return (
                            <button key={opt} onClick={() => onChange(opt)} disabled={!isAvailable} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-between group ${selected === opt ? "bg-white text-[#514d46] shadow-sm border border-[#E0E8F0]" : "text-[#514d46]/70 hover:bg-white hover:shadow-sm"} ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                <span>{label}</span>
                                {selected === opt && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const FilterSection = React.memo(({ collections, decades, types, selectedCollection, selectedDecade, selectedType, priceRange, minPrice, maxPrice, availableCollections, availableDecades, availableTypes, showInStockOnly, onCollectionChange, onDecadeChange, onTypeChange, onPriceChange, onStockChange }) => (
    <div className="bg-[#fffbf0] md:bg-transparent p-4 md:p-0 h-full overflow-y-auto md:overflow-visible">
        <div className="flex items-center justify-between mb-6 md:hidden"><h2 className="text-xl font-black text-[#514d46]" style={{ fontFamily: '"Jua", sans-serif' }}>Filters</h2></div>
        
        {/* Price Slider */}
        <div className="mb-8 border-b border-[#514d46]/10 pb-8">
            <h3 className="font-bold text-[#514d46] uppercase tracking-widest text-sm mb-4">Price Range</h3>
            <div className="px-2">
                <input type="range" min={minPrice} max={maxPrice} value={priceRange[1]} onChange={(e) => onPriceChange([minPrice, parseInt(e.target.value)])} className="w-full accent-[#487ec8] h-1 bg-[#514d46]/10 rounded-lg appearance-none cursor-pointer" />
                <div className="flex justify-between mt-2 text-xs font-bold text-[#514d46]/60"><span>£{minPrice}</span><span>£{priceRange[1]}</span></div>
            </div>
        </div>

        {/* Stock Toggle */}
        <div className="mb-8 border-b border-[#514d46]/10 pb-8">
             <label className="flex items-center justify-between cursor-pointer group">
                 <span className="font-bold text-[#514d46] text-sm group-hover:text-[#487ec8] transition-colors">In Stock Only</span>
                 <div className={`w-12 h-6 rounded-full p-1 transition-colors ${showInStockOnly ? 'bg-[#487ec8]' : 'bg-[#514d46]/20'}`}>
                     <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${showInStockOnly ? 'translate-x-6' : 'translate-x-0'}`}></div>
                 </div>
                 <input type="checkbox" className="hidden" checked={showInStockOnly} onChange={(e) => onStockChange(e.target.checked)} />
             </label>
        </div>

        <FilterGroup title="Collection" options={collections} selected={selectedCollection} onChange={onCollectionChange} color={FILTER_COLORS.Collection} availableSet={availableCollections} />
        <FilterGroup title="Era" options={decades} selected={selectedDecade} onChange={onDecadeChange} color={FILTER_COLORS.Era} availableSet={availableDecades} />
        <FilterGroup title="Type" options={types} selected={selectedType} onChange={onTypeChange} color={FILTER_COLORS.Type} availableSet={availableTypes} />
        
        <div className="mt-8 pt-6 border-t border-[#514d46]/10">
            <button onClick={() => { onCollectionChange("All"); onDecadeChange("All"); onTypeChange("All"); onPriceChange([minPrice, maxPrice]); onStockChange(false); }} className="w-full py-3 rounded-xl border-2 border-[#d35153] text-[#d35153] font-bold text-sm hover:bg-[#d35153] hover:text-white transition-all active:scale-95">Reset Filters</button>
        </div>
    </div>
));

// --- MAIN APP CONTENT ---

const AppContent = () => {
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  
  // --- DATA FETCHING STATE ---
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('products.json')
        .then(res => {
            if (!res.ok) throw new Error("Failed to load products");
            return res.json();
        })
        .then(json => {
            const processed = processProductData(json);
            setAppData(processed);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setError(err.message);
            setLoading(false);
        });
  }, []);

  // --- STATE (Derived from AppData or URL) ---
  const [searchQuery, setSearchQuery] = useState(() => urlParams.get('q') || ""); 
  const [committedQuery, setCommittedQuery] = useState(() => urlParams.get('q') || ""); 
  const [isTyping, setIsTyping] = useState(false);
  
  // Default values must handle null appData initially
  const [selectedCollection, setSelectedCollection] = useState(() => urlParams.get('collection') || "All");
  const [selectedDecade, setSelectedDecade] = useState(() => urlParams.get('decade') || "All");
  const [selectedType, setSelectedType] = useState(() => urlParams.get('type') || "All");
  const [sortOption, setSortOption] = useState(() => urlParams.get('sort') || "latest");
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]); // Temporary default
  
  // View product logic needs appData to be ready
  const [viewProduct, setViewProduct] = useState(null);
  
  // Update viewProduct and priceRange once data loads
  useEffect(() => {
      if (!appData) return;
      
      // 1. Set Price Range limits
      setPriceRange([appData.minPrice, appData.maxPrice]);

      // 2. Check URL for Product ID
      const pid = urlParams.get('id');
      if (pid) {
          const found = appData.productMap.get(parseInt(pid));
          if (found) setViewProduct(found);
      }
  }, [appData, urlParams]);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentView, setCurrentView] = useState('shop'); 
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const lastScrollPos = useRef(0);
  const topSectionRef = useRef(null); 
  const sortRef = useRef(null);

  // Search Engine Hook - pass empty array if loading
  const { autocomplete, search: performSearch } = useSearchIndex(appData ? appData.products : []);
  
  const deferredSearch = useDeferredValue(searchQuery);
  const suggestions = useMemo(() => {
      if (isTyping && appData) return autocomplete(deferredSearch, showInStockOnly);
      return { filters: [], products: [], totalProducts: 0 };
  }, [deferredSearch, isTyping, showInStockOnly, autocomplete, appData]);

  // Actions
  const openProduct = (id) => { 
      if (!appData) return;
      lastScrollPos.current = window.scrollY; 
      const prod = appData.productMap.get(id);
      setViewProduct(prod); 
  };
  
  const closeProduct = () => setViewProduct(null);

  const resetView = () => { 
      if (!appData) return;
      closeProduct(); 
      setCurrentView('shop'); 
      setSelectedCollection("All"); 
      setSelectedDecade("All"); 
      setSelectedType("All"); 
      setSearchQuery(""); 
      setCommittedQuery("");
      setPriceRange([appData.minPrice, appData.maxPrice]); 
      window.scrollTo({ top: 0, behavior: 'instant' }); 
      lastScrollPos.current = 0; 
  };

  const handleCommit = (action) => {
      setIsTyping(false);
      lastScrollPos.current = 0;
      setViewProduct(null);
      setCurrentView('shop');

      if (action.type === 'query') {
          setCommittedQuery(action.value);
          if(action.value && topSectionRef.current) {
              const offset = topSectionRef.current.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: offset, behavior: 'smooth' });
          }
          if (action.value.length > 0 && appData) {
              setSelectedCollection("All"); setSelectedDecade("All"); setSelectedType("All");
              setPriceRange([appData.minPrice, appData.maxPrice]);
          }
      } else if (action.type === 'filter') {
          const filter = action.payload;
          setCommittedQuery(""); setSearchQuery("");
          if (filter.kind === 'Collection') setSelectedCollection(filter.value);
          if (filter.kind === 'Type') setSelectedType(filter.value);
          if (filter.kind === 'Era') setSelectedDecade(filter.value);
      } else if (action.type === 'product') {
          setCommittedQuery(searchQuery);
          openProduct(action.payload.id);
          setSearchQuery("");
      }
  };

  const handleSearchUpdate = (newVal) => { setSearchQuery(newVal); setIsTyping(true); };
  const scrollToTopSmart = () => window.scrollTo({ top: topSectionRef.current && window.scrollY > topSectionRef.current.getBoundingClientRect().top + window.scrollY - 80 + 10 ? topSectionRef.current.getBoundingClientRect().top + window.scrollY - 80 : 0, behavior: "smooth" });

  useEffect(() => {
    const handleScroll = throttle(() => topSectionRef.current && setShowScrollButton(window.scrollY > 400), 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter Logic
  const available = useMemo(() => {
      if (!appData) return { collections: [], decades: [], types: [] };
      const c = new Set(), d = new Set(), t = new Set();
      for (const p of appData.products) {
          if (showInStockOnly && p.stock <= 0) continue;
          if ((selectedDecade === 'All' || p.decade === selectedDecade) && (selectedType === 'All' || p.type === selectedType)) c.add(p.collection);
          if ((selectedCollection === 'All' || p.collection === selectedCollection) && (selectedType === 'All' || p.type === selectedType)) d.add(p.decade);
          if ((selectedCollection === 'All' || p.collection === selectedCollection) && (selectedDecade === 'All' || p.decade === selectedDecade)) t.add(p.type);
      }
      return { collections: Array.from(c).sort(), decades: Array.from(d).sort(), types: Array.from(t).sort() };
  }, [selectedDecade, selectedCollection, selectedType, showInStockOnly, appData]);

  const { min, max } = useMemo(() => {
      if (!appData) return { min: 0, max: 1000 };
      let f = appData.products.filter(p => (selectedCollection === 'All' || p.collection === selectedCollection) && (selectedDecade === 'All' || p.decade === selectedDecade) && (selectedType === 'All' || p.type === selectedType) && (!showInStockOnly || p.stock > 0));
      if (f.length === 0) return { min: 0, max: 100 };
      const prices = f.map(p => p.price);
      return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [selectedCollection, selectedDecade, selectedType, showInStockOnly, appData]);

  useLayoutEffect(() => setPriceRange([min, max]), [min, max]);

  const filteredProducts = useDeferredValue(useMemo(() => {
    if (!appData) return [];
    const results = performSearch(committedQuery, { collection: selectedCollection, decade: selectedDecade, type: selectedType, priceRange, showInStockOnly });
    const sortFn = SORT_STRATEGIES[sortOption];
    if (sortFn) results.sort((a, b) => (a.stock > 0 !== b.stock > 0) ? (a.stock > 0 ? -1 : 1) : sortFn(a, b));
    return results;
  }, [committedQuery, selectedCollection, selectedDecade, selectedType, priceRange, sortOption, showInStockOnly, performSearch, appData]));

  useEffect(() => setVisibleCount(ITEMS_PER_PAGE), [selectedCollection, selectedDecade, selectedType, priceRange, committedQuery, sortOption, showInStockOnly]);
  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

  // URL Sync
  useEffect(() => {
      const p = new URLSearchParams();
      if (committedQuery) p.set('q', committedQuery); 
      if (selectedCollection !== 'All') p.set('collection', selectedCollection); 
      if (selectedDecade !== 'All') p.set('decade', selectedDecade); 
      if (selectedType !== 'All') p.set('type', selectedType); 
      if (sortOption !== 'latest') p.set('sort', sortOption); 
      if (viewProduct) p.set('id', viewProduct.id);
      const url = `${window.location.pathname}${p.toString() ? '?' + p.toString() : ''}`;
      
      // Logic to decide between pushState and replaceState
      // This enables the "Back" button to work for closing products
      const currentParams = new URLSearchParams(window.location.search);
      const currentId = currentParams.get('id');
      const newId = p.get('id');

      if (window.location.search !== `?${p.toString()}`) {
          // If we are opening a product (newId exists) and it's different from current (or current was null)
          // We push state so the "Back" button works.
          if (newId && newId !== currentId) {
              window.history.pushState({}, '', url);
          } else {
              window.history.replaceState({}, '', url);
          }
      }
  }, [committedQuery, selectedCollection, selectedDecade, selectedType, sortOption, viewProduct]);

  useEffect(() => {
      const handler = () => { 
          if (!appData) return;
          const pid = new URLSearchParams(window.location.search).get('id'); 
          if (pid) setViewProduct(appData.productMap.get(parseInt(pid))); 
          else setViewProduct(null); 
      };
      window.addEventListener('popstate', handler); return () => window.removeEventListener('popstate', handler);
  }, [appData]);

  useSEO({ title: viewProduct ? null : "LoftLoot | Vintage Toys", canonical: window.location.href });

  // Dynamic Header Text
  const dynamicH1 = useMemo(() => {
      if (committedQuery) return `'${committedQuery}'`;
      const parts = [];
      let isVintage = true;
      if (selectedDecade !== 'All' && selectedDecade !== 'Unknown') {
          if (new Date().getFullYear() - parseInt(selectedDecade) < 20) isVintage = false;
          parts.push(selectedDecade.startsWith('19') ? selectedDecade.substring(2) : selectedDecade);
      }
      if (isVintage) parts.push("Vintage");
      if (selectedCollection !== 'All') parts.push(selectedCollection);
      if (selectedType !== 'All') parts.push(TYPE_CONFIG[selectedType] ? TYPE_CONFIG[selectedType].plural : selectedType);
      else parts.push("Toys");
      return parts.join(" ");
  }, [selectedDecade, selectedCollection, selectedType, committedQuery]);

  // --- LOADING / ERROR STATES ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fffbf0] text-[#514d46] font-bold">Loading Loot...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#fffbf0] text-[#d35153] font-bold">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#fffbf0] text-[#514d46] selection:bg-pink-200 flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <GlobalStyles />
      <Header currentView={currentView} isProductView={!!viewProduct} onCatalogueClick={() => { if(viewProduct) closeProduct(); setCurrentView('shop'); }} onAboutClick={() => { if(viewProduct) closeProduct(); setCurrentView('about'); }} onHomeClick={resetView} search={searchQuery} onSearchUpdate={handleSearchUpdate} onCommit={handleCommit} suggestions={suggestions} />
      
      <button onClick={scrollToTopSmart} className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-[#487ec8] text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}><ArrowUp size={24} strokeWidth={3} /></button>

      {viewProduct ? (
        <ProductDetail 
            product={viewProduct} 
            productMap={appData.productMap} 
            onClose={closeProduct} 
            onShopAll={resetView} 
            onCategoryClick={(c) => { setSelectedCollection(c); closeProduct(); }} 
            onDecadeClick={(d) => { setSelectedDecade(d); closeProduct(); }} 
            onOpen={openProduct} 
        />
      ) : (
        <>
            {currentView === 'shop' ? (
            <>
                <Hero />
                <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full pb-12 mb-20">
                    <div className="flex flex-col lg:flex-row gap-8" ref={topSectionRef}>
                        <button className="lg:hidden flex items-center justify-center gap-2 w-full bg-white border border-[#E0E8F0] py-3 rounded-xl font-bold text-[#514d46] shadow-sm active:scale-95 transition-transform" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}>{isMobileFilterOpen ? <X size={18} /> : <Filter size={18} />}{isMobileFilterOpen ? 'Close Filters' : 'Filter Collection'}</button>
                        <aside className={`lg:w-64 flex-shrink-0 ${isMobileFilterOpen ? 'block' : 'hidden lg:block'} lg:pt-2`}>
                            {/* Pass dynamic collections/decades/types from appData */}
                            <FilterSection collections={appData.collections} decades={appData.decades} types={appData.types} selectedCollection={selectedCollection} selectedDecade={selectedDecade} selectedType={selectedType} priceRange={priceRange} minPrice={appData.minPrice} maxPrice={appData.maxPrice} availableCollections={available.collections} availableDecades={available.decades} availableTypes={available.types} showInStockOnly={showInStockOnly} onCollectionChange={setSelectedCollection} onDecadeChange={setSelectedDecade} onTypeChange={setSelectedType} onPriceChange={setPriceRange} onStockChange={setShowInStockOnly} />
                        </aside>
                        <div className="flex-1 min-h-[500px]">
                            <div className="-mt-4 mb-2"><h1 className="text-[#514d46] font-black text-3xl md:text-4xl leading-none flex items-center gap-2" style={{ fontFamily: '"Jua", sans-serif' }}>{dynamicH1} {committedQuery && <button onClick={() => { setCommittedQuery(""); setSearchQuery(""); }} className="bg-[#514d46]/20 text-white rounded-full p-0.5 hover:bg-[#514d46]/40 transition-colors"><X size={16} strokeWidth={3}/></button>}</h1></div>
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
                                <h3 className="text-[#514d46]/60 font-medium text-sm">Showing <span className="text-[#514d46] font-bold">{filteredProducts.length}</span> results</h3>
                                <div className="relative" ref={sortRef}>
                                    <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 text-sm focus:outline-none"><span className="text-[#514d46]/60 font-bold">Sort:&nbsp;</span><span className="font-bold text-[#514d46]">{SORT_OPTIONS.find(opt => opt.value === sortOption)?.label || "Latest"}</span><ChevronDown size={16} /></button>
                                    {isSortOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-[#514d46]/20 overflow-hidden z-50 animate-fade-in flex flex-col">
                                            {SORT_OPTIONS.map((opt) => (<button key={opt.value} onClick={() => { setSortOption(opt.value); setIsSortOpen(false); }} className={`w-full text-left px-4 py-3 text-base font-bold transition-colors hover:bg-[#f4f4f5] ${sortOption === opt.value ? 'text-[#d35153] bg-[#f4f4f5]' : 'text-[#514d46]'}`}>{opt.label}</button>))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {visibleProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 relative z-10">{visibleProducts.map((product, index) => (<ProductCard key={product.id} product={product} index={index} onOpen={openProduct} priority={index < 6} animationDelay={index >= ITEMS_PER_PAGE ? `${(index % ITEMS_PER_PAGE) * 0.03}s` : undefined} />))}</div>
                                {visibleCount < filteredProducts.length && <div className="mt-12 text-center"><button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)} className="px-8 py-3 bg-white border-2 border-[#E0E8F0] text-[#514d46] font-bold rounded-xl hover:border-[#487ec8] transition-all shadow-sm active:scale-95">Load More Loot</button></div>}
                            </>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#E0E8F0]"><div className="w-16 h-16 bg-[#E0E8F0] rounded-full flex items-center justify-center mx-auto mb-4 text-[#487ec8]"><Search size={32} /></div><h3 className="text-[#514d46] font-bold text-lg mb-1">No loot found :(</h3><button onClick={resetView} className="mt-4 text-[#d35153] font-bold text-sm hover:underline">Clear all filters</button></div>
                            )}
                        </div>
                    </div>
                </main>
            </>
          ) : ( <AboutSection /> )}
        </>
      )}
      <Footer />
    </div>
  );
};

const App = () => ( <ErrorBoundary><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} /><AppContent /></ErrorBoundary> );
export default App;