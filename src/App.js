// src/App.js
import React, { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { X, ChevronDown, ArrowUp, Search } from 'lucide-react';

import { 
    ITEMS_PER_PAGE, FILTER_COLORS, TYPE_CONFIG, ORGANIZATION_SCHEMA, 
    SORT_STRATEGIES, SORT_OPTIONS, processProductData 
} from './data';
import { useSearchIndex } from './hooks/useSearchIndex';

// Components
import Header from './components/Header';
import Hero from './components/Hero'; 
import Footer from './components/Footer'; 
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import About from './components/About';

// --- STYLES ---

const GlobalStyles = () => (
    <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&family=Outfit:wght@300;400;500;700;900&display=swap');
        
        * { box-sizing: border-box; }
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Outfit', sans-serif;
            -webkit-font-smoothing: antialiased; 
            -moz-osx-font-smoothing: grayscale; 
            background-color: #fffbf0;
            color: #514d46;
        }

        .font-jua { font-family: 'Jua', sans-serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }

        ::selection { background-color: #f4e799; color: #514d46; }
        
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #f2e9d9; }
        ::-webkit-scrollbar-thumb { background: #d35153; border-radius: 5px; border: 2px solid #f2e9d9; }
        ::-webkit-scrollbar-thumb:hover { background: #b94547; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* ANIMATIONS */
        @keyframes deal-bottom { 0% { transform: translateY(100px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes tear-off { 0% { transform: rotate(0deg); } 20% { transform: rotate(-5deg); } 40% { transform: rotate(5deg); } 60% { transform: rotate(-2deg); } 100% { transform: translateY(150%) rotate(10deg); opacity: 0; } }
        @keyframes stamp { 0% { opacity: 0; transform: scale(2) rotate(-12deg); } 40% { opacity: 1; transform: scale(0.9) rotate(-12deg); } 70% { transform: scale(1.1) rotate(-12deg); } 100% { opacity: 1; transform: scale(1) rotate(-12deg); } }
        @keyframes puff { 0% { opacity: 1; transform: translate(0,0) scale(1); } 100% { opacity: 0; transform: translate(var(--x),var(--y)) scale(0); } }
        
        /* TICKER ANIMATION */
        @keyframes marquee { 
            0% { transform: translate3d(0, 0, 0); } 
            100% { transform: translate3d(-100%, 0, 0); } 
        }
        
        .animate-marquee-slow { 
            animation: marquee 40s linear infinite; 
            will-change: transform;
        }
        
        /* Pause on hover to prevent snapping */
        .ticker-wrapper:hover .animate-marquee-slow { 
            animation-play-state: paused; 
        }
        
        .animate-deal-bottom { animation: deal-bottom 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-tear-off { animation: tear-off 0.8s ease-in forwards; }
        .animate-stamp { animation: stamp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; animation-delay: 0.3s; }
        .animate-dust { animation: puff 0.6s ease-out forwards; opacity: 0; animation-delay: 0.4s; }
        
        .dust-1 { --x: -60px; --y: -60px; top: 0; left: 0; }
        .dust-2 { --x: 60px; --y: -60px; top: 0; right: 0; }
        .dust-3 { --x: -60px; --y: 60px; bottom: 0; left: 0; }
        .dust-4 { --x: 60px; --y: 60px; bottom: 0; right: 0; }
        .dust-5 { --x: 0; --y: -80px; top: -10px; left: 50%; transform: translateX(-50%); }
        .dust-6 { --x: 0; --y: 80px; bottom: -10px; left: 50%; transform: translateX(-50%); }
        .dust-7 { --x: -80px; --y: 0; top: 50%; left: -10px; transform: translateY(-50%); }
        .dust-8 { --x: 80px; --y: 0; top: 50%; right: -10px; transform: translateY(-50%); }

        input[type=range]::-webkit-slider-thumb { pointer-events: auto; }
        input[type=range]::-moz-range-thumb { pointer-events: auto; }
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

const FilterGroup = React.memo(({ title, options, selected, onChange, available, color }) => (
    <div className="space-y-3">
        <h3 className="font-bold text-[#514d46] text-sm uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>{title}
        </h3>
        <div className="flex flex-col gap-2">
            {['All', ...options].map(opt => {
                const isAvailable = opt === 'All' || available.includes(opt);
                return (
                    <button 
                        key={opt} 
                        disabled={!isAvailable} 
                        onClick={() => onChange(opt)} 
                        className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ease-out ${
                            selected === opt 
                            ? "bg-[#eef5fc] text-[#487ec8] shadow-inner translate-x-1 ring-2 ring-[#eef5fc]" 
                            : isAvailable 
                                ? "text-[#514d46]/60 hover:bg-white hover:text-[#487ec8] hover:shadow-sm hover:translate-x-1 active:scale-95" 
                                : "text-[#514d46]/20 cursor-default"
                        }`}
                    >
                        {title === 'Type' && TYPE_CONFIG[opt] ? TYPE_CONFIG[opt].plural : opt}
                    </button>
                );
            })}
        </div>
    </div>
));

const FilterSection = React.memo(({ collections, decades, types, selectedCollection, selectedDecade, selectedType, priceRange, minPrice, maxPrice, availableCollections, availableDecades, availableTypes, showInStockOnly, onCollectionChange, onDecadeChange, onTypeChange, onPriceChange, onStockChange, onClearFilters }) => {
    const [localRange, setLocalRange] = useState(priceRange);
    const isDisabled = minPrice === maxPrice;
    
    useEffect(() => { setLocalRange(priceRange); }, [priceRange]);

    const handleMinChange = (e) => setLocalRange([Math.min(Number(e.target.value), localRange[1] - 1), localRange[1]]);
    const handleMaxChange = (e) => setLocalRange([localRange[0], Math.max(Number(e.target.value), localRange[0] + 1)]);
    const commitRange = () => onPriceChange(localRange);
    const getPercent = (v) => isDisabled ? (v === minPrice ? 100 : 0) : Math.max(0, Math.min(100, Math.round(((v - minPrice) / (maxPrice - minPrice)) * 100)));

    const thumbClasses = "absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#d99875] [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing";

    return (
        <div className="flex flex-col gap-8">
            <div className="space-y-3">
                <h3 className="font-bold text-[#514d46] text-sm uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#487ec8]"></div>Availability
                </h3>
                <div className="flex flex-col gap-2">
                     <button onClick={() => onStockChange(false)} className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ease-out ${!showInStockOnly ? "bg-[#eef5fc] text-[#487ec8] shadow-inner translate-x-1 ring-2 ring-[#eef5fc]" : "text-[#514d46]/60 hover:bg-white hover:text-[#487ec8] hover:shadow-sm hover:translate-x-1 active:scale-95"}`}>Show All</button>
                     <button onClick={() => onStockChange(true)} className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ease-out ${showInStockOnly ? "bg-[#eef5fc] text-[#487ec8] shadow-inner translate-x-1 ring-2 ring-[#eef5fc]" : "text-[#514d46]/60 hover:bg-white hover:text-[#487ec8] hover:shadow-sm hover:translate-x-1 active:scale-95"}`}>In Stock</button>
                </div>
            </div>

            <FilterGroup title="Era" options={decades} selected={selectedDecade} onChange={onDecadeChange} available={availableDecades} color={FILTER_COLORS.Era} />
            <FilterGroup title="Collection" options={collections} selected={selectedCollection} onChange={onCollectionChange} available={availableCollections} color={FILTER_COLORS.Collection} />
            <FilterGroup title="Product Type" options={types} selected={selectedType} onChange={onTypeChange} available={availableTypes} color={FILTER_COLORS.Type} />
            
            <div className="space-y-4">
                <h3 className="font-bold text-[#514d46] text-sm uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#d99875]"></div>Price Range
                </h3>
                <div className="px-2 py-2">
                    <div className="flex justify-between text-xs text-[#514d46]/60 font-bold mb-2 font-mono"><span>£{isDisabled ? 0 : localRange[0]}</span><span>£{localRange[1]}</span></div>
                    <div className={`relative w-full h-6`}>
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-2 bg-[#E0E8F0] rounded-lg pointer-events-none"></div>
                        <div className={`absolute top-1/2 -translate-y-1/2 h-2 rounded-lg z-10 pointer-events-none transition-all duration-100 ease-out ${isDisabled ? 'bg-slate-300' : 'bg-[#d99875]'}`} style={{ left: isDisabled ? '0%' : `${getPercent(localRange[0])}%`, width: isDisabled ? '100%' : `${getPercent(localRange[1]) - getPercent(localRange[0])}%` }}></div>
                        {!isDisabled && (
                            <>
                                <input type="range" step={1} min={minPrice} max={maxPrice} value={localRange[0]} onChange={handleMinChange} onMouseUp={commitRange} onTouchEnd={commitRange} className={`${thumbClasses} z-20`} />
                                <input type="range" step={1} min={minPrice} max={maxPrice} value={localRange[1]} onChange={handleMaxChange} onMouseUp={commitRange} onTouchEnd={commitRange} className={`${thumbClasses} z-30`} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- MAIN APP CONTENT ---

const AppContent = () => {
  const [urlParams] = useState(() => new URLSearchParams(window.location.search));
  
  // --- DATA FETCHING STATE ---
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/products.json`)
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

  // --- STATE ---
  const [searchQuery, setSearchQuery] = useState(() => urlParams.get('q') || ""); 
  const [committedQuery, setCommittedQuery] = useState(() => urlParams.get('q') || ""); 
  const [isTyping, setIsTyping] = useState(false);
  
  const [selectedCollection, setSelectedCollection] = useState(() => urlParams.get('collection') || "All");
  const [selectedDecade, setSelectedDecade] = useState(() => urlParams.get('decade') || "All");
  const [selectedType, setSelectedType] = useState(() => urlParams.get('type') || "All");
  const [sortOption, setSortOption] = useState(() => urlParams.get('sort') || "latest");
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]); 
  
  const [viewProduct, setViewProduct] = useState(null);
  const [currentView, setCurrentView] = useState('shop'); 
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const lastScrollPos = useRef(0);
  const topSectionRef = useRef(null); 
  const sortRef = useRef(null);

  useEffect(() => {
      if (!appData) return;
      setPriceRange([appData.minPrice, appData.maxPrice]);
      const pid = urlParams.get('id');
      if (pid) {
          const found = appData.productMap.get(parseInt(pid));
          if (found) setViewProduct(found);
      }
  }, [appData, urlParams]);

  const { autocomplete, search: performSearch } = useSearchIndex(appData ? appData.products : []);
  
  const deferredSearch = useDeferredValue(searchQuery);
  const suggestions = useMemo(() => {
      if (isTyping && appData) return autocomplete(deferredSearch, showInStockOnly);
      return { filters: [], products: [], totalProducts: 0 };
  }, [deferredSearch, isTyping, showInStockOnly, autocomplete, appData]);

  // Actions
  const openProduct = useCallback((id) => { 
      if (!appData) return;
      lastScrollPos.current = window.scrollY; 
      const prod = appData.productMap.get(id);
      setViewProduct(prod); 
  }, [appData]);
  
  const closeProduct = useCallback(() => setViewProduct(null), []);

  const resetView = useCallback(() => { 
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
  }, [appData, closeProduct]);

  const handleCommit = useCallback((action) => {
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
  }, [searchQuery, appData, openProduct]);

  const handleSearchUpdate = (newVal) => { setSearchQuery(newVal); setIsTyping(true); };
  const scrollToTopSmart = () => window.scrollTo({ top: topSectionRef.current && window.scrollY > topSectionRef.current.getBoundingClientRect().top + window.scrollY - 80 + 10 ? topSectionRef.current.getBoundingClientRect().top + window.scrollY - 80 : 0, behavior: "smooth" });

  useEffect(() => {
    const handleScroll = throttle(() => topSectionRef.current && setShowScrollButton(window.scrollY > 400), 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const filteredProducts = useDeferredValue(useMemo(() => {
    if (!appData) return [];
    const results = performSearch(committedQuery, { collection: selectedCollection, decade: selectedDecade, type: selectedType, priceRange, showInStockOnly });
    const sortFn = SORT_STRATEGIES[sortOption];
    if (sortFn) results.sort((a, b) => ((a.stock > 0) !== (b.stock > 0)) ? (a.stock > 0 ? -1 : 1) : sortFn(a, b));
    return results;
  }, [committedQuery, selectedCollection, selectedDecade, selectedType, priceRange, sortOption, showInStockOnly, performSearch, appData]));

  useEffect(() => setVisibleCount(ITEMS_PER_PAGE), [selectedCollection, selectedDecade, selectedType, priceRange, committedQuery, sortOption, showInStockOnly]);
  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

  useEffect(() => {
      const p = new URLSearchParams();
      if (committedQuery) p.set('q', committedQuery); 
      if (selectedCollection !== 'All') p.set('collection', selectedCollection); 
      if (selectedDecade !== 'All') p.set('decade', selectedDecade); 
      if (selectedType !== 'All') p.set('type', selectedType); 
      if (sortOption !== 'latest') p.set('sort', sortOption); 
      if (viewProduct) p.set('id', viewProduct.id);
      
      const url = `${window.location.pathname}${p.toString() ? '?' + p.toString() : ''}`;
      const currentParams = new URLSearchParams(window.location.search);
      if (window.location.search !== `?${p.toString()}`) {
          if (p.get('id') && p.get('id') !== currentParams.get('id')) {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fffbf0] text-[#514d46] font-bold">Loading Loot...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#fffbf0] text-[#d35153] font-bold">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#fffbf0] text-[#514d46] selection:bg-pink-200 flex flex-col" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <GlobalStyles />
      <Header 
        currentView={currentView} 
        isProductView={!!viewProduct} 
        onCatalogueClick={() => { if(viewProduct) closeProduct(); setCurrentView('shop'); }} 
        onAboutClick={() => { if(viewProduct) closeProduct(); setCurrentView('about'); }} 
        onHomeClick={resetView} 
        search={searchQuery} 
        onSearchUpdate={handleSearchUpdate} 
        onCommit={handleCommit} 
        suggestions={suggestions} 
        selectedCollection={selectedCollection} 
        collections={appData.collections} 
        decades={appData.decades} 
      />
      
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
                        {/* SIDEBAR: Visible from 'lg' (1024px) and up */}
                        <aside className={`lg:w-64 flex-shrink-0 hidden lg:block lg:pt-2`}>
                            <FilterSection collections={appData.collections} decades={appData.decades} types={appData.types} selectedCollection={selectedCollection} selectedDecade={selectedDecade} selectedType={selectedType} priceRange={priceRange} minPrice={appData.minPrice} maxPrice={appData.maxPrice} availableCollections={available.collections} availableDecades={available.decades} availableTypes={available.types} showInStockOnly={showInStockOnly} onCollectionChange={setSelectedCollection} onDecadeChange={setSelectedDecade} onTypeChange={setSelectedType} onPriceChange={setPriceRange} onStockChange={setShowInStockOnly} onClearFilters={resetView} />
                        </aside>
                        <div className="flex-1 min-h-[500px]">
                            {/* H1: Visible from 'lg' and up */}
                            <div className="hidden lg:block -mt-4 mb-2"><h1 className="text-[#514d46] font-black text-3xl md:text-4xl leading-none flex items-center gap-2" style={{ fontFamily: '"Jua", sans-serif' }}>{dynamicH1} {committedQuery && <button onClick={() => { setCommittedQuery(""); setSearchQuery(""); }} className="bg-[#514d46]/20 text-white rounded-full p-0.5 hover:bg-[#514d46]/40 transition-colors"><X size={16} strokeWidth={3}/></button>}</h1></div>
                            
                            {/* H1: Visible on Mobile/Tablet only (< 1024px) */}
                            <div className="lg:hidden -mt-2 mb-2"><h1 className="text-[#514d46] font-black text-3xl leading-none flex items-center gap-2" style={{ fontFamily: '"Jua", sans-serif' }}>{dynamicH1} {committedQuery && <button onClick={() => { setCommittedQuery(""); setSearchQuery(""); }} className="bg-[#514d46]/20 text-white rounded-full p-0.5 hover:bg-[#514d46]/40 transition-colors"><X size={16} strokeWidth={3}/></button>}</h1></div>
                            
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-20">
                                <div className="flex flex-wrap items-center gap-4 min-h-[2rem]">
                                    <h3 className="text-[#514d46]/60 font-medium text-sm">Showing <span className="text-[#514d46] font-bold">{filteredProducts.length}</span> results</h3>
                                    
                                    {/* ACTIVE CHIPS */}
                                    <div className="flex items-center gap-2">
                                        {selectedCollection !== 'All' && <button onClick={() => setSelectedCollection('All')} style={{ borderColor: FILTER_COLORS.Collection, color: FILTER_COLORS.Collection }} className="flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm group active:scale-95 hover:brightness-110">{selectedCollection} <X size={14} /></button>}
                                        {selectedDecade !== 'All' && <button onClick={() => setSelectedDecade('All')} style={{ borderColor: FILTER_COLORS.Era, color: FILTER_COLORS.Era }} className={`flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs font-bold tracking-wider transition-all shadow-sm group active:scale-95 hover:brightness-110 ${/^\d/.test(selectedDecade) ? '' : 'uppercase'}`}>{selectedDecade} <X size={14} /></button>}
                                        {selectedType !== 'All' && <button onClick={() => setSelectedType('All')} style={{ borderColor: FILTER_COLORS.Type, color: FILTER_COLORS.Type }} className="flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm group active:scale-95 hover:brightness-110">{selectedType} <X size={14} /></button>}
                                        {(priceRange[0] !== appData.minPrice || priceRange[1] !== appData.maxPrice) && <button onClick={() => setPriceRange([appData.minPrice, appData.maxPrice])} style={{ borderColor: FILTER_COLORS.Price, color: FILTER_COLORS.Price }} className="flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm group active:scale-95 hover:brightness-110">£{priceRange[0]} - £{priceRange[1]} <X size={14} /></button>}
                                        {showInStockOnly && <button onClick={() => setShowInStockOnly(false)} className="flex items-center gap-1 bg-white border-2 border-[#E0E8F0] px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#514d46] hover:border-[#487ec8] hover:text-[#487ec8] transition-all shadow-sm group active:scale-95">In Stock <X size={14} /></button>}
                                    </div>
                                </div>

                                <div className="relative" ref={sortRef}>
                                    <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 text-sm focus:outline-none"><span className="text-[#514d46]/60 font-bold">Sort:&nbsp;</span><span className="font-bold text-[#514d46]">{SORT_OPTIONS.find(opt => opt.value === sortOption)?.label || "Latest"}</span><ChevronDown size={16} /></button>
                                    {isSortOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-[#514d46]/20 overflow-hidden z-50 bg-white flex flex-col">
                                            {SORT_OPTIONS.map((opt) => (<button key={opt.value} onClick={() => { setSortOption(opt.value); setIsSortOpen(false); }} className={`w-full text-left px-4 py-3 text-base font-bold transition-colors hover:bg-[#f4f4f5] ${sortOption === opt.value ? 'text-[#d35153] bg-[#f4f4f5]' : 'text-[#514d46]'}`}>{opt.label}</button>))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {visibleProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 relative z-10">{visibleProducts.map((product, index) => (<ProductCard key={product.id} product={product} index={index} onOpen={openProduct} priority={index < 6} animationDelay={index >= ITEMS_PER_PAGE ? `${(index % ITEMS_PER_PAGE) * 0.03}s` : undefined} />))}</div>
                                {/* RESULT COUNT FOOTER */}
                                <div className="mt-12 text-center">
                                    {visibleCount < filteredProducts.length ? (
                                        <>
                                            {/* Removed transition-all and active:scale-95 to fix choppy effect */}
                                            <button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)} className="px-8 py-3 bg-white border-2 border-[#E0E8F0] text-[#514d46] font-bold rounded-xl hover:border-[#487ec8]">Load More Loot</button>
                                            <p className="text-xs text-[#514d46]/40 mt-3 font-medium">Showing {visibleProducts.length} of {filteredProducts.length} items</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-[#514d46]/40 mt-3 font-medium">Showing {filteredProducts.length} of {filteredProducts.length} items</p>
                                    )}
                                </div>
                            </>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#E0E8F0]"><div className="w-16 h-16 bg-[#E0E8F0] rounded-full flex items-center justify-center mx-auto mb-4 text-[#487ec8]"><Search size={32} /></div><h3 className="text-[#514d46] font-bold text-lg mb-1">No loot found :(</h3><button onClick={resetView} className="mt-4 text-[#d35153] font-bold text-sm hover:underline">Clear all filters</button></div>
                            )}
                        </div>
                    </div>
                </main>
            </>
          ) : ( <About /> )}
        </>
      )}
      <Footer />
    </div>
  );
};

const App = () => ( <ErrorBoundary><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} /><AppContent /></ErrorBoundary> );
export default App;
