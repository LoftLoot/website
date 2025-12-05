// src/components/ProductDetail.js
import React, { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import { ChevronRight, ChevronLeft, ExternalLink, ShoppingBag, Play, Archive } from 'lucide-react';
import { JaggedLine } from './About'; 
import ProductCard from './ProductCard'; 
import { ORGANIZATION_SCHEMA } from '../data';

// --- HELPERS ---
const NAV_BTN_BASE = "bg-white/90 backdrop-blur-sm border border-[#487ec8]/20 text-[#487ec8] shadow-lg rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-default disabled:hover:scale-100 disabled:active:scale-100";

const useImageZoom = () => {
    const [isActive, setIsActive] = useState(false);
    const imgRef = useRef(null);
    const rafRef = useRef(null);
    
    const handleImageClick = useCallback((e) => {
        setIsActive(prev => !prev);
        if (!isActive && imgRef.current) {
             const rect = e.currentTarget.getBoundingClientRect();
             const x = ((e.clientX - rect.left) / rect.width) * 100;
             const y = ((e.clientY - rect.top) / rect.height) * 100;
             imgRef.current.style.transformOrigin = `${x}% ${y}%`;
             imgRef.current.style.transform = 'scale(2.5)';
        } else if (imgRef.current) {
             imgRef.current.style.transform = 'scale(1)';
        }
    }, [isActive]);

    const handleImageMouseMove = useCallback((e) => {
        if (!isActive || !imgRef.current || rafRef.current) return;
        const { clientX, clientY, currentTarget } = e;
        rafRef.current = requestAnimationFrame(() => {
            const rect = currentTarget.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            imgRef.current.style.transformOrigin = `${x}% ${y}%`;
            rafRef.current = null;
        });
    }, [isActive]);

    useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);
    useEffect(() => { if (!isActive && imgRef.current) imgRef.current.style.transform = 'scale(1)'; }, [isActive]);

    return { isActive, imgRef, handleImageClick, handleImageMouseMove, handleMouseLeave: () => setIsActive(false) };
};

const useThumbScroll = (images) => {
    const thumbsRef = useRef(null);
    const [showArrows, setShowArrows] = useState({ left: false, right: false });
    
    useEffect(() => {
        const check = () => thumbsRef.current && setShowArrows({ 
            left: thumbsRef.current.scrollLeft > 5, 
            right: thumbsRef.current.scrollLeft < (thumbsRef.current.scrollWidth - thumbsRef.current.clientWidth - 5) 
        });
        const el = thumbsRef.current;
        if (el) { el.addEventListener('scroll', check); check(); }
        return () => el?.removeEventListener('scroll', check);
    }, [images]);

    const scrollThumbs = (dir) => thumbsRef.current?.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' });
    return { thumbsRef, showLeft: showArrows.left, showRight: showArrows.right, scrollThumbs };
};

// --- SUB-COMPONENTS ---

const SpecItem = ({ label, value }) => {
    if (!value || value === 'Unknown') return null;
    return (
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#514d46]/40 uppercase tracking-widest mb-1">{label}</span>
            <span className="text-base font-bold text-[#514d46]">{value}</span>
        </div>
    );
};

// --- MAIN COMPONENT ---

const ProductDetail = ({ product, productMap, onClose, onShopAll, onCategoryClick, onDecadeClick, onOpen }) => {
    const [activeImgIndex, setActiveImgIndex] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    
    const { isActive, imgRef, handleImageClick, handleImageMouseMove, handleMouseLeave } = useImageZoom();
    // Use processedImages from data.js. Ensure it's memoized or stable.
    const images = useMemo(() => product.processedImages || [], [product.processedImages]); 
    const { thumbsRef, showLeft, showRight, scrollThumbs } = useThumbScroll(images);

    // Reset states on product change
    useEffect(() => { 
        setActiveImgIndex(0); 
        setIsVideoPlaying(false);
    }, [product.id]);

    useLayoutEffect(() => { window.scrollTo(0, 0); }, [product.id]);

    // Handle Title SEO locally
    useEffect(() => {
        document.title = `${product.name} - ${product.manufacturer} | Loft Loot`;
    }, [product.name, product.manufacturer]);

    const relatedProducts = (product.relatedIds || [])
        .map(id => productMap?.get(id))
        .filter(Boolean)
        .slice(0, 5); 

    const activeMedia = images[activeImgIndex];
    const currentVideoId = activeMedia?.videoId;

    // JSON-LD Schema
    const jsonLd = useMemo(() => JSON.stringify({ 
        "@context": "https://schema.org/", 
        "@type": "Product", 
        "name": product.name, 
        "image": images.map(img => img.original), 
        "description": product.description, 
        "brand": { "@type": "Brand", "name": product.manufacturer }, 
        "offers": { 
            "@type": "Offer", 
            "url": window.location.href, 
            "priceCurrency": "GBP", 
            "price": product.price, 
            "itemCondition": product.schemaCondition, 
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" 
        }, 
        "publisher": ORGANIZATION_SCHEMA 
    }), [product, images]);

    // Navigation for main image arrows
    const navImg = (dir) => (e) => { 
        e?.stopPropagation(); 
        setActiveImgIndex(prev => { 
            const n = prev + dir; 
            return n < 0 ? 0 : n >= images.length ? images.length - 1 : n; 
        }); 
    };

    return (
        <div className="min-h-screen bg-[#fffbf0] text-[#514d46] font-sans pb-0 relative z-50 flex flex-col mb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
            
            {/* Background color locked to cream (#f2e9d9) */}
            <div className="bg-[#f2e9d9] pb-16 pt-8 relative w-full">
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    
                    {/* Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 mb-8 text-sm font-bold uppercase tracking-wider text-[#514d46]/60">
                        <button onClick={onShopAll} className="hover:text-[#487ec8] transition-colors">Catalogue</button>
                        <ChevronRight size={14} className="opacity-40" />
                        <button onClick={() => onCategoryClick(product.collection)} className="hover:text-[#487ec8] transition-colors">{product.collection}</button>
                        <ChevronRight size={14} className="opacity-40" />
                        <button onClick={() => onDecadeClick(product.decade)} className="hover:text-[#487ec8] transition-colors">{product.decade}</button>
                        <ChevronRight size={14} className="opacity-40" />
                        <span className="text-[#514d46] opacity-100 truncate max-w-[200px]">{product.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        
                        {/* LEFT COLUMN: IMAGES */}
                        <div className="space-y-4">
                            <div 
                                className={`aspect-[4/5] bg-white rounded-3xl overflow-hidden border-4 border-white shadow-xl shadow-[#514d46]/5 relative group ${!currentVideoId ? (isActive ? 'cursor-zoom-out' : 'cursor-zoom-in') : ''} will-change-transform`}
                                onClick={!currentVideoId ? handleImageClick : undefined} 
                                onMouseMove={handleImageMouseMove} 
                                onMouseLeave={handleMouseLeave}
                            >
                                {/* Main Image Navigation Arrows */}
                                {images.length > 1 && !isActive && (
                                    <>
                                        <button onClick={navImg(-1)} disabled={activeImgIndex === 0} className={`${NAV_BTN_BASE} absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 opacity-0 group-hover:opacity-100 disabled:hidden`}><ChevronLeft size={24} /></button>
                                        <button onClick={navImg(1)} disabled={activeImgIndex === images.length - 1} className={`${NAV_BTN_BASE} absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 opacity-0 group-hover:opacity-100 disabled:hidden`}><ChevronRight size={24} /></button>
                                    </>
                                )}

                                {currentVideoId ? (
                                    isVideoPlaying ? (
                                        <iframe 
                                            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0&controls=0&modestbranding=1&iv_load_policy=3`} 
                                            className="w-full h-full absolute inset-0 z-20" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                            allowFullScreen 
                                            title="YouTube" 
                                        />
                                    ) : (
                                        <div role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsVideoPlaying(true)} className="absolute inset-0 z-20 cursor-pointer group/play focus:outline-none focus:ring-4 focus:ring-pink-200" onClick={() => setIsVideoPlaying(true)}>
                                            <img src={activeMedia.thumbnail} alt={`${product.name} video`} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover/play:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/play:bg-black/20 transition-colors">
                                                <div className="w-20 h-20 bg-[#d35153] text-white rounded-full flex items-center justify-center shadow-2xl transform group-hover/play:scale-110 transition-transform duration-300">
                                                    <Play size={40} fill="currentColor" className="ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-4xl z-0 opacity-20" style={{ backgroundColor: `#${product.imageColor}` }}>{product.name.substring(0,2).toUpperCase()}</div>
                                        <img 
                                            ref={imgRef} 
                                            src={activeMedia?.original} 
                                            alt={product.name} 
                                            className={`relative z-10 w-full h-full object-cover ${product.isSold ? 'grayscale-[0.5]' : ''} will-change-transform transition-transform duration-100`} 
                                            style={{ transition: isActive ? 'none' : 'transform 0.3s ease-out' }}
                                        />
                                    </>
                                )}

                                {/* Animated Stamp and Dust */}
                                {product.isSold && !isActive && (
                                    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                                        <div className="relative animate-stamp">
                                            <div className="bg-[#d35153]/90 text-white text-3xl font-black px-8 py-4 -rotate-12 border-4 border-white shadow-2xl uppercase tracking-widest relative z-20">Sold Out</div>
                                            {[...Array(8)].map((_, i) => <div key={i} className={`absolute w-${4+i%4} h-${4+i%4} bg-white/80 rounded-full animate-dust dust-${i+1} z-10`}></div>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex items-center gap-2">
                                     <button onClick={() => scrollThumbs('left')} disabled={!showLeft} className={`${NAV_BTN_BASE} hidden md:flex shrink-0 p-1.5`}><ChevronLeft size={20} /></button>
                                    <div ref={thumbsRef} className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar flex-1 px-1">
                                        {images.map((img, idx) => (
                                            <button key={idx} onClick={() => setActiveImgIndex(idx)} className={`w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all relative ${activeImgIndex === idx ? 'border-[#487ec8] opacity-100 ring-2 ring-pink-100' : 'border-transparent opacity-60 hover:opacity-100'} bg-white`}>
                                                <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                                                {img.isVideo && <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white"><Play size={24} fill="rgba(0,0,0,0.5)" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => scrollThumbs('right')} disabled={!showRight} className={`${NAV_BTN_BASE} hidden md:flex shrink-0 p-1.5`}><ChevronRight size={20} /></button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: INFO */}
                        <div className="space-y-6 select-text">
                            {/* Header with HR style */}
                            <div className="border-b-2 border-[#514d46]/5 pb-6">
                                <div className="mb-2 text-xs font-bold text-[#514d46]/60 uppercase tracking-wider">{product.manufacturer}</div>
                                <h1 className="text-4xl md:text-5xl font-black text-[#514d46] leading-tight mb-4" style={{ fontFamily: '"Jua", sans-serif' }}>{product.name}</h1>
                                <div className="flex items-baseline gap-4">
                                    <span className={`text-3xl font-mono font-bold ${!product.isSold ? 'text-[#487ec8]' : 'text-[#514d46]/40 decoration-double'}`}>£{product.price.toFixed(2)}</span>
                                    {!product.isSold 
                                        ? <span className="flex items-center gap-1.5 text-xs font-black bg-[#487ec8]/10 text-[#487ec8] px-3 py-1 rounded-full uppercase tracking-wider"><div className="w-2 h-2 rounded-full bg-[#487ec8]"></div> In Stock</span> 
                                        : <span className="text-xs font-black bg-[#d35153]/10 text-[#d35153] px-3 py-1 rounded-full uppercase tracking-wider">Sold Out</span>
                                    }
                                </div>
                            </div>

                            {/* Info Box: NEWER HR Style (Linear, no bubble) */}
                            <div className="pt-6 pb-6 border-b-2 border-[#514d46]/5">
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <SpecItem label="Collection" value={product.collection} />
                                    <SpecItem label="Era" value={product.decade} />
                                    <SpecItem label="Brand" value={product.brand} />
                                    <SpecItem label="Type" value={product.type} />
                                    <div className="col-span-2">
                                        <SpecItem label="Condition" value={product.condition} />
                                    </div>
                                </div>
                            </div>

                            <div className="prose prose-lg text-[#514d46]/80 leading-relaxed font-outfit">
                                <p>{product.description}</p>
                                <p className="text-sm italic opacity-60 mt-4">Photos represent the actual item you will receive. All photos and videos were taken by us.</p>
                            </div>

                            {/* Buttons: OLDER Style (White with border) */}
                            <div className="pt-8 border-t-2 border-[#514d46]/5">
                                <h3 className="font-bold text-[#514d46] text-sm uppercase tracking-widest mb-4">External Purchasing Options</h3>
                                <div className="flex flex-col gap-3">
                                    {product.links && product.links.length > 0 ? (
                                        product.links.map((link, i) => (
                                            product.isSold ? (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border-2 border-[#514d46]/10 bg-white/50 text-[#514d46]/40 font-bold cursor-default">
                                                    <span className="flex items-center gap-2">
                                                        <Archive size={18} />
                                                        <span className="flex items-center gap-1.5"><span>Sold on</span>{link.logo ? <img src={link.logo} alt={link.platform} style={{ height: '18px', width: 'auto' }} className="object-contain translate-y-[1px] -translate-x-[1px] grayscale opacity-50" /> : link.platform}</span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-xl border-2 border-[#514d46] bg-white hover:bg-[#514d46] hover:text-white transition-all duration-300 group font-bold shadow-sm">
                                                    <span className="flex items-center gap-2">
                                                        <ShoppingBag size={18} />
                                                        <span className="flex items-center gap-1.5"><span>Buy on</span>{link.logo ? <img src={link.logo} alt={link.platform} style={{ height: '18px', width: 'auto' }} className="object-contain translate-y-[1px] -translate-x-[1px]" /> : link.platform}</span>
                                                    </span>
                                                    <ExternalLink size={18} className="opacity-50 group-hover:opacity-100" />
                                                </a>
                                            )
                                        ))
                                    ) : !product.isSold ? (
                                        <button disabled className="w-full p-4 rounded-xl bg-[#514d46]/10 text-[#514d46]/40 font-bold cursor-not-allowed">
                                            Purchase Link Unavailable
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <JaggedLine position="bottom" color="#f2e9d9" />
            </div>

            {/* RELATED PRODUCTS */}
            {relatedProducts.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <h3 className="font-bold text-[#514d46] text-xl uppercase tracking-widest flex items-center gap-3 mb-8">
                        <div className="w-3 h-3 rounded-full bg-[#d35153]"></div>
                        You might also like
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {relatedProducts.map((p, i) => (
                            <ProductCard key={p.id} product={p} index={i} onOpen={onOpen} isMicro={false} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
