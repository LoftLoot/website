// src/components/ProductCard.js
import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PRELOAD_CACHE, addToBoundedCache, ITEMS_PER_PAGE, GlobalObserver } from '../data';

// --- UTILS & HOOKS ---
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
        return () => { if(element) GlobalObserver.unobserve(element); };
    }, [src]);
    return ref;
};

// --- COMPONENT ---
const ProductCard = React.memo(({ product, index, onOpen, isMicro = false, priority = false, animationDelay }) => {
  const { isSold, imageColor, name, price, mainImage, tinyPlaceholder, badgeText, badgeColor, brand, manufacturer, schemaCondition, fullSlug } = product; 
  const hoverTimer = useRef(null);
  const proximityRef = useProximityPreloader(mainImage);
  const [imgLoaded, setImgLoaded] = useState(() => PRELOAD_CACHE.has(mainImage));
  const imgRef = useRef(null);
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  useLayoutEffect(() => {
      if (imgRef.current?.complete) {
          setImgLoaded(true);
          addToBoundedCache(PRELOAD_CACHE, mainImage, true, 50);
      }
  }, [mainImage]);

  const handlePointerEnter = useCallback((e) => {
      if (e.pointerType === 'touch') return;
      hoverTimer.current = setTimeout(() => {
          if (product.processedImages?.[0]?.original) {
              preloadImage(product.processedImages[0].original);
          }
      }, 150);
  }, [product.processedImages]);

  const handlePointerLeave = useCallback(() => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  return (
    <div ref={proximityRef} className={`group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-[#487ec8]/10 flex flex-col h-full border border-[#f2f4f6] relative cursor-default ${hasMounted ? 'transition-all duration-300' : ''} ${index >= ITEMS_PER_PAGE ? 'animate-deal-bottom' : ''}`} style={index >= ITEMS_PER_PAGE ? { animationDelay } : {}} itemScope itemType="https://schema.org/Product" onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
      
      <Link 
        to={`/${fullSlug}/`} 
        className="aspect-square md:aspect-[4/5] relative overflow-hidden bg-[#f2f4f6] cursor-pointer focus:outline-none select-none block"
      >
        <div className={`absolute inset-0 z-0 ${isSold ? 'grayscale' : ''}`}>
             <div className={`absolute inset-0 z-0 bg-cover bg-center filter blur-xl scale-110 transition-opacity duration-200 ${imgLoaded ? 'opacity-0' : 'opacity-100'}`} style={{ backgroundImage: `url("${tinyPlaceholder}")`, backgroundColor: `#${imageColor}` }}></div>
             {mainImage && <img ref={imgRef} itemProp="image" src={mainImage} alt={`Vintage ${product.releaseDate || ''} ${name} - ${manufacturer} Action Figure`} width="600" height="750" loading={priority ? "eager" : "lazy"} fetchpriority={priority ? "high" : "auto"} decoding={priority ? "sync" : "async"} onLoad={() => { setImgLoaded(true); addToBoundedCache(PRELOAD_CACHE, mainImage, true, 50); }} className={`absolute inset-0 w-full h-full object-cover z-10 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}/>}
        </div>
        {isSold ? <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"><div className="bg-[#d35153]/90 text-white text-base md:text-lg font-black px-3 py-1.5 md:px-5 md:py-2.5 -rotate-12 border-2 md:border-4 border-white shadow-xl uppercase tracking-widest">Sold Out</div></div> : (badgeText && <span className="absolute top-3 left-3 text-[#514d46] text-xs font-bold px-2 py-1 rounded-full z-30 shadow-sm uppercase tracking-wider" style={{ backgroundColor: badgeColor || '#efc83d' }}>{badgeText}</span>)}
      </Link>
      <div className="flex-1 flex flex-col p-3 md:p-5">
        <div className="mb-1 text-xs font-bold text-[#514d46]/60 uppercase tracking-wider truncate"><span itemProp="brand">{brand}</span></div>
        
        <Link to={`/${fullSlug}/`} className="font-bold text-[#514d46] text-sm md:text-base lg:text-lg leading-tight mb-1 hover:text-[#ea70ad] transition-colors cursor-pointer block" itemProp="name">
            {name}
        </Link>
        
        <div className="font-mono font-bold text-[#487ec8] text-sm md:text-base lg:text-lg mt-auto" itemProp="offers" itemScope itemType="https://schema.org/Offer"><meta itemProp="priceCurrency" content="GBP" /><span itemProp="price" content={price}>£{price.toFixed(2)}</span><link itemProp="itemCondition" href={schemaCondition} /></div>
        
        {!isMicro && (
            <div className="hidden md:block mt-4">
                <Link to={`/${fullSlug}/`} className={`w-[calc(100%+1.5rem)] -mx-3 flex items-center justify-center gap-2 h-10 text-sm font-bold rounded-xl active:scale-95 cursor-pointer text-[#514d46] bg-[#f4e799] hover:bg-[#e6d88a] ${hasMounted ? 'transition-all' : ''}`}>
                    View Details
                </Link>
            </div>
        )}
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';

export default ProductCard;
