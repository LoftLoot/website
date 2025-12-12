// src/components/ProductDetail.js
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async'; 
import { ChevronRight, ChevronLeft, ExternalLink, ShoppingBag, Play, Archive, X } from 'lucide-react';
import { JaggedLine } from './About'; 
import ProductCard from './ProductCard'; 
import { ORGANIZATION_SCHEMA } from '../data';

// --- HELPERS ---
const NAV_BTN_BASE = "bg-white/90 backdrop-blur-sm border border-[#487ec8]/20 text-[#487ec8] shadow-lg rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-default transition-all duration-300 hover:scale-110 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100";

// A cartoony cloud shape SVG
const DustCloud = ({ className, style }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={className} 
        style={style}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M17.5,19c-0.3,0-0.5,0-0.8-0.1c-0.8,1.7-2.5,2.9-4.5,3c-0.1,0-0.3,0-0.4,0c-2.3,0-4.3-1.6-4.9-3.8c-0.2,0-0.4,0-0.6,0c-2.8,0-5-2.2-5-5c0-2.5,1.8-4.5,4.2-4.9c0.7-2.9,3.3-5,6.3-5c2.6,0,4.8,1.6,5.9,3.9c0.6-0.2,1.3-0.3,2-0.3c3.3,0,6,2.7,6,6S20.8,19,17.5,19z"/>
    </svg>
);

// --- HOOKS ---

// Hook for Swipe Down to Close
// Added checkScroll to optionally disable scroll position checking (good for Lightbox)
const useSwipeDownClose = (onClose, checkScroll = true) => {
    const touchStart = useRef(null);
    const minSwipeDistance = 30; // Reduced threshold for better sensitivity

    const onTouchStart = (e) => {
        // Only track one finger touches
        if (e.targetTouches.length !== 1) return;
        
        touchStart.current = { 
            x: e.targetTouches[0].clientX, 
            y: e.targetTouches[0].clientY 
        };
    };

    const onTouchEnd = (e) => {
        if (!touchStart.current) return;
        
        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };

        const dx = touchEnd.x - touchStart.current.x;
        const dy = touchEnd.y - touchStart.current.y;

        // Check if swipe is vertical (dy > dx) and downwards (dy > 0)
        let canSwipe = true;
        
        if (checkScroll) {
            const container = document.getElementById("app-scroll-container") || document.documentElement || document.body;
            const scrollTop = container ? container.scrollTop : window.scrollY;
            const isAtTop = scrollTop < 10;
            if (!isAtTop) canSwipe = false;
        }

        if (canSwipe && dy > minSwipeDistance && Math.abs(dy) > Math.abs(dx)) {
            if (onClose) onClose();
        }
        
        touchStart.current = null;
    };

    return { onTouchStart, onTouchEnd };
};

// Hook for Press & Hold Scrolling on Dots
const useDotScrubber = (count, onChange) => {
    const isScrubbing = useRef(false);
    const containerRef = useRef(null);

    const calculateIndex = useCallback((clientX) => {
        if (!containerRef.current || count <= 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const newIndex = Math.floor(percent * count);
        onChange(Math.min(newIndex, count - 1));
    }, [count, onChange]);

    const onPointerDown = (e) => {
        isScrubbing.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        calculateIndex(e.clientX);
    };

    const onPointerMove = (e) => {
        if (!isScrubbing.current) return;
        calculateIndex(e.clientX);
    };

    const onPointerUp = (e) => {
        isScrubbing.current = false;
    };

    return { 
        containerRef, 
        handlers: { 
            onPointerDown, 
            onPointerMove, 
            onPointerUp, 
            onPointerLeave: onPointerUp, 
            onPointerCancel: onPointerUp 
        } 
    };
};

// Hook for Click-to-Zoom logic (Desktop Inline)
const useImageZoom = () => {
    const [isActive, setIsActive] = useState(false);
    const imgRef = useRef(null);

    // Initial Zoom (Click)
    const handleImageClick = useCallback((e) => {
        e?.stopPropagation();
        
        if (!isActive && imgRef.current) {
             const rect = e.currentTarget.getBoundingClientRect();
             const x = e.clientX - rect.left;
             const y = e.clientY - rect.top;
             
             const xPercent = (x / rect.width) * 100;
             const yPercent = (y / rect.height) * 100;
             
             imgRef.current.style.transformOrigin = `${xPercent}% ${yPercent}%`;
             imgRef.current.style.transform = 'scale(2.5)';
             setIsActive(true);
        } else if (imgRef.current) {
             imgRef.current.style.transform = 'scale(1)';
             setIsActive(false);
        }
    }, [isActive]);

    // Panning (Mouse Move)
    const handleMouseMove = useCallback((e) => {
        if (!isActive || !imgRef.current) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate percentage position
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        
        // Update origin to follow cursor, creating a "magnifying glass" pan effect
        imgRef.current.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    }, [isActive]);

    // Reset on Leave
    const handleMouseLeave = useCallback(() => {
        if (isActive && imgRef.current) {
            imgRef.current.style.transform = 'scale(1)';
            setIsActive(false);
        }
    }, [isActive]);

    return { isActive, setIsActive, imgRef, handleImageClick, handleMouseMove, handleMouseLeave };
};

// Detects which slide is visible in a scroll container (For Mobile Flicking)
const useScrollSpy = (ref, itemCount, onIndexChange) => {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleScroll = () => {
            if (!el) return;
            const scrollLeft = el.scrollLeft;
            const width = el.offsetWidth;
            const index = Math.round(scrollLeft / width);
            onIndexChange(index);
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [ref, itemCount, onIndexChange]);
};

// --- SUB-COMPONENTS ---

const Lightbox = ({ isOpen, onClose, images, initialIndex }) => {
    const [index, setIndex] = useState(initialIndex);
    const [isClosing, setIsClosing] = useState(false); // Track closing state for animation
    
    // Zoom & Pan State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs for Drag Logic
    const startPos = useRef({ x: 0, y: 0 });
    const lastPos = useRef({ x: 0, y: 0 });
    const isPointerDown = useRef(false);
    const hasMoved = useRef(false);

    // Sync index when opening
    useEffect(() => {
        setIndex(initialIndex);
        setScale(1);
        setPosition({ x: 0, y: 0 });
        lastPos.current = { x: 0, y: 0 };
        setIsClosing(false); // Reset closing state
    }, [initialIndex, isOpen]);

    // Lock Body Scroll
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Reset zoom when changing slides
    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        lastPos.current = { x: 0, y: 0 };
    }, [index]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        // Wait for animation to finish before unmounting
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    }, [onClose]);

    // Apply swipe close to Lightbox (ignore scroll position)
    const { onTouchStart, onTouchEnd } = useSwipeDownClose(handleClose, false);

    const next = useCallback((e) => { 
        e?.stopPropagation(); 
        setIndex(prev => (prev + 1) % images.length); 
    }, [images.length]);

    const prev = useCallback((e) => { 
        e?.stopPropagation(); 
        setIndex(prev => (prev - 1 + images.length) % images.length); 
    }, [images.length]);

    // --- DRAG HANDLERS ---
    const handlePointerDown = (e) => {
        if (scale === 1) return; // Only allow drag if zoomed in
        e.preventDefault();
        e.stopPropagation();
        
        isPointerDown.current = true;
        hasMoved.current = false;
        startPos.current = { x: e.clientX, y: e.clientY };
        setIsDragging(true);
    };

    const handlePointerMove = (e) => {
        if (!isPointerDown.current || scale === 1) return;
        
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;

        // Threshold to distinguish click vs drag
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;

        setPosition({
            x: lastPos.current.x + dx,
            y: lastPos.current.y + dy
        });
    };

    const handlePointerUp = () => {
        isPointerDown.current = false;
        setIsDragging(false);
        lastPos.current = position;
    };

    const handleImageClick = (e) => {
        // If we dragged, do NOT toggle zoom
        if (hasMoved.current) {
            hasMoved.current = false;
            return;
        }

        // Toggle Zoom
        if (scale === 1) {
            setScale(2.5);
        } else {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            lastPos.current = { x: 0, y: 0 };
        }
    };

    if (!isOpen) return null;

    const activeImg = images[index];

    return createPortal(
        <div 
            className={`fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center touch-none transition-opacity duration-300 ease-out ${isClosing ? 'opacity-0' : 'animate-in fade-in duration-300 opacity-100'}`}
            // Apply swipe handlers to the main wrapper
            onTouchStart={scale === 1 ? onTouchStart : undefined}
            onTouchEnd={scale === 1 ? onTouchEnd : undefined}
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
                <span className="text-white/60 font-medium text-sm drop-shadow-md">{index + 1} / {images.length}</span>
                <button onClick={handleClose} className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors pointer-events-auto backdrop-blur-md">
                    <X size={24} />
                </button>
            </div>

            {/* Main Stage */}
            <div className="relative w-full h-full flex items-center justify-center p-0 md:p-12 overflow-hidden touch-none">
                 {/* Desktop Arrows */}
                 {images.length > 1 && (
                    <>
                        <button onClick={prev} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 transition-all p-4 z-50">
                            <ChevronLeft size={48} strokeWidth={1} />
                        </button>
                        <button onClick={next} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:scale-110 transition-all p-4 z-50">
                            <ChevronRight size={48} strokeWidth={1} />
                        </button>
                    </>
                )}

                <div 
                    className="relative w-full h-full flex items-center justify-center touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {activeImg.isVideo ? (
                        <div className="aspect-video w-full max-w-5xl bg-black rounded-lg overflow-hidden shadow-2xl">
                             <iframe src={`https://www.youtube.com/embed/${activeImg.videoId}?autoplay=1`} className="w-full h-full" allowFullScreen title="Video" />
                        </div>
                    ) : (
                        <img 
                            src={activeImg.original} 
                            alt="Full screen view" 
                            onClick={handleImageClick}
                            draggable={false}
                            className={`max-w-full max-h-full object-contain select-none touch-none ${isDragging ? 'cursor-grabbing' : (scale > 1 ? 'cursor-grab' : 'cursor-zoom-in')}`}
                            style={{
                                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Thumbnails */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto no-scrollbar py-2 pointer-events-auto">
                {images.map((img, i) => (
                    <button 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                        className={`w-12 h-12 md:w-16 md:h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === index ? 'border-white opacity-100' : 'border-transparent opacity-40 hover:opacity-100'}`}
                    >
                        <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>,
        document.body
    );
};

// --- PRODUCT GALLERY ---
const ProductGallery = ({ product, activeIndex, setActiveIndex, onOpenLightbox, onClose }) => {
    const images = useMemo(() => product.processedImages || [], [product]);
    const scrollContainerRef = useRef(null);
    
    // Zoom Hook (Desktop)
    const { isActive: isZoomActive, setIsActive, imgRef, handleImageClick, handleMouseMove, handleMouseLeave } = useImageZoom();
    
    // Scrubber Hook (Mobile Dots)
    const galleryScrubber = useDotScrubber(images.length, setActiveIndex);
    
    // Swipe to Close Hook (Mobile - On Page Gallery)
    const { onTouchStart: onSwipeStart, onTouchEnd: onSwipeEnd } = useSwipeDownClose(onClose, true);

    // Sync Desktop Click -> Mobile Scroll
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el && images.length > 0) {
            const targetScroll = activeIndex * el.offsetWidth;
            if (Math.abs(el.scrollLeft - targetScroll) > 10) {
                el.scrollTo({ left: targetScroll, behavior: 'smooth' });
            }
        }
        setIsActive(false);
        if (imgRef.current) imgRef.current.style.transform = 'scale(1)';
    }, [activeIndex, images.length, setIsActive, imgRef]);

    // Sync Mobile Scroll -> State (Flicking)
    useScrollSpy(scrollContainerRef, images.length, setActiveIndex);

    const activeImg = images[activeIndex];
    const isVideo = activeImg?.isVideo;

    // Navigation handlers
    const navImg = (dir) => (e) => { 
        e?.stopPropagation(); 
        setActiveIndex(prev => { 
            const n = prev + dir; 
            return n < 0 ? 0 : n >= images.length ? images.length - 1 : n; 
        }); 
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* MAIN STAGE */}
            <div className="relative w-full aspect-square md:aspect-[4/5] lg:aspect-square bg-white rounded-3xl overflow-hidden shadow-sm border border-[#514d46]/5 group select-none">
                
                {/* 1. MOBILE NATIVE SCROLL (Flicking + Tap to Lightbox + Swipe to Close) */}
                <div 
                    ref={scrollContainerRef}
                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar md:hidden"
                    style={{ scrollBehavior: 'smooth' }}
                    onTouchStart={onSwipeStart}
                    onTouchEnd={onSwipeEnd}
                >
                    {images.map((img, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => onOpenLightbox(idx)} // TAP TO OPEN LIGHTBOX
                            className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative bg-[#f9fafb] cursor-pointer"
                        >
                            {img.isVideo ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/5 relative">
                                    <img src={img.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
                                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-16 h-16 bg-[#d35153] text-white rounded-full flex items-center justify-center shadow-xl"><Play size={32} fill="currentColor" className="ml-1"/></div></div>
                                </div>
                            ) : (
                                <img src={img.original} alt={`${product.name} - view ${idx+1}`} className="w-full h-full object-cover" draggable={false} />
                            )}
                        </div>
                    ))}
                </div>

                {/* 2. DESKTOP VIEW (Click to Zoom Contextually) */}
                <div 
                    className="hidden md:block w-full h-full relative"
                    onClick={!isVideo ? handleImageClick : () => onOpenLightbox(activeIndex)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    style={{ cursor: isVideo ? 'pointer' : (isZoomActive ? 'zoom-out' : 'zoom-in') }}
                >
                    {isVideo ? (
                        <div className="w-full h-full relative group/play">
                             <img src={activeImg.thumbnail} alt="" className="w-full h-full object-cover opacity-90 transition-opacity group-hover/play:opacity-100" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover/play:bg-black/20">
                                <div className="w-20 h-20 bg-[#d35153] text-white rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover/play:scale-110">
                                    <Play size={40} fill="currentColor" className="ml-1" />
                                </div>
                             </div>
                        </div>
                    ) : (
                        <img 
                            ref={imgRef} 
                            src={activeImg?.original} 
                            alt={product.name}
                            fetchPriority="high"
                            loading="eager"
                            className="w-full h-full object-cover transition-transform duration-300 ease-out" 
                        />
                    )}
                </div>

                {/* Desktop Arrows (High Z-Index) */}
                {!isZoomActive && images.length > 1 && (
                    <>
                        <button onClick={navImg(-1)} disabled={activeIndex === 0} className={`${NAV_BTN_BASE} hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 opacity-0 group-hover:opacity-100 disabled:hidden`}><ChevronLeft size={24} /></button>
                        <button onClick={navImg(1)} disabled={activeIndex === images.length - 1} className={`${NAV_BTN_BASE} hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 opacity-0 group-hover:opacity-100 disabled:hidden`}><ChevronRight size={24} /></button>
                    </>
                )}

                {/* Sold Badge (Cartoony Impact Dust) */}
                {!isZoomActive && product.isSold && (
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-visible">
                        {/* Parent text size is responsive via clamp(), so em units inside will scale with it */}
                        <div className="relative text-[clamp(1.5rem,5vw,3rem)]">
                            
                            {/* Dust Container - Sibling to badge */}
                            <div className="absolute inset-0 overflow-visible">
                                
                                {/* 1. Top-Left (Large) */}
                                <div className="dust-puff absolute top-[0.1em] left-[0.2em]" style={{ '--tx': '-0.5em', '--ty': '-0.5em', animationDelay: '0.18s' }}>
                                    <DustCloud className="w-[0.85em] h-[0.85em] text-stone-300" style={{ transform: 'rotate(-15deg)' }} />
                                </div>
                                
                                {/* 2. Top-Right (Medium) */}
                                <div className="dust-puff absolute top-[0.2em] right-[0.2em]" style={{ '--tx': '0.6em', '--ty': '-0.4em', animationDelay: '0.24s' }}>
                                    <DustCloud className="w-[0.7em] h-[0.7em] text-stone-300" />
                                </div>
                                
                                {/* 3. Bottom-Left (Medium) */}
                                <div className="dust-puff absolute bottom-[0.2em] left-[0.2em]" style={{ '--tx': '-0.6em', '--ty': '0.4em', animationDelay: '0.22s' }}>
                                    <DustCloud className="w-[0.7em] h-[0.7em] text-stone-300" />
                                </div>
                                
                                {/* 4. Bottom-Right (Large) */}
                                <div className="dust-puff absolute bottom-[0.2em] right-[0.2em]" style={{ '--tx': '0.5em', '--ty': '0.5em', animationDelay: '0.26s' }}>
                                    <DustCloud className="w-[0.85em] h-[0.85em] text-stone-300" style={{ transform: 'rotate(10deg)' }} />
                                </div>

                                {/* 5. Top-Mid (Small - Fast) */}
                                <div className="dust-puff absolute top-[0.1em] left-1/2" style={{ '--tx': '0.06em', '--ty': '-0.7em', animationDelay: '0.21s' }}>
                                    <DustCloud className="w-[0.4em] h-[0.4em] text-stone-300" />
                                </div>

                                {/* 6. Bottom-Mid (Small - Fast) */}
                                <div className="dust-puff absolute bottom-[0.1em] left-1/3" style={{ '--tx': '-0.15em', '--ty': '0.7em', animationDelay: '0.25s' }}>
                                    <DustCloud className="w-[0.5em] h-[0.5em] text-stone-300" />
                                </div>

                                {/* 7. Far Left (Small) */}
                                <div className="dust-puff absolute top-1/2 left-[0.1em]" style={{ '--tx': '-0.8em', '--ty': '0.03em', animationDelay: '0.20s' }}>
                                    <DustCloud className="w-[0.35em] h-[0.35em] text-stone-300" />
                                </div>

                                 {/* 8. Far Right (Small) */}
                                 <div className="dust-puff absolute top-1/3 right-[0.1em]" style={{ '--tx': '0.8em', '--ty': '-0.15em', animationDelay: '0.26s' }}>
                                    <DustCloud className="w-[0.4em] h-[0.4em] text-stone-300" />
                                </div>
                            </div>

                            {/* Actual Badge */}
                            <div className="relative z-10 bg-[#d35153]/95 text-white font-black px-[1em] py-[0.5em] -rotate-12 border-[0.2em] border-white shadow-2xl uppercase tracking-widest backdrop-blur-sm text-center leading-none whitespace-nowrap animate-stamp">
                                Sold Out
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Dot Scrubber */}
            {images.length > 1 ? (
                <div 
                    ref={galleryScrubber.containerRef}
                    {...galleryScrubber.handlers}
                    className="flex md:hidden justify-center gap-2 py-4 touch-none"
                >
                    {images.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`rounded-full transition-all duration-300 pointer-events-none ${activeIndex === idx ? 'bg-[#487ec8] w-4 h-2' : 'bg-[#514d46]/20 w-2 h-2'}`}
                        />
                    ))}
                </div>
            ) : (
                // UPDATED: Spacer reduced to h-2 (8px) for subtler spacing
                <div className="md:hidden h-2" />
            )}

            {/* THUMBNAILS (Desktop Grid) */}
            {images.length > 1 && (
                <div className="hidden md:grid grid-cols-5 lg:grid-cols-6 gap-3 mt-4">
                    {images.map((img, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setActiveIndex(idx)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${activeIndex === idx ? 'border-[#487ec8] ring-2 ring-[#487ec8]/20 ring-offset-1' : 'border-transparent hover:border-[#514d46]/20'}`}
                        >
                            <img src={img.thumbnail} alt="" className={`w-full h-full object-cover ${activeIndex === idx ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`} />
                            {img.isVideo && <div className="absolute inset-0 flex items-center justify-center text-white bg-black/20"><Play size={20} fill="currentColor" /></div>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- INFO COMPONENTS ---

const SpecItem = ({ label, value }) => {
    if (!value || value === 'Unknown') return null;
    return (
        <div className="flex flex-col">
            <span className="text-xs md:text-sm font-bold text-[#514d46]/40 uppercase tracking-widest mb-1">{label}</span>
            <span className="text-sm md:text-base font-bold text-[#514d46]">{value}</span>
        </div>
    );
};

const ProductHeader = ({ product, className = "" }) => (
    <div className={`${className}`}>
        <div className="mb-2 text-xs md:text-sm font-bold text-[#487ec8] uppercase tracking-widest mb-2">{product.manufacturer} • {product.releaseDate}</div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#514d46] leading-[0.9] mb-4" style={{ fontFamily: '"Jua", sans-serif' }}>{product.name}</h1>
        
        <div className="flex items-center gap-4">
            <span className={`text-2xl md:text-3xl font-mono font-bold ${!product.isSold ? 'text-[#487ec8]' : 'text-[#514d46]/40 decoration-double'}`}>£{product.price.toFixed(2)}</span>
            {product.isSold && (
                <span className="text-[10px] md:text-xs font-black bg-[#d35153]/10 text-[#d35153] px-2 py-1 rounded-full uppercase tracking-wider">Sold Out</span>
            )}
        </div>
    </div>
);

// --- CAROUSEL (Restored "Sets" Logic) ---
const RelatedProductsCarousel = ({ products, onOpen }) => {
    const [page, setPage] = useState(0);
    // FIX: Safely initialize state based on environment
    const [itemsPerSet, setItemsPerSet] = useState(() => {
        if (typeof window === 'undefined') return 5; // Default to Desktop size on server
        if (window.innerWidth < 768) return 2;
        if (window.innerWidth < 1024) return 3;
        return 5;
    });
    
    // Swipe Refs
    const touchStart = useRef(null);
    const touchEnd = useRef(null);
    const minSwipeDistance = 50;

    // Resize Listener
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) setItemsPerSet(2); else if (width < 1024) setItemsPerSet(3); else setItemsPerSet(5);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const productSets = useMemo(() => {
        const sets = [];
        if (!products || products.length === 0) return [];
        for (let i = 0; i < products.length; i += itemsPerSet) {
            const chunk = products.slice(i, i + itemsPerSet);
            // Pad with placeholders if needed
            while (chunk.length < itemsPerSet) chunk.push({ id: `placeholder-${i}-${chunk.length}`, isPlaceholder: true });
            sets.push(chunk);
        }
        return sets;
    }, [products, itemsPerSet]);
    
    const totalSets = productSets.length;
    // Scrubber for dots
    const { containerRef, handlers } = useDotScrubber(totalSets, setPage);

    useEffect(() => setPage(0), [itemsPerSet, products]);

    // Swipe Handlers
    const onTouchStart = (e) => {
        touchEnd.current = null;
        touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    }
    const onTouchMove = (e) => {
        touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    }
    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const dx = touchStart.current.x - touchEnd.current.x;
        const dy = touchStart.current.y - touchEnd.current.y;
        
        // Ensure horizontal swipe is dominant
        if (Math.abs(dx) > Math.abs(dy)) { 
            if (Math.abs(dx) > minSwipeDistance) {
                if (dx > 0 && page < totalSets - 1) setPage(p => p + 1);
                if (dx < 0 && page > 0) setPage(p => p - 1);
            }
        }
    }
    
    if (products.length === 0) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 w-full relative group/carousel">
            <div className="mb-6">
                <h3 className="font-black text-[#514d46] text-lg md:text-xl lg:text-2xl flex items-center gap-2" style={{ fontFamily: '"Jua", sans-serif' }}>
                    <span className="text-[#d35153]">You May Also Like</span>
                </h3>
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className={`${NAV_BTN_BASE} hidden md:flex p-3 shrink-0 z-10`}><ChevronLeft size={24} /></button>
                
                <div 
                    className="overflow-hidden rounded-2xl flex-1 min-w-0 touch-pan-y" 
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform" style={{ transform: `translateX(-${page * 100}%)` }}>
                        {productSets.map((set, setIndex) => (
                            <div key={setIndex} className="w-full flex-shrink-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-1" style={{ flex: '0 0 100%' }}>
                                {set.map((p, i) => (
                                    p.isPlaceholder ? <div key={p.id} className="w-full h-full bg-transparent" /> : <ProductCard key={p.id} product={p} index={i} onOpen={onOpen} isMicro={true} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                
                <button onClick={() => setPage(p => Math.min(totalSets - 1, p + 1))} disabled={page >= totalSets - 1} className={`${NAV_BTN_BASE} hidden md:flex p-3 shrink-0 z-10`}><ChevronRight size={24} /></button>
            </div>

            {/* Dots (Hidden on Desktop) */}
            <div 
                ref={containerRef}
                {...handlers}
                className="flex md:hidden justify-center gap-2 mt-6 touch-none py-2"
            >
                {productSets.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`rounded-full transition-all duration-300 pointer-events-none ${page === idx ? 'bg-[#487ec8] w-4 h-2' : 'bg-[#514d46]/20 w-2 h-2'}`}
                    />
                ))}
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---

const ProductDetail = ({ product, productMap, onClose, onShopAll, onCategoryClick, onDecadeClick, onOpen }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => setHasMounted(true), []);
    
    // Reset on product change
    useEffect(() => { 
        setActiveIndex(0); 
        const container = document.getElementById("app-scroll-container"); 
        if (container) container.scrollTop = 0; 
        // document.title update removed in favor of Helmet
    }, [product]);

    const relatedProducts = useMemo(() => (product.relatedIds || []).map(id => productMap?.get(id)).filter(Boolean), [product.relatedIds, productMap]);
    
    // [UPDATED] - Implements Breadcrumb Schema
    const jsonLd = useMemo(() => JSON.stringify({
        "@context": "https://schema.org/",
        "@graph": [
            {
                "@type": "Product", 
                "name": product.name, 
                "image": product.processedImages?.map(img => img.original), 
                "description": product.description, 
                "brand": { "@type": "Brand", "name": product.manufacturer }, 
                "publisher": ORGANIZATION_SCHEMA,
                "offers": { 
                    "@type": "Offer", 
                    "priceCurrency": "GBP", 
                    "price": product.price, 
                    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    // FIX: Use static data instead of window.location.href
                    "url": `https://loftloot.co.uk/${product.fullSlug}/` 
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Catalogue", "item": "https://loftloot.co.uk/" },
                    { 
                        "@type": "ListItem", 
                        "position": 2, 
                        "name": product.collection, 
                        "item": `https://loftloot.co.uk/${product.collectionSlug}/` 
                    },
                    { "@type": "ListItem", "position": 3, "name": product.name }
                ]
            }
        ]
    }), [product]);

    // Construct the title parts (safety check for missing data)
    const titleParts = [product.name];
    if (product.manufacturer && product.manufacturer !== 'Unknown') titleParts.push(product.manufacturer);
    if (product.releaseDate && product.releaseDate !== 'Unknown') titleParts.push(product.releaseDate);
    
    const pageTitle = `${titleParts.join(' • ')} | Loft Loot`;

    return (
        <div className="min-h-screen bg-[#fffbf0] text-[#514d46] font-sans relative z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
            {/* --- SEO METADATA --- */}
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={product.description.substring(0, 160)} />
                <meta property="og:title" content={`${product.name} - Vintage ${product.manufacturer} ${product.releaseDate}`} />
                <meta property="og:description" content={product.description.substring(0, 160)} />
                <meta property="og:image" content={product.mainImage} />
                <meta property="og:type" content="product" />
                <meta name="twitter:card" content="summary_large_image" />
                {product.slug && <link rel="canonical" href={`https://loftloot.co.uk/${product.slug}`} />}
            </Helmet>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
            
            <Lightbox 
                isOpen={isLightboxOpen} 
                onClose={() => setIsLightboxOpen(false)} 
                images={product.processedImages || []} 
                initialIndex={activeIndex} 
            />

            <div className="bg-[#f2e9d9] pb-12 pt-6 relative w-full">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
                    
                    {/* BREADCRUMBS */}
                    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-2 mb-6 text-xs md:text-sm font-bold uppercase tracking-wider text-[#514d46]/60">
                        <button onClick={onShopAll} className={`hover:text-[#487ec8] ${hasMounted ? 'transition-colors' : ''}`}>Catalogue</button>
                        <ChevronRight size={12} className="opacity-40" />
                        <button onClick={() => onCategoryClick(product.collection)} className={`hover:text-[#487ec8] ${hasMounted ? 'transition-colors' : ''}`}>{product.collection}</button>
                        <ChevronRight size={12} className="opacity-40" />
                        <button onClick={() => onDecadeClick(product.decade)} className={`hover:text-[#487ec8] ${hasMounted ? 'transition-colors' : ''}`}>{product.decade}</button>
                        <ChevronRight size={12} className="opacity-40 hidden md:block" />
                        <span className="text-[#514d46] opacity-100 truncate max-w-[200px] hidden md:inline">{product.name}</span>
                    </nav>

                    {/* MOBILE HEADER */}
                    <div className="block md:hidden mb-6">
                        <ProductHeader product={product} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start">
                        
                        {/* LEFT COL: GALLERY */}
                        <div className="md:col-span-7 w-full">
                            <ProductGallery 
                                product={product} 
                                activeIndex={activeIndex} 
                                setActiveIndex={setActiveIndex} 
                                onOpenLightbox={(idx) => { setActiveIndex(idx); setIsLightboxOpen(true); }}
                                onClose={onClose}
                            />
                        </div>

                        {/* RIGHT COL: INFO */}
                        <div className="md:col-span-5 flex flex-col h-full">
                            
                            {/* DESKTOP HEADER (UPDATED: Uniform light border) */}
                            <div className="hidden md:block border-b-2 border-[#514d46]/5 pb-6 mb-6">
                                <ProductHeader product={product} />
                            </div>

                            {/* MOBILE ONLY HR (UPDATED: Uniform light border & correct spacing) */}
                            <hr className="md:hidden border-t-2 border-[#514d46]/5 mb-8 -mt-4" />

                            {/* SPECS */}
                            <div className="pt-0 pb-6 border-b-2 border-[#514d46]/5 mb-6">
                                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                    <SpecItem label="Brand" value={product.brand} />
                                    <SpecItem label="Manufacturer" value={product.manufacturer} />
                                    <SpecItem label="Type" value={product.type} />
                                    <SpecItem label="Release" value={product.releaseDate} />
                                    <SpecItem label="Line" value={product.line} />
                                    <SpecItem label="Condition" value={product.condition} />
                                </div>
                            </div>

                            {/* DESCRIPTION */}
                            {/* UPDATED: Removed bottom margins to let HR handle even spacing */}
                            <div className="prose prose-stone max-w-none text-[#514d46] text-base leading-relaxed [&>*:last-child]:mb-0 mb-0">
                                <p>{product.description}</p>
                                <p className="text-sm md:text-base text-[#514d46]/80 font-medium mt-6 italic">Photos represent the actual item you will receive. All photos and videos were taken by us.</p>
                            </div>

                            {/* ACTIONS */}
                            <div className="mt-0">
                                {/* UPDATED: my-8 guarantees absolutely identical space above/below line */}
                                <hr className="border-t-2 border-[#514d46]/5 my-8" />
                                <div className="flex flex-col gap-3">
                                    {product.links && product.links.length > 0 ? (
                                        product.links.map((link, i) => (
                                            product.isSold ? (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-xl border-2 border-[#514d46]/10 bg-white/50 text-[#514d46]/40 font-bold cursor-default">
                                                    <span className="flex items-center gap-2">
                                                        <Archive size={18} />
                                                        <span className="flex items-center gap-1.5 text-sm md:text-base">
                                                            <span>Sold on</span>
                                                            {link.logo ? <img src={link.logo} alt={link.platform} style={{ height: '18px', width: 'auto' }} className="object-contain translate-y-[1px] -translate-x-[1px] grayscale opacity-50" /> : link.platform}
                                                        </span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-4 rounded-xl border-2 border-[#514d46] bg-white group font-bold shadow-sm ${hasMounted ? 'hover:bg-[#514d46] hover:text-white transition-all duration-300' : ''}`}>
                                                    <span className="flex items-center gap-2">
                                                        <ShoppingBag size={18} />
                                                        <span className="flex items-center gap-1.5 text-sm md:text-base">
                                                            <span>Buy on</span>
                                                            {link.logo ? <img src={link.logo} alt={link.platform} style={{ height: '18px', width: 'auto' }} className="object-contain translate-y-[1px] -translate-x-[1px]" /> : link.platform}
                                                        </span>
                                                    </span>
                                                    <ExternalLink size={18} className="opacity-50 group-hover:opacity-100" />
                                                </a>
                                            )
                                        ))
                                    ) : !product.isSold ? (
                                        <button disabled className="w-full p-4 rounded-xl bg-[#514d46]/10 text-[#514d46]/40 font-bold cursor-not-allowed">Purchase Link Unavailable</button>
                                    ) : null}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <JaggedLine position="bottom" color="#f2e9d9" />
            </div>

            <div className="bg-[#fffbf0] py-12">
                <RelatedProductsCarousel products={relatedProducts} onOpen={onOpen} />
            </div>
        </div>
    );
};

export default ProductDetail;
