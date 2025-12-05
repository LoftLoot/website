// src/components/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, ChevronRight, ArrowRight } from 'lucide-react';

// --- SUB-COMPONENTS ---

export const Logo = React.memo(({ className = "" }) => (
    <div className={`flex items-center ${className}`}>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Jua&family=Outfit:wght@300;400;500;700;900&display=swap');
            .font-jua { font-family: 'Jua', sans-serif; }
            .font-outfit { font-family: 'Outfit', sans-serif; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
            .animate-marquee-slow { animation: marquee 60s linear infinite; }
        `}</style>
        <h1 className="leading-none text-[#514d46] select-none flex items-baseline font-jua">
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

// --- CHIPS (Mobile Only) ---
const QuickFilterChips = ({ onCommit, selectedCollection }) => {
    const eras = ["70s", "80s", "90s", "00s"];
    const collections = ["Star Wars", "TMNT", "Thundercats", "WWE", "Pokémon", "Gargoyles"];
    const chips = ["All", "|", ...eras, "|", ...collections];

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
            className="flex md:hidden w-full overflow-x-auto no-scrollbar items-center gap-2 px-4 pb-3 select-none cursor-grab active:cursor-grabbing bg-[#fffbf0]"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
            {chips.map((chip, idx) => {
                if (chip === "|") return <div key={`sep-${idx}`} className="h-5 w-px bg-[#514d46]/20 mx-1 shrink-0"></div>;
                return (
                    <button
                        key={chip}
                        onClick={() => { if (!isDragging) onCommit({ type: 'filter', payload: { kind: 'Collection', value: chip } }); }}
                        className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-bold border transition-all shadow-sm ${
                            selectedCollection === chip 
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
    const totalItems = filterCount + productCount + ((suggestions?.totalProducts || 0) > productCount ? 1 : 0);

    const handleKeyDown = (e) => {
        if (!isOpen && e.key !== 'Enter') return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(prev => (prev + 1) % totalItems); } 
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(prev => (prev - 1 + totalItems) % totalItems); } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex === -1) onCommit({ type: 'query', value: search });
            else if (activeIndex < filterCount) onCommit({ type: 'filter', payload: suggestions.filters[activeIndex] });
            else if (activeIndex < filterCount + productCount) onCommit({ type: 'product', payload: suggestions.products[activeIndex - filterCount] });
            else onCommit({ type: 'query', value: search });
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
        <div ref={containerRef} className="relative w-full group z-[60]">
            <div className="flex w-full shadow-sm md:shadow-none rounded-2xl md:rounded-none overflow-hidden md:overflow-visible border border-[#E0E8F0] md:border-0 md:shadow-none bg-white md:bg-transparent">
                <div className="relative flex-1">
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder="Search our loft..." 
                        value={search}
                        onChange={(e) => onSearchUpdate(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => { if(search && search.length >= 2) { const hasResults = (suggestions?.filters?.length > 0 || suggestions?.products?.length > 0); if (hasResults) setIsOpen(true); onSearchUpdate(search); } }}
                        className="w-full bg-white text-[#514d46] py-3 md:py-2.5 pl-4 pr-10 font-bold placeholder:text-[#514d46]/40 focus:outline-none md:border-2 border-r-0 border-[#E0E8F0] md:border-[#514d46]/20 focus:border-[#d35153] focus:border-r-0 transition-colors text-lg md:text-base font-outfit md:rounded-l-2xl"
                        aria-activedescendant={activeIndex >= 0 ? `option-${activeIndex}` : undefined}
                        aria-expanded={isOpen}
                    />
                    {search && (
                        <button onClick={() => { onSearchUpdate(''); onCommit({ type: 'query', value: '' }); inputRef.current?.blur(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#514d46]/20 text-white rounded-full p-1 hover:bg-[#514d46]/40 transition-colors"><X size={14} strokeWidth={3} /></button>
                    )}
                </div>
                <button onClick={() => { onCommit({ type: 'query', value: search }); setIsOpen(false); }} className="bg-[#d35153] text-white px-5 flex items-center justify-center hover:bg-[#b94547] transition-colors cursor-pointer md:border-2 border-[#d35153] border-l-0 active:scale-95 md:active:scale-100 md:rounded-r-2xl"><Search className="w-6 h-6 md:w-5 md:h-5" strokeWidth={3} /></button>
            </div>
            {isOpen && suggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border-2 border-[#514d46]/20 overflow-hidden flex flex-col animate-fade-in font-outfit z-50">
                    {suggestions.filters?.length > 0 && (
                        <div className="flex flex-col border-b border-[#514d46]/10">
                            <div className="px-4 py-2 bg-[#e4e4e7] text-xs uppercase font-black tracking-widest text-[#514d46]/80 border-b border-[#514d46]/10">Filters</div>
                            {suggestions.filters.map((filter, idx) => (
                                <div key={`filter-${idx}`} onClick={() => handleCommit('filter', filter)} className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-[#f4f4f5]">
                                    <span className="font-bold text-[#514d46] text-base"><HighlightedText text={filter.label} highlight={search} /></span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
SearchInput.displayName = 'SearchInput';

// --- MAIN HEADER COMPONENT ---

const Header = React.memo(({ currentView, isProductView, onCatalogueClick, onAboutClick, onHomeClick, search, onSearchUpdate, onCommit, suggestions, selectedCollection }) => (
  <div className="relative z-[60] flex flex-col bg-[#fffbf0] font-outfit border-b border-[#E0E8F0] shadow-sm">
    {/* Marquee Bar */}
    <div className="bg-[#487ec8] text-white text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] py-2 overflow-hidden ticker-wrapper">
        <div className="flex overflow-hidden select-none gap-0">
            <div className="shrink-0 flex items-center justify-around animate-marquee-slow min-w-full">
                <span className="mx-10">Based in the United Kingdom</span>
                <span className="mx-10">Items posted Monday to Saturday</span>
                <span className="mx-10">Follow us on eBay and Etsy</span>
            </div>
            <div className="shrink-0 flex items-center justify-around animate-marquee-slow min-w-full" aria-hidden="true">
                <span className="mx-10">Based in the United Kingdom</span>
                <span className="mx-10">Items posted Monday to Saturday</span>
                <span className="mx-10">Follow us on eBay and Etsy</span>
            </div>
        </div>
    </div>

    {/* Header Container */}
    <header className="bg-[#fffbf0] relative transition-all duration-300 z-[60] pb-0">
      {/* LAYOUT FIX: 
         - 'flex-wrap' on mobile (allows search to drop to row 2)
         - 'md:flex-nowrap' on desktop (forces one single line)
      */}
      <div className="max-w-7xl mx-auto px-4 min-h-[60px] md:h-[86px] flex flex-wrap md:flex-nowrap items-center justify-between pt-4 pb-0 md:py-0 gap-y-0">
        
        {/* 1. Logo Section (Left) */}
        <div className="flex justify-start items-center cursor-pointer group select-none mr-auto md:mr-0 order-1 md:w-auto shrink-0" onClick={onHomeClick}>
            <Logo />
        </div>

        {/* 3. Search Bar (Center on Desktop, New Row on Mobile) */}
        {/* Desktop: flex-1, centered margins, no borders. Mobile: full width, bordered top. */}
        <div className="w-[calc(100%+2rem)] -mx-4 px-4 md:w-auto md:mx-4 lg:mx-12 md:px-0 md:flex-1 order-3 md:order-2 mb-2 mt-3 pt-3 md:pt-0 md:mt-0 md:mb-0 md:border-t-0 border-t border-[#514d46]/10">
             <SearchInput search={search} onSearchUpdate={onSearchUpdate} onCommit={onCommit} suggestions={suggestions} />
        </div>

        {/* 2. Navigation (Right) */}
        {/* On mobile: sits on row 1 next to logo (order-2). On desktop: sits on far right (order-3). */}
        <div className="flex justify-end items-center gap-3 md:gap-6 order-2 md:order-3 md:w-auto shrink-0">
             <button onClick={onCatalogueClick} className={`text-base md:text-lg font-bold transition-colors hover:text-[#487ec8] active:scale-95 ${currentView === 'shop' && !isProductView ? 'text-[#487ec8]' : 'text-[#514d46]/60'}`}>Catalogue</button>
             <div className="h-4 md:h-6 w-0.5 bg-[#514d46]/10"></div>
             <button onClick={onAboutClick} className={`text-base md:text-lg font-bold transition-colors hover:text-[#487ec8] active:scale-95 ${currentView === 'about' ? 'text-[#487ec8]' : 'text-[#514d46]/60'}`}>About Us</button>
        </div>

      </div>

      {/* Chips (Mobile Only) */}
      <QuickFilterChips onCommit={onCommit} selectedCollection={selectedCollection} />
    </header>
  </div>
));
Header.displayName = 'Header';

export default Header;