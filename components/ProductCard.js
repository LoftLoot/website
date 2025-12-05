// src/components/ProductCard.js
import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { PRELOAD_CACHE, addToBoundedCache, ITEMS_PER_PAGE } from '../data';

// --- UTILS & HOOKS (Moved here to keep the card self-contained) ---

const GlobalObserver = { 
    observer: null, 
    elements: new Map(), 
    isFast: false, 
    scrollTimeout: null, 
    lastScrollY: 0, 
    lastTime: 0, 
    init() { 
        if (typeof window === 'undefined') return; 
        this.setupObserver('600px'); 
        window.addEventListener('scroll', this.onScroll, { passive: true }); 
    }, 
    setupObserver(margin) { 
        if (this.observer) this.observer.disconnect(); 
        this.observer = new IntersectionObserver((entries) => { 
            entries.forEach(entry => { 
                if (entry.isIntersecting) { 
                    const cb = this.elements.get(entry.target); 
                    if (cb) cb(); 
                    this.unobserve(entry.target); 
                } 
            }); 
        }, { rootMargin: `0px 0px ${margin} 0px` }); 
        this.elements.forEach((_, el) => this.observer.observe(el)); 
    }, 
    observe(el, cb) { 
        if (!this.observer) this.init(); 
        if (this.elements.has(el)) return; 
        this.elements.set(el, cb); 
        this.observer.observe(el); 
    }, 
    unobserve(el) { 
        if (!el) return; 
        this.elements.delete(el); 
        if (this.observer) this.observer.unobserve(el); 
    }, 
    onScroll: () => { 
        const now = performance.now(); 
        const scrollY = window.scrollY; 
        const deltaY = Math.abs(scrollY - GlobalObserver.lastScrollY); 
        const deltaT = now - GlobalObserver.lastTime; 
        if (deltaT > 50) { 
            const speed = deltaY / deltaT; 
            const isNowFast = speed > 1.5; 
            if (isNowFast !== GlobalObserver.isFast) { 
                GlobalObserver.isFast = isNowFast; 
                GlobalObserver.setupObserver(isNowFast ? '0px' : '600px'); 
            } 
            GlobalObserver.lastScrollY = scrollY; 
            GlobalObserver.lastTime = now; 
        } 
        if (GlobalObserver.scrollTimeout) clearTimeout(GlobalObserver.scrollTimeout); 
        GlobalObserver.scrollTimeout = setTimeout(() => { 
            if (GlobalObserver.isFast) { 
                GlobalObserver.isFast = false; 
                GlobalObserver.setupObserver('600px'); 
            } 
        }, 150); 
    } 
}; 
GlobalObserver.onScroll = GlobalObserver.onScroll.bind(GlobalObserver);

const preloadImage = (src) => {
    if (!src || PRELOAD_CACHE.has(src)) return;
    const img = new Image();
    img.src = src;
    addToBoundedCache(PRELOAD_CACHE, src, true, 50);
};

const useProximityPreloader = (src) => {
    const ref = useRef(null);
    useEffect(() => {
        const element = ref.current;
        if (!element || !src || PRELOAD_CACHE.has(src)) return;
        GlobalObserver.observe(element, () => preloadImage(src));
        return () => {
             if(element) GlobalObserver.unobserve(element);
        };
    }, [src]);
    return ref;
};

// --- COMPONENT ---

const ProductCard = React.memo(({ product, index, onOpen, isMicro = false, priority = false, animationDelay }) => {
  const { isSold, imageColor, name, price, mainImage, tinyPlaceholder, badgeText, badgeColor, brand, manufacturer, schemaCondition } = product;
  const hoverTimer = useRef(null);
  const proximityRef = useProximityPreloader(mainImage);
  const [imgLoaded, setImgLoaded] = useState(() => PRELOAD_CACHE.has(mainImage));
  const imgRef = useRef(null);

  useLayoutEffect(() => {
      if (imgRef.current?.complete) {
          setImgLoaded(true);
          addToBoundedCache(PRELOAD_CACHE, mainImage, true, 50);
      }
  }, [mainImage]);

  const handlePointerDown = useCallback((e) => {
      if (e.button !== 0) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      
      e.preventDefault(); 
      onOpen(product.id);
  }, [onOpen, product.id]);

  const handleKeyDown = useCallback((e) => {
     if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         onOpen(product.id);
     }
  }, [onOpen, product.id]);

  const handlePointerEnter = useCallback((e) => {
      if (e.pointerType === 'touch') return;
      // Prefetch route logic
      hoverTimer.current = setTimeout(() => {
          if (product.processedImages[0]?.original) preloadImage(product.processedImages[0].original);
      }, 150);
  }, [product.processedImages]);

  const handlePointerLeave = useCallback(() => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  if (isMicro) {
    return (
        <div className="flex-shrink-0 shrink-0 w-full h-full" onPointerDown={handlePointerDown} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
            <div className="group bg-white rounded-xl overflow-hidden border border-[#f2f4f6] cursor-pointer shadow-sm hover:shadow-md transition-all w-full h-full select-none flex flex-col">
                <div className={`aspect-square relative overflow-hidden bg-slate-50 pointer-events-none ${isSold ? 'grayscale' : ''}`}>
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl z-0" style={{ backgroundColor: `#${imageColor}` }}>{name.substring(0,2).toUpperCase()}</div>
                    {mainImage && <img src={mainImage} alt={name} loading="lazy" width="200" height="200" className="absolute inset-0 w-full h-full object-cover z-10"/>}
                </div>
                {isSold && <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"><div className="bg-[#d35153] text-white text-[8px] font-black px-1.5 py-0.5 -rotate-12 border border-white shadow-sm uppercase tracking-widest">Sold Out</div></div>}
                <div className="p-3 flex-1 flex flex-col"><h3 className="font-bold text-[#514d46] text-xs leading-tight mb-1 line-clamp-2 h-8">{name}</h3><div className="font-mono font-bold text-[#487ec8] text-xs mt-auto">£{price.toFixed(2)}</div></div>
            </div>
        </div>
    );
  }

  return (
    <div ref={proximityRef} className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#487ec8]/10 transition-all duration-300 flex flex-col h-full border border-[#f2f4f6] relative cursor-default ${index >= ITEMS_PER_PAGE ? 'animate-deal-bottom' : ''}`} style={index >= ITEMS_PER_PAGE ? { animationDelay } : {}} itemScope itemType="https://schema.org/Product" onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
      <div role="button" tabIndex={0} onPointerDown={handlePointerDown} onKeyDown={handleKeyDown} className="aspect-square md:aspect-[4/5] relative overflow-hidden bg-[#f2f4f6] cursor-pointer focus:outline-none select-none">
        <div className={`absolute inset-0 z-0 ${isSold ? 'grayscale' : ''}`}>
             <div className={`absolute inset-0 z-0 bg-cover bg-center filter blur-xl scale-110 transition-opacity duration-200 ${imgLoaded ? 'opacity-0' : 'opacity-100'}`} style={{ backgroundImage: `url("${tinyPlaceholder}")` }}></div>
             
             {mainImage && <img ref={imgRef} itemProp="image" src={mainImage} alt={`Vintage ${product.releaseDate || ''} ${name} - ${manufacturer} Action Figure`} width="600" height="750" loading={priority ? "eager" : "lazy"} fetchpriority={priority ? "high" : "auto"} decoding={priority ? "sync" : "async"} onLoad={() => { setImgLoaded(true); addToBoundedCache(PRELOAD_CACHE, mainImage, true, 50); }} className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}/>}
        </div>
        {isSold ? <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"><div className="bg-[#d35153]/90 text-white text-base md:text-lg font-black px-3 py-1.5 md:px-5 md:py-2.5 -rotate-12 border-2 md:border-4 border-white shadow-xl uppercase tracking-widest">Sold Out</div></div> : (badgeText && <span className="absolute top-3 left-3 text-[#514d46] text-[10px] font-bold px-2 py-1 rounded-full z-30 shadow-sm uppercase tracking-wider" style={{ backgroundColor: badgeColor || '#efc83d' }}>{badgeText}</span>)}
      </div>
      <div className="flex-1 flex flex-col p-3 md:p-5">
        <div className="mb-1 text-xs font-bold text-[#514d46]/60 uppercase tracking-wider truncate"><span itemProp="brand">{brand}</span></div>
        <h3 className="font-bold text-[#514d46] text-sm md:text-base xl:text-lg leading-tight mb-1 hover:text-[#ea70ad] transition-colors cursor-pointer" itemProp="name" onPointerDown={handlePointerDown}>{name}</h3>
        <div className="font-mono font-bold text-[#487ec8] text-sm md:text-base xl:text-lg mt-auto" itemProp="offers" itemScope itemType="https://schema.org/Offer"><meta itemProp="priceCurrency" content="GBP" /><span itemProp="price" content={price}>£{price.toFixed(2)}</span><link itemProp="itemCondition" href={schemaCondition} /></div>
        <div className="hidden md:block mt-4"><button onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e); }} className="w-[calc(100%+1.5rem)] -mx-3 flex items-center justify-center gap-2 h-10 text-sm font-bold transition-all rounded-xl active:scale-95 cursor-pointer text-[#514d46] bg-[#f4e799] hover:bg-[#e6d88a]">View Details</button></div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';

export default ProductCard;