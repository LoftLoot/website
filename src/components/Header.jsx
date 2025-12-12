// src/components/Header.js
import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { Search, X, Filter, ChevronRight, ArrowRight } from 'lucide-react';
import { FILTER_COLORS } from '../data';

// --- CONSTANTS ---
const TOP_GAP = 0; 
const SCROLL_CONTAINER_ID = "app-scroll-container";

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
const QuickFilterChips = ({ onCommit, onReset, selectedCollection, selectedDecade, collections = [], decades = [], availableCollections = [], availableDecades = [], hasMounted }) => {
    const chips = useMemo(() => [...decades, "|", ...collections], [decades, collections]);

    const scrollRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    
    // FIX: Default to TRUE. Assume there is overflow until proven otherwise.
    const [showRight, setShowRight] = useState(true);
    
    const [gradientsReady, setGradientsReady] = useState(false);
    
    const requestRef = useRef();
    const scrollSpeed = useRef(0);

    const checkScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 0);
        setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            el.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            
            checkScroll();
            
            setTimeout(() => {
                checkScroll(); 
                setGradientsReady(true);
            }, 50); 
        }
        return () => {
            el?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [checkScroll, chips]);

    const startScrolling = (direction) => {
        const speed = direction === 'left' ? -5 : 5;
        scrollSpeed.current = speed;
        
        const animate = () => {
            if (scrollRef.current) {
                scrollRef.current.scrollLeft += scrollSpeed.current;
            }
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
    };

    const stopScrolling = () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    };

    const handleChipClick = (e, kind, value) => {
        // FIX: Only scroll if the element is NOT fully visible
        const target = e.currentTarget;
        const container = scrollRef.current;
        
        if (container) {
            const tRect = target.getBoundingClientRect();
            const cRect = container.getBoundingClientRect();
            
            // Check if ANY part of the button is outside the container bounds
            // We use a small 1px tolerance for sub-pixel rendering differences
            const isPartiallyHidden = (tRect.left < cRect.left) || (tRect.right > cRect.right);
            
            if (isPartiallyHidden) {
                target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }

        let finalValue = value;
        if (kind === 'Collection' && selectedCollection === value) {
            finalValue = 'All';
        } else if (kind === 'Era' && selectedDecade === value) {
            finalValue = 'All';
        }

        onCommit({ type: 'filter', payload: { kind, value: finalValue } });
    };

    return (
        <div className="relative w-full border-b border-[#514d46]/5 bg-[#fffbf0]">
            <div 
                className={`absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none ${gradientsReady ? 'transition-opacity duration-300' : ''} ${showLeft ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: 'linear-gradient(to right, #fffbf0 20%, transparent)' }}
            />
            <div 
                className={`hidden lg:block absolute left-0 top-0 bottom-0 w-12 z-20 cursor-w-resize ${showLeft ? 'block' : 'hidden'}`}
                onMouseEnter={() => showLeft && startScrolling('left')}
                onMouseLeave={stopScrolling}
            />

            <div 
                className={`absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none ${gradientsReady ? 'transition-opacity duration-300' : ''} ${showRight ? 'opacity-100' : 'opacity-0'}`}
                style={{ background: 'linear-gradient(to left, #fffbf0 20%, transparent)' }}
            />
            <div 
                className={`hidden lg:block absolute right-0 top-0 bottom-0 w-12 z-20 cursor-e-resize ${showRight ? 'block' : 'hidden'}`}
                onMouseEnter={() => showRight && startScrolling('right')}
                onMouseLeave={stopScrolling}
            />

            <div 
                ref={scrollRef}
                className="flex w-full overflow-x-auto no-scrollbar items-center gap-2 px-4 pb-3 pt-1 select-none"
            >
                {chips.map((chip, idx) => {
                    if (chip === "|") return <div key={`sep-${idx}`} className="h-5 w-px bg-[#514d46]/20 mx-1 shrink-0"></div>;
                    
                    let isActive = false;
                    let isAvailable = true;
                    let color = '#487ec8';
                    let kind = 'Collection';

                    if (decades.includes(chip)) {
                        kind = 'Era';
                        isActive = selectedDecade === chip;
                        isAvailable = availableDecades.includes(chip);
                        color = FILTER_COLORS.Era;
                    } else {
                        kind = 'Collection';
                        isActive = selectedCollection === chip;
                        isAvailable = availableCollections.includes(chip);
                        color = FILTER_COLORS.Collection;
                    }
                    
                    return (
                        <button
                            key={chip}
                            disabled={!isAvailable}
                            onClick={(e) => handleChipClick(e, kind, chip)}
                            style={{
                                backgroundColor: isActive ? color : (isAvailable ? 'white' : '#f4f4f5'),
                                borderColor: isActive ? color : (isAvailable ? '#E0E8F0' : 'transparent'),
                                color: isActive ? 'white' : (isAvailable ? '#514d46' : 'rgba(81, 77, 70, 0.3)')
                            }}
                            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-bold border ${hasMounted ? 'transition-all' : ''} shadow-sm ${
                                isActive 
                                ? "shadow-md" 
                                : isAvailable 
                                    ? "" 
                                    : "cursor-default"
                            }`}
                        >
                            {chip}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const SearchInput = React.memo(({ search, onSearchUpdate, onCommit, suggestions }) => {
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => setHasMounted(true), []);

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
                        className={`w-full h-full bg-white text-[#514d46] py-2.5 pl-4 pr-10 font-bold placeholder:text-[#514d46]/40 focus:outline-none rounded-l-2xl border-2 border-r-0 border-[#514d46]/20 focus:border-[#d35153] focus:border-r-0 ${hasMounted ? 'transition-colors' : ''}`}
                    />
                    {search && (
                        <button onClick={() => { onSearchUpdate(''); onCommit({ type: 'query', value: '' }); inputRef.current?.blur(); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#514d46]/20 text-white rounded-full p-1 hover:bg-[#514d46]/40 transition-colors"><X size={14} strokeWidth={3} /></button>
                    )}
                </div>
                <button 
                    onClick={() => { onCommit({ type: 'query', value: search }); setIsOpen(false); }} 
                    className={`bg-[#d35153] text-white px-5 flex items-center justify-center hover:bg-[#b94547] cursor-pointer rounded-r-2xl border-2 border-[#d35153] border-l-0 ${hasMounted ? 'transition-colors' : ''}`}
                >
                    <Search className="w-5 h-5" strokeWidth={3} />
                </button>
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

const Header = React.memo(({ currentView, isProductView, onCatalogueClick, onAboutClick, onHomeClick, search, onSearchUpdate, onCommit, suggestions, selectedCollection, selectedDecade, collections, decades, availableCollections, availableDecades, enableSticky = true }) => {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  const isShopMain = currentView === 'shop' && !isProductView;

  // Refs for logic
  const stickyRef = useRef(null);
  const spacerRef = useRef(null); 
  const logoRef = useRef(null);
  const currentTranslate = useRef(0);
  const lastScrollY = useRef(0); 
  const headerHeightRef = useRef(0);
  const stickyThresholdRef = useRef(0);
  const maxScrollRef = useRef(0);
  
  const isStickyRef = useRef(false);
  const [isSticky, setIsSticky] = useState(false); // For rendering

  const [spacerHeight, setSpacerHeight] = useState(0);

  // 1. HEIGHT MEASUREMENT LAYER
  useLayoutEffect(() => {
      const container = document.getElementById(SCROLL_CONTAINER_ID);
      const root = document.getElementById('root'); 

      const updateDimensions = () => {
          if (stickyRef.current && logoRef.current) {
              const h = stickyRef.current.offsetHeight;
              headerHeightRef.current = h;
              
              const totalHeight = logoRef.current.offsetHeight + h + TOP_GAP;
              stickyThresholdRef.current = totalHeight;
              
              if (isShopMain) {
                  const newSpacerHeight = h + TOP_GAP;
                  setSpacerHeight(prev => (Math.abs(prev - newSpacerHeight) > 1 ? newSpacerHeight : prev));
                  if (spacerRef.current) spacerRef.current.style.height = `${newSpacerHeight}px`;
              }
          }

          if (container) {
              maxScrollRef.current = Math.max(0, container.scrollHeight - container.clientHeight);
          }
      };

      updateDimensions();
      const obs = new ResizeObserver(() => updateDimensions());
      if (stickyRef.current) obs.observe(stickyRef.current);
      if (logoRef.current) obs.observe(logoRef.current);
      if (root) obs.observe(root);
      window.addEventListener('resize', updateDimensions);
      
      return () => {
          obs.disconnect();
          window.removeEventListener('resize', updateDimensions);
      };
  }, [isShopMain]); 

  // 2. RAF LOOP: SCROLL & PHYSICS
  useEffect(() => {
      if (!isShopMain || !enableSticky) {
          setIsSticky(false);
          if (stickyRef.current) {
              stickyRef.current.style.opacity = '';
              stickyRef.current.style.transform = '';
          }
          return;
      }

      let rafId;
      
      const loop = () => {
          const container = document.getElementById(SCROLL_CONTAINER_ID);
          const scrollY = container ? Math.max(0, container.scrollTop) : Math.max(0, window.scrollY);
          
          const delta = scrollY - lastScrollY.current;
          
          const headerHeight = headerHeightRef.current;
          const maxHide = -(headerHeight + TOP_GAP);
          
          const shouldBeSticky = scrollY >= stickyThresholdRef.current;

          if (shouldBeSticky !== isStickyRef.current) {
              isStickyRef.current = shouldBeSticky;
              
              if (shouldBeSticky) {
                  // ENTER Sticky
                  if (stickyRef.current) {
                      stickyRef.current.style.position = 'fixed';
                      stickyRef.current.style.top = '0';
                      stickyRef.current.style.left = '0';
                      stickyRef.current.style.right = '0';
                      stickyRef.current.classList.add('shadow-md');
                      stickyRef.current.style.transform = `translateY(${maxHide}px)`; 
                      stickyRef.current.style.opacity = '0'; // Start hidden
                  }
                  if (spacerRef.current) spacerRef.current.style.display = 'block'; 
                  currentTranslate.current = maxHide;
              } else {
                  // EXIT Sticky
                  if (stickyRef.current) {
                      stickyRef.current.style.position = 'relative';
                      stickyRef.current.style.top = 'auto';
                      stickyRef.current.style.left = 'auto';
                      stickyRef.current.style.right = 'auto';
                      stickyRef.current.classList.remove('shadow-md');
                      stickyRef.current.style.transform = '';
                      stickyRef.current.style.opacity = ''; // Reset opacity
                  }
                  if (spacerRef.current) spacerRef.current.style.display = 'none'; 
                  currentTranslate.current = 0;
              }

              setIsSticky(shouldBeSticky); 
          }

          if (isStickyRef.current && stickyRef.current) {
              const isBouncing = scrollY > maxScrollRef.current;

              if (Math.abs(delta) > 0 && !isBouncing) {
                  let newTranslate = currentTranslate.current - delta;
                  newTranslate = Math.max(maxHide, Math.min(0, newTranslate));
                  
                  const roundedTranslate = Math.round(newTranslate);

                  if (roundedTranslate !== currentTranslate.current) {
                      currentTranslate.current = roundedTranslate;
                      stickyRef.current.style.transform = `translateY(${roundedTranslate}px)`;
                  }
              }

              let ratio = maxHide !== 0 ? (currentTranslate.current / maxHide) : 0;
              let mvOpacity = 1 - ratio; 
              mvOpacity = Math.max(0, Math.min(1, mvOpacity));

              const dist = scrollY - stickyThresholdRef.current;
              const fadeRange = 150; 
              let posOpacity = Math.max(0, Math.min(1, dist / fadeRange));
              
              const finalOpacity = mvOpacity * posOpacity;

              stickyRef.current.style.opacity = finalOpacity.toFixed(2);
          }

          lastScrollY.current = scrollY;
          rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafId);
  }, [isShopMain, enableSticky]);

  // --- DYNAMIC TICKER LOGIC ---
  const SPACER = "\u00A0".repeat(20);
  const singleUnit = `Based in the United Kingdom${SPACER}Items posted Monday to Saturday${SPACER}Follow us on eBay and Etsy${SPACER}`;
  
  const [dupText, setDupText] = useState(singleUnit);
  const measureRef = useRef(null);
  const lastWidth = useRef(0);

  useLayoutEffect(() => {
      let rafId;
      const calculateRepeats = () => {
          if (!measureRef.current) return;
          const unitWidth = measureRef.current.offsetWidth;
          
          const viewportWidth = document.documentElement.clientWidth;
          if (viewportWidth === lastWidth.current) return;
          lastWidth.current = viewportWidth;

          if (unitWidth === 0) return; 
          const requiredCopies = Math.ceil(viewportWidth / unitWidth) + 2;
          
          const newText = singleUnit.repeat(requiredCopies);
          setDupText(prev => prev === newText ? prev : newText);
      };

      calculateRepeats();
      const onResize = () => {
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(calculateRepeats);
      };

      const ro = new ResizeObserver(onResize);
      ro.observe(document.documentElement);
      return () => {
          ro.disconnect();
          cancelAnimationFrame(rafId);
      };
  }, [singleUnit]);

  return (
    <>
      <div aria-hidden="true" className="absolute top-0 left-0 w-0 h-0 overflow-hidden opacity-0 pointer-events-none">
          <div ref={measureRef} className="whitespace-nowrap text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] inline-block">{singleUnit}</div>
      </div>

      <div className="bg-[#487ec8] text-white text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] py-2 overflow-hidden z-[60] relative whitespace-nowrap select-none">
          <div className="ticker-track" data-dup={dupText}>{singleUnit}</div>
      </div>

      {/* --- DESKTOP HEADER --- */}
      <div className="hidden lg:block bg-[#fffbf0] shadow-sm z-[60] relative">
        <div className="max-w-7xl mx-auto px-4 h-[86px] flex items-center justify-between">
            <div className="flex justify-start items-center cursor-pointer group select-none shrink-0" onClick={onHomeClick}>
                <Logo />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 w-1/2 max-w-3xl">
                <SearchInput search={search} onSearchUpdate={onSearchUpdate} onCommit={onCommit} suggestions={suggestions} />
            </div>
            <div className="flex justify-end items-center gap-6 shrink-0 relative z-[61]">
                <button 
                    onClick={currentView !== 'shop' ? onCatalogueClick : undefined} 
                    disabled={currentView === 'shop' && !isProductView} 
                    className={`text-lg font-bold ${hasMounted ? 'transition-colors' : ''} ${currentView === 'shop' && !isProductView ? 'text-[#487ec8] cursor-default' : 'text-[#514d46]/60 hover:text-[#487ec8] active:scale-95'}`}
                >
                    Catalogue
                </button>
                <div className="h-6 w-0.5 bg-[#514d46]/10"></div>
                <button 
                    onClick={currentView !== 'about' ? onAboutClick : undefined} 
                    disabled={currentView === 'about'} 
                    className={`text-lg font-bold ${hasMounted ? 'transition-colors' : ''} ${currentView === 'about' ? 'text-[#487ec8] cursor-default' : 'text-[#514d46]/60 hover:text-[#487ec8] active:scale-95'}`}
                >
                    About Us
                </button>
            </div>
        </div>
      </div>

      {/* --- MOBILE HEADER --- */}
      <div className="lg:hidden relative z-[60]">
          <div ref={logoRef} className="bg-[#fffbf0] px-4 pt-4 pb-0 flex items-center justify-between relative z-[61]">
              <div onClick={onHomeClick} className="cursor-pointer"><Logo /></div>
              <div className="flex items-center gap-3">
                  <button onClick={currentView !== 'shop' ? onCatalogueClick : undefined} disabled={currentView === 'shop' && !isProductView} className={`text-base font-bold ${hasMounted ? 'transition-colors' : ''} ${currentView === 'shop' && !isProductView ? 'text-[#487ec8]' : 'text-[#514d46]/60'}`}>Catalogue</button>
                  <div className="h-4 w-0.5 bg-[#514d46]/10"></div>
                  <button onClick={currentView !== 'about' ? onAboutClick : undefined} disabled={currentView === 'about'} className={`text-base font-bold ${hasMounted ? 'transition-colors' : ''} ${currentView === 'about' ? 'text-[#487ec8]' : 'text-[#514d46]/60'}`}>About</button>
              </div>
          </div>

          {isShopMain && enableSticky && <div ref={spacerRef} style={{ height: spacerHeight, display: isSticky ? 'block' : 'none' }} className="w-full bg-transparent" />}

          <div 
            ref={stickyRef}
            className={`relative pb-0 bg-[#fffbf0] z-50 will-change-transform ${(isSticky && enableSticky && isShopMain) ? 'shadow-md' : ''}`}
            style={(isSticky && enableSticky && isShopMain) ? { position: 'fixed', top: 0, left: 0, right: 0 } : {}} 
          >
              <div className="px-4 pb-2 pt-4">
                  <SearchInput search={search} onSearchUpdate={onSearchUpdate} onCommit={onCommit} suggestions={suggestions} />
              </div>
              <QuickFilterChips 
                onCommit={onCommit}
                onReset={onHomeClick}
                selectedCollection={selectedCollection} 
                selectedDecade={selectedDecade}
                collections={collections} 
                decades={decades} 
                availableCollections={availableCollections}
                availableDecades={availableDecades}
                hasMounted={hasMounted} // Passed down to chips
              />
          </div>
      </div>
    </>
  );
});
Header.displayName = 'Header';

export default Header;
