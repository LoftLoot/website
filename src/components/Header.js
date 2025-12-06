// src/components/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, ChevronRight, ArrowRight } from 'lucide-react';

// --- SUB-COMPONENTS ---

export const Logo = React.memo(({ className = "" }) => (
    <div className={`flex items-center ${className}`}>
        <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <h1 className="leading-none text-[#514d46] select-none flex items-baseline" style={{ fontFamily: '"Jua", sans-serif' }}>
            <span className="text-4xl">L</span><span className="text-3xl uppercase">oft</span>
            <span className="w-2"></span>
            <span className="text-4xl text-[#d35153]">L</span><span className="text-3xl text-[#d35153] uppercase">oot</span>
        </h1>
    </div>
));
Logo.displayName = 'Logo';

const HighlightedText = ({ text, highlight }) => {
    if (!highlight || !text) return <>{text}</>;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <>
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() 
                    ? <strong key={i} className="text-[#d35153] font-black">{part}</strong> 
                    : part
            )}
        </>
    );
};

// --- CHIPS (Mobile Only - Dynamic) ---
const QuickFilterChips = ({ onCommit, selectedCollection, collections = [], decades = [] }) => {
    const chips = ["All", "|", ...decades, "|", ...collections];

    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => setIsDragging(false);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div 
            ref={scrollRef}
            className="flex lg:hidden w-full overflow-x-auto no-scrollbar items-center gap-2 px-4 pb-3 select-none cursor-grab active:cursor-grabbing bg-[#fffbf0] border-b border-[#514d46]/5"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
            {chips.map((chip, idx) => {
                if (chip === "|") return <div key={`sep-${idx}`} className="h-5 w-px bg-[#514d46]/20 mx-1 shrink-0"></div>;
                
                const isActive = selectedCollection === chip; 
                
                return (
                    <button
                        key={chip}
                        onClick={() => { 
                            if (!isDragging) {
                                let type = 'filter';
                                let kind = 'Collection';
                                if (decades.includes(chip)) kind = 'Era';
                                if (chip === 'All') kind = 'Collection'; 
                                onCommit({ type, payload: { kind, value: chip } }); 
                            }
                        }}
                        className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-bold border transition-all shadow-sm ${
                            isActive 
                            ? "bg-[#487ec8] text-white border-[#487ec8] shadow-md ring-2 ring-[#487ec8]/20" 
                            : "bg-white text-[#514d46] border-[#E0E8F0] hover:border-[#487ec8] hover:text-[#487ec8]"
                        }`}
                    >
                        {chip}
                    </button>
                );
            })}
        </div>
    );
};

const SearchInput = React.memo(({ search, onSearchUpdate, onCommit, suggestions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    const filterCount = suggestions?.filters?.length || 0;
    const productCount = suggestions?.products?.length || 0;
    const hasMore = (suggestions?.totalProducts || 0) > productCount;
    const totalItems = filterCount + productCount + (hasMore ? 1 : 0);

    const handleKeyDown = (e) => {
        if (!isOpen && e.key !== 'Enter') return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(prev => (prev + 1) % totalItems); } 
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(prev => (prev - 1 + totalItems) % totalItems); } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex === -1) {
                 onCommit({ type: 'query', value: search });
            } else if (activeIndex < filterCount) {
                 onCommit({ type: 'filter', payload: suggestions.filters[activeIndex] });
            } else if (activeIndex < filterCount + productCount) {
                 onCommit({ type: 'product', payload: suggestions.products[activeIndex - filterCount] });
            } else {
                 onCommit({ type: 'query', value: search });
            }
            setIsOpen(false);
            inputRef.current?.blur();
        } else if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); }
    };

    const handleCommit = (type, payload) => { onCommit({ type, payload }); setIsOpen(false); };

    useEffect(() => {
        const handleClickOutside = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const hasResults = (suggestions?.filters?.length > 0 || suggestions?.products?.length > 0);
        if (search && search.length >= 2 && hasResults) setIsOpen(true); else setIsOpen(false);
        setActiveIndex(-1);
    }, [search, suggestions]);

    return (
        <div ref={containerRef} className="relative w-full h-full group z-[60]">
            <div className="flex w-full h-full">
                <div className="relative flex-1">
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search our loft..." 
                        value={search}
                        onChange={(e) => onSearchUpdate(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => { 
                            if(search && search.length >= 2) { 
                                const hasResults = (suggestions?.filters?.length > 0 || suggestions?.products?.length > 0); 
                                if (hasResults) setIsOpen(true); 
                                onSearchUpdate(search); 
                            } 
                        }}
                        className="w-full h-full bg-white text-[#514d46] py-2.5 pl-4 pr-10 font-bold placeholder:text-[#514d46]/40 focus:outline-none rounded-l-2xl border-2 border-r-0 border-[#514d46]/20 focus:border-[#d35153] focus:border-r-0 transition-colors"
                    />
                    {search && (
                        <button onClick={() => { onSearchUpdate(''); onCommit({ type: 'query', value: '' }); inputRef.current?.blur(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#514d46]/20 text-white rounded-full p-1 hover:bg-[#514d46]/40 transition-colors"><X size={14} strokeWidth={3} /></button>
                    )}
                </div>
                <button onClick={() => { onCommit({ type: 'query', value: search }); setIsOpen(false); }} className="bg-[#d35153] text-white px-5 flex items-center justify-center hover:bg-[#b94547] transition-colors cursor-pointer rounded-r-2xl border-2 border-[#d35153] border-l-0"><Search className="w-5 h-5" strokeWidth={3} /></button>
            </div>
            {isOpen && suggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-[#514d46]/20 overflow-hidden flex flex-col z-50">
                    {suggestions.filters?.length > 0 && (
                        <div className="flex flex-col border-b border-[#514d46]/10">
                            <div className="px-4 py-2 bg-[#e4e4e7] text-xs uppercase font-black tracking-widest text-[#514d46]/80 border-b border-[#514d46]/10">Filters</div>
                            {suggestions.filters.map((filter, idx) => (
                                <div key={`filter-${idx}`} onClick={() => handleCommit('filter', filter)} onMouseEnter={() => setActiveIndex(idx)} className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${activeIndex === idx ? 'bg-[#f4f4f5]' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#d35153] border border-[#514d46]/10 shadow-sm"><Filter size={14} strokeWidth={3} /></div>
                                        <span className="font-bold text-[#514d46] text-base"><HighlightedText text={filter.label} highlight={search} /></span>
                                    </div>
                                    <span className="text-xs font-bold text-[#514d46]/60 bg-white px-2 py-1 rounded-md border border-[#514d46]/10 shadow-sm">{filter.kind}</span>
                                </div>
                            ))}
                        </div>
                    )}
                     {suggestions.products?.length > 0 && (
                        <div className="flex flex-col flex-1 overflow-y-auto">
                            <div className="px-4 py-2 bg-[#e4e4e7] text-xs uppercase font-black tracking-widest text-[#514d46]/80 sticky top-0 border-b border-[#514d46]/10 shadow-sm z-20">Products</div>
                            {suggestions.products.map((prod, idx) => {
                                const globalIdx = idx + filterCount;
                                return (
                                    <div key={prod.id} onClick={() => handleCommit('product', prod)} onMouseEnter={() => setActiveIndex(globalIdx)} className={`px-4 py-3 flex items-center gap-4 cursor-pointer transition-colors ${activeIndex === globalIdx ? 'bg-[#f4f4f5]' : ''}`}>
                                        <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-white relative border border-[#514d46]/10 shadow-sm">
                                            <img src={prod.mainImage} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-[#514d46] text-base truncate"><HighlightedText text={prod.name} highlight={search} /></span>
                                            {prod.snippet ? (
                                                <span className="text-sm text-[#514d46]/70 italic truncate"><HighlightedText text={prod.snippet.text} highlight={search} /></span>
                                            ) : (
                                                <span className="text-sm text-[#514d46]/60 truncate">{prod.manufacturer} • {prod.releaseDate || 'Unknown'}</span>
                                            )}
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            {prod.stock < 1 && <span className="text-[10px] font-bold bg-white text-[#d35153] px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#d35153]/10 shadow-sm">Sold</span>}
                                            <ChevronRight size={16} className="text-[#514d46]/50" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {hasMore && (
                        <div onClick={() => { onCommit({ type: 'query', value: search }); setIsOpen(false); }} onMouseEnter={() => setActiveIndex(filterCount + productCount)} className={`p-3 text-center border-t border-[#514d46]/10 cursor-pointer ${activeIndex === filterCount + productCount ? 'bg-[#f4f4f5]' : ''}`}>
                            <span className="text-sm font-bold text-[#d35153] flex items-center justify-center gap-1">View {suggestions.totalProducts - suggestions.products.length} more results <ArrowRight size={12} strokeWidth={3} /></span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
SearchInput.displayName = 'SearchInput';

// --- MAIN HEADER COMPONENT ---

const Header = React.memo(({ currentView, isProductView, onCatalogueClick, onAboutClick, onHomeClick, search, onSearchUpdate, onCommit, suggestions, selectedCollection, collections, decades }) => (
  <div className="relative z-[60] flex flex-col bg-[#fffbf0]">
    <div className="bg-[#487ec8] text-white text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] py-2 overflow-hidden ticker-wrapper">
        <div className="flex overflow-hidden select-none gap-0">
            <div className="shrink-0 flex items-center justify-around animate-marquee-slow min-w-full">
                <span className="mx-10">Based in the United Kingdom</span>
                <span className="mx-10">Items posted Monday to Saturday</span>
                <span className="mx-10">Follow us on eBay and Etsy</span>
                <span className="mx-10">Based in the United Kingdom</span>
                <span className="mx-10">Items posted Monday to Saturday</span>
                <span className="mx-10">Follow us on eBay and Etsy</span>
            </div>
            <div className="shrink-0 flex items-center justify-around animate-marquee-slow min-w-full" aria-hidden="true">
                <span className="mx-10">Based in the United Kingdom</span>
                <span className="mx-10">Items posted Monday to Saturday</span>
                <span className="mx-10">Follow us on eBay and Etsy</span>
                <span className="mx-10">Based in the United Kingdom</span>
                <span className="mx-10">Items posted Monday to Saturday</span>
                <span className="mx-10">Follow us on eBay and Etsy</span>
            </div>
        </div>
    </div>
    <header className="bg-[#fffbf0] relative transition-all duration-300 shadow-sm z-[60] pb-0">
      <div className="max-w-7xl mx-auto px-4 min-h-[60px] md:h-[86px] flex flex-wrap lg:flex-nowrap items-center justify-between pt-4 pb-0 md:py-0 gap-y-0 relative">
        
        {/* Logo */}
        <div className="flex justify-start items-center cursor-pointer group select-none mr-auto lg:mr-0 order-1 lg:w-auto shrink-0" onClick={onHomeClick}>
            <Logo />
        </div>

        {/* Search */}
        {/* Updated Breakpoints: lg: (1024px) is now where desktop layout begins, matching App.js Sidebar */}
        <div className="w-[calc(100%+2rem)] -mx-4 px-4 order-3 lg:order-2 mb-2 mt-3 pt-3 lg:pt-0 lg:mt-0 lg:mb-0 lg:border-t-0 border-t border-[#514d46]/10 lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:w-[30rem] xl:w-[40rem] lg:mx-0 lg:px-0">
             <SearchInput search={search} onSearchUpdate={onSearchUpdate} onCommit={onCommit} suggestions={suggestions} />
        </div>

        {/* Navigation */}
        <div className="flex justify-end items-center gap-3 md:gap-6 order-2 lg:order-3 lg:w-auto shrink-0">
             <button 
                onClick={currentView !== 'shop' ? onCatalogueClick : undefined} 
                disabled={currentView === 'shop' && !isProductView}
                className={`text-base md:text-lg font-bold transition-colors ${currentView === 'shop' && !isProductView ? 'text-[#487ec8] opacity-50 cursor-default' : 'text-[#514d46]/60 hover:text-[#487ec8] active:scale-95'}`}
             >
                Catalogue
             </button>
             <div className="h-4 md:h-6 w-0.5 bg-[#514d46]/10"></div>
             <button 
                onClick={currentView !== 'about' ? onAboutClick : undefined}
                disabled={currentView === 'about'}
                className={`text-base md:text-lg font-bold transition-colors ${currentView === 'about' ? 'text-[#487ec8] opacity-50 cursor-default' : 'text-[#514d46]/60 hover:text-[#487ec8] active:scale-95'}`}
             >
                About Us
             </button>
        </div>

      </div>

      {/* Chips (Mobile Only) */}
      <QuickFilterChips onCommit={onCommit} selectedCollection={selectedCollection} collections={collections} decades={decades} />
    </header>
  </div>
));
Header.displayName = 'Header';

export default Header;
