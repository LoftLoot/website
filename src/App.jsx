import React, { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate, Link, useSearchParams } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { X, ChevronDown, ArrowUp, Search } from 'lucide-react';

import { 
    ITEMS_PER_PAGE, FILTER_COLORS, TYPE_CONFIG, ORGANIZATION_SCHEMA, 
    SORT_STRATEGIES, SORT_OPTIONS, processProductData, slugify,
    COLLECTION_DESCRIPTIONS 
} from './data';
import { useSearchIndex } from './hooks/useSearchIndex';

// Components
import Header from './components/Header';
import Hero from './components/Hero'; 
import Footer from './components/Footer'; 
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import About from './components/About';

// Data
import rawProductsData from './products.json'; 

// --- Helpers ---
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

// --- FILTER COMPONENTS ---
const FilterGroup = React.memo(({ title, options, selected, onChange, available, color, hasMounted }) => (
    <div className="space-y-2">
        <h3 className="font-bold text-[#514d46] text-xs md:text-sm uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>{title}
        </h3>
        <div className="flex flex-col gap-1.5">
            {['All', ...options].map(opt => {
                const isAvailable = opt === 'All' || available.includes(opt);
                return (
                    <button 
                        key={opt} 
                        disabled={!isAvailable} 
                        onClick={() => onChange(opt)} 
                        className={`text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold ${selected === opt ? "bg-[#eef5fc] text-[#487ec8] shadow-inner ring-2 ring-[#eef5fc]" : isAvailable ? `text-[#514d46]/60 hover:bg-white hover:text-[#487ec8] hover:shadow-sm active:scale-95 ${hasMounted ? 'transition-colors' : ''}` : "text-[#514d46]/20 cursor-default"}`}
                    >
                        {title === 'Type' && TYPE_CONFIG[opt] ? TYPE_CONFIG[opt].plural : opt}
                    </button>
                );
            })}
        </div>
    </div>
));

const FilterSection = React.memo(({ collections, decades, types, selectedCollection, selectedDecade, selectedType, priceRange, minPrice, maxPrice, availableCollections, availableDecades, availableTypes, showInStockOnly, onCollectionChange, onDecadeChange, onTypeChange, onPriceChange, onStockChange, hasMounted }) => {
    const [localRange, setLocalRange] = useState(priceRange);
    const isDisabled = minPrice === maxPrice;
    
    const sliderMax = Math.ceil(maxPrice);
    const sliderMin = Math.floor(minPrice);

    useEffect(() => { setLocalRange(priceRange); }, [priceRange]);

    const handleMinChange = (e) => setLocalRange([Math.min(Number(e.target.value), localRange[1] - 1), localRange[1]]);
    const handleMaxChange = (e) => setLocalRange([localRange[0], Math.max(Number(e.target.value), localRange[0] + 1)]);
    const commitRange = () => onPriceChange(localRange);
    
    const getPercent = (v) => isDisabled ? (v === sliderMin ? 100 : 0) : Math.max(0, Math.min(100, Math.round(((v - sliderMin) / (sliderMax - sliderMin)) * 100)));
    const thumbClasses = "absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#d99875] [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing";

    return (
        <div className="flex flex-col gap-8">
            <div className="space-y-2">
                <h3 className="font-bold text-[#514d46] text-xs md:text-sm uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#487ec8]"></span>Availability
                </h3>
                <div className="flex flex-col gap-1.5">
                     <button onClick={() => onStockChange(false)} className={`text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold ${!showInStockOnly ? "bg-[#eef5fc] text-[#487ec8] shadow-inner ring-2 ring-[#eef5fc]" : `text-[#514d46]/60 hover:bg-white hover:text-[#487ec8] hover:shadow-sm active:scale-95 ${hasMounted ? 'transition-colors' : ''}`}`}>Show All</button>
                     <button onClick={() => onStockChange(true)} className={`text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold ${showInStockOnly ? "bg-[#eef5fc] text-[#487ec8] shadow-inner ring-2 ring-[#eef5fc]" : `text-[#514d46]/60 hover:bg-white hover:text-[#487ec8] hover:shadow-sm active:scale-95 ${hasMounted ? 'transition-colors' : ''}`}`}>In Stock</button>
                </div>
            </div>

            <FilterGroup title="Era" options={decades} selected={selectedDecade} onChange={onDecadeChange} available={availableDecades} color={FILTER_COLORS.Era} hasMounted={hasMounted} />
            <FilterGroup title="Collection" options={collections} selected={selectedCollection} onChange={onCollectionChange} available={availableCollections} color={FILTER_COLORS.Collection} hasMounted={hasMounted} />
            <FilterGroup title="Product Type" options={types} selected={selectedType} onChange={onTypeChange} available={availableTypes} color={FILTER_COLORS.Type} hasMounted={hasMounted} />
            
            <div className="space-y-4">
                <h3 className="font-bold text-[#514d46] text-xs md:text-sm uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#d99875]"></span>Price Range
                </h3>
                <div className="px-2 py-2">
                    <div className="flex justify-between text-xs md:text-sm text-[#514d46]/60 font-bold mb-2 font-mono"><span>£{isDisabled ? 0 : localRange[0]}</span><span>£{localRange[1]}</span></div>
                    <div className={`relative w-full h-6`}>
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-2 bg-[#E0E8F0] rounded-lg pointer-events-none"></div>
                        <div className={`absolute top-1/2 -translate-y-1/2 h-2 rounded-lg z-10 pointer-events-none ${hasMounted ? 'transition-all duration-100 ease-out' : ''} ${isDisabled ? 'bg-slate-300' : 'bg-[#d99875]'}`} style={{ left: isDisabled ? '0%' : `${getPercent(localRange[0])}%`, width: isDisabled ? '100%' : `${getPercent(localRange[1]) - getPercent(localRange[0])}%` }}></div>
                        {!isDisabled && (
                            <>
                                <input type="range" step={1} min={sliderMin} max={sliderMax} value={localRange[0]} onChange={handleMinChange} onMouseUp={commitRange} onTouchEnd={commitRange} className={`${thumbClasses} z-20`} />
                                <input type="range" step={1} min={sliderMin} max={sliderMax} value={localRange[1]} onChange={handleMaxChange} onMouseUp={commitRange} onTouchEnd={commitRange} className={`${thumbClasses} z-30`} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- PRODUCT ROUTE ---
const ProductRoute = ({ appData }) => {
    const { collectionSlug, productSlug } = useParams();
    const navigate = useNavigate();
    const fullSlug = `${collectionSlug}/${productSlug}`;
    const product = appData?.slugMap?.get(fullSlug);

    if (appData && !product) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                 <div className="w-24 h-24 bg-[#f4e799] rounded-full flex items-center justify-center mb-6 text-[#d35153] shadow-inner"><Search size={40} strokeWidth={3} /></div>
                 <h1 className="text-[#514d46] font-black text-3xl md:text-4xl mb-4" style={{ fontFamily: '"Jua", sans-serif' }}>Item Not Found</h1>
                 <p className="text-[#514d46]/70 max-w-md mb-8 font-medium">This item seems to have gotten lost in the move. It may have been sold or removed from the archive.</p>
                 <button onClick={() => navigate('/')} className="bg-[#487ec8] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-[#3a66a3] active:scale-95 transition-all">Return to Catalogue</button>
            </div>
        );
    }

    if (!product) return null;

    return (
        <ProductDetail 
            product={product} 
            productMap={appData.productMap} 
            onClose={() => navigate(`/${collectionSlug}/`)}
            onShopAll={() => navigate('/')}
            onCategoryClick={(c) => navigate(`/${slugify(c)}/`)}
            onDecadeClick={(d) => navigate(`/?decade=${encodeURIComponent(d)}`)}
            onOpen={(id) => {
                const p = appData.productMap.get(id);
                if(p) navigate(`/${p.fullSlug}/`);
            }}
        />
    );
};

// --- SHOP VIEW ---
const ShopView = ({ 
    appData, visibleProducts, filteredCount,
    selectedCollection, selectedDecade, selectedType, priceRange, showInStockOnly,
    sortOption, setSortOption, setPriceRange, setShowInStockOnly, 
    onCollectionChange, onDecadeChange, onTypeChange, onClearFilters,
    available, hasMounted, committedQuery, onLoadMore, visibleCount 
}) => {
    const [isSortOpen, setIsSortOpen] = useState(false);
    const sortRef = useRef(null);
    const topSectionRef = useRef(null);
    const location = useLocation(); 

    const canonicalUrl = `https://loftloot.co.uk${location.pathname === '/' ? '' : location.pathname}`;

    useEffect(() => {
        if(window.innerWidth >= 1024 && topSectionRef.current && (committedQuery || selectedCollection !== 'All')) {
            const container = document.getElementById('app-scroll-container');
            const top = topSectionRef.current.offsetTop - 80;
            if (container && container.scrollTop > top) {
                container.scrollTo({ top, behavior: 'smooth' });
            }
        }
    }, [committedQuery, selectedCollection]);

    useEffect(() => {
        if (!isSortOpen) return;
        const handleClickOutside = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSortOpen]);

    const dynamicH1 = useMemo(() => {
        if (committedQuery) return `'${committedQuery}'`;
        const parts = [];
        let isVintage = true;
        if (selectedDecade !== 'All' && selectedDecade !== 'Unknown') {
            parts.push(selectedDecade.startsWith('19') ? selectedDecade.substring(2) : selectedDecade);
            isVintage = false;
        }
        if (isVintage) parts.push("Vintage");
        if (selectedCollection !== 'All') parts.push(selectedCollection);
        if (selectedType !== 'All') parts.push(TYPE_CONFIG[selectedType] ? TYPE_CONFIG[selectedType].plural : selectedType);
        else parts.push("Toys");
        return parts.join(" ");
    }, [selectedDecade, selectedCollection, selectedType, committedQuery]);

    const metaDescription = useMemo(() => {
        if (selectedCollection !== 'All' && COLLECTION_DESCRIPTIONS[selectedCollection]) {
            return COLLECTION_DESCRIPTIONS[selectedCollection];
        }
        return `Browse our collection of ${dynamicH1}. Authentic childhood collectibles looking for a new home.`;
    }, [selectedCollection, dynamicH1]);

    return (
        <>
            <Helmet>
                <title>{dynamicH1} | Loft Loot</title>
                <meta name="description" content={metaDescription} />
                <link rel="canonical" href={canonicalUrl} />
            </Helmet>

            <Hero />
            <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full pb-12 mb-20">
                <div className="flex flex-col lg:flex-row gap-8" ref={topSectionRef}>
                    <aside className={`lg:w-64 flex-shrink-0 hidden lg:block lg:pt-2`}>
                        <FilterSection 
                            collections={appData.collections} decades={appData.decades} types={appData.types} 
                            selectedCollection={selectedCollection} selectedDecade={selectedDecade} selectedType={selectedType} 
                            priceRange={priceRange} minPrice={appData.minPrice} maxPrice={appData.maxPrice} 
                            availableCollections={available.collections} availableDecades={available.decades} availableTypes={available.types} 
                            showInStockOnly={showInStockOnly} 
                            onCollectionChange={onCollectionChange} onDecadeChange={onDecadeChange} onTypeChange={onTypeChange} 
                            onPriceChange={setPriceRange} onStockChange={setShowInStockOnly} onClearFilters={onClearFilters} 
                            hasMounted={hasMounted} 
                        />
                    </aside>

                    <div className="flex-1 min-h-[500px]">
                        {/* H1 and product grid omitted here for brevity, but should include full JSX from your original App.jsx */}
                    </div>
                </div>
            </main>
        </>
    );
};

// --- APP CONTAINER ---
const isServer = typeof window === 'undefined';

export const AppContent = () => {
    // All logic from previous AppContent including state, hooks, deferred values, search, scroll, etc.
    // Returns JSX with Header, Routes, Footer, scroll button
};

export const App = () => ( 
    <HelmetProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} />
        <AppContent />
    </HelmetProvider>
);

export default App;
