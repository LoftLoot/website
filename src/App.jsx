// src/App.jsx
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

// --- 1. FILTER COMPONENTS ---

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

// --- 2. ROUTE WRAPPERS ---

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

// --- 3. SHOP VIEW (Presentation) ---

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
                        <div className="hidden lg:block -mt-4 mb-2"><h1 className="text-[#514d46] font-black text-2xl md:text-3xl lg:text-4xl leading-none flex items-center gap-2" style={{ fontFamily: '"Jua", sans-serif' }}>{dynamicH1} {committedQuery && <button onClick={onClearFilters} className="bg-[#514d46]/20 text-white rounded-full p-0.5 hover:bg-[#514d46]/40 transition-colors"><X size={16} strokeWidth={3}/></button>}</h1></div>
                        <div className="lg:hidden -mt-2 mb-2"><h1 className="text-[#514d46] font-black text-2xl md:text-3xl leading-none flex items-center gap-2" style={{ fontFamily: '"Jua", sans-serif' }}>{dynamicH1} {committedQuery && <button onClick={onClearFilters} className="bg-[#514d46]/20 text-white rounded-full p-0.5 hover:bg-[#514d46]/40 transition-colors"><X size={16} strokeWidth={3}/></button>}</h1></div>
                        
                        <div className="mb-6 flex flex-row items-center justify-between gap-4 relative z-20">
                            <div className="flex flex-wrap items-center gap-4 min-h-[2rem]">
                                <h3 className="text-[#514d46]/60 font-medium text-xs md:text-sm">Showing <span className="text-[#514d46] font-bold">{filteredCount}</span> results</h3>
                                <div className="flex items-center gap-2">
                                    {selectedCollection !== 'All' && (<button onClick={() => onCollectionChange('All')} style={{ borderColor: FILTER_COLORS.Collection, color: FILTER_COLORS.Collection }} className={`flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider ${hasMounted ? 'transition-all' : ''} shadow-sm group active:scale-95 hover:!border-[#514d46]/20 hover:!text-[#514d46]/40`}>{selectedCollection} <X size={14} className="group-hover:text-[#d35153] transition-colors" /></button>)}
                                    {selectedDecade !== 'All' && <button onClick={() => onDecadeChange('All')} style={{ borderColor: FILTER_COLORS.Era, color: FILTER_COLORS.Era }} className={`flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs md:text-sm font-bold tracking-wider ${hasMounted ? 'transition-all' : ''} shadow-sm group active:scale-95 hover:!border-[#514d46]/20 hover:!text-[#514d46]/40`}>{selectedDecade} <X size={14} className="group-hover:text-[#d35153] transition-colors" /></button>}
                                    {selectedType !== 'All' && <button onClick={() => onTypeChange('All')} style={{ borderColor: FILTER_COLORS.Type, color: FILTER_COLORS.Type }} className={`flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider ${hasMounted ? 'transition-all' : ''} shadow-sm group active:scale-95 hover:!border-[#514d46]/20 hover:!text-[#514d46]/40`}>{selectedType} <X size={14} className="group-hover:text-[#d35153] transition-colors" /></button>}
                                    {(priceRange[0] > appData.minPrice || priceRange[1] < appData.maxPrice) && <button onClick={() => setPriceRange([appData.minPrice, appData.maxPrice])} style={{ borderColor: FILTER_COLORS.Price, color: FILTER_COLORS.Price }} className={`flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider ${hasMounted ? 'transition-all' : ''} shadow-sm group active:scale-95 hover:!border-[#514d46]/20 hover:!text-[#514d46]/40`}>£{priceRange[0]} - £{priceRange[1]} <X size={14} className="group-hover:text-[#d35153] transition-colors" /></button>}
                                    {showInStockOnly && <button onClick={() => setShowInStockOnly(false)} style={{ borderColor: '#487ec8', color: '#487ec8' }} className={`flex items-center gap-1 bg-white border-2 px-2 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider ${hasMounted ? 'transition-all' : ''} shadow-sm group active:scale-95 hover:!border-[#514d46]/20 hover:!text-[#514d46]/40`}>In Stock <X size={14} className="group-hover:text-[#d35153] transition-colors" /></button>}
                                </div>
                            </div>

                            <div className="relative" ref={sortRef}>
                                <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center gap-2 text-xs md:text-sm focus:outline-none"><span className="text-[#514d46]/60 font-bold">Sort:&nbsp;</span><span className="font-bold text-[#514d46]">{SORT_OPTIONS.find(opt => opt.value === sortOption)?.label || "Latest"}</span><ChevronDown size={16} /></button>
                                {isSortOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border-2 border-[#514d46]/20 overflow-hidden z-50 bg-white flex flex-col">
                                        {SORT_OPTIONS.map((opt) => (<button key={opt.value} onClick={() => { setSortOption(opt.value); setIsSortOpen(false); }} className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors hover:bg-[#f4f4f5] ${sortOption === opt.value ? 'text-[#d35153] bg-[#f4f4f5]' : 'text-[#514d46]'}`}>{opt.label}</button>))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {visibleProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 relative z-10 mb-8">
                                    {visibleProducts.map((product, index) => (
                                        <ProductCard key={product.id} product={product} index={index} priority={index < 6} animationDelay={index >= ITEMS_PER_PAGE ? `${(index % ITEMS_PER_PAGE) * 0.03}s` : undefined} />
                                    ))}
                                </div>
                                <div className="flex flex-col items-center gap-4 pb-8 mt-8">
                                    {visibleCount < filteredCount ? (
                                        <>
                                            <button onClick={onLoadMore} className="mt-4 bg-[#487ec8] text-white px-12 py-3 rounded-xl font-bold hover:bg-[#3a66a3] transition-all active:scale-95">View More Loot</button>
                                            <span className="text-[#514d46]/60 font-medium text-xs md:text-sm">Viewing {visibleCount} of {filteredCount}</span>
                                        </>
                                    ) : (
                                        <span className="text-[#514d46]/60 font-medium text-xs md:text-sm">Viewing {filteredCount} of {filteredCount}</span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-[#E0E8F0]"><div className="w-16 h-16 bg-[#E0E8F0] rounded-full flex items-center justify-center mx-auto mb-4 text-[#487ec8]"><Search size={32} /></div><h3 className="text-[#514d46] font-bold text-lg mb-1">No loot found :(</h3><button onClick={onClearFilters} className="mt-4 text-[#d35153] font-bold text-sm hover:underline">Clear all filters</button></div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

// Export App WITHOUT the Router (we inject it from outside)
export const App = () => ( 
    <HelmetProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} />
        <AppContent />
    </HelmetProvider>
);

export default App;
