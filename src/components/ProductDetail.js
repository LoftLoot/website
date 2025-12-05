// src/components/ProductDetail.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ExternalLink, ShoppingBag, PlayCircle } from 'lucide-react';
import { JaggedLine } from './AboutSection'; // Reuse component
import ProductCard from './ProductCard'; // Reuse card for related items

// --- HOOKS ---

const useImageZoom = () => {
    const [isActive, setIsActive] = useState(false);
    const imgRef = useRef(null);
    
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
        if (!isActive || !imgRef.current) return;
        const { clientX, clientY, currentTarget } = e;
        const rect = currentTarget.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        imgRef.current.style.transformOrigin = `${x}% ${y}%`;
    }, [isActive]);

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
    const { isActive, imgRef, handleImageClick, handleImageMouseMove, handleMouseLeave } = useImageZoom();
    // Use processedImages from data.js
    const images = product.processedImages || []; 
    const { thumbsRef, showLeft, showRight, scrollThumbs } = useThumbScroll(images);
    
    // Reset image on product change
    useEffect(() => { setActiveImgIndex(0); }, [product.id]);

    // Resolve related products using the passed productMap prop
    const relatedProducts = (product.relatedIds || [])
        .map(id => productMap?.get(id))
        .filter(Boolean)
        .slice(0, 4);

    const activeMedia = images[activeImgIndex];

    return (
        <div className="min-h-screen bg-[#fffbf0] text-[#514d46] font-sans pb-0 animate-fade-in relative z-50">
            
            <div className="bg-[#f2e9d9] pb-16 pt-8 relative">
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

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        
                        {/* LEFT COLUMN: IMAGES */}
                        <div className="lg:col-span-7 self-start space-y-4">
                            <div className="aspect-[4/5] bg-white rounded-2xl overflow-hidden border-4 border-white shadow-xl shadow-[#514d46]/5 relative group select-none">
                                {activeMedia?.isVideo ? (
                                    <iframe 
                                        width="100%" height="100%" 
                                        src={`https://www.youtube.com/embed/${activeMedia.videoId}?autoplay=1`} 
                                        title="YouTube video player" 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen 
                                        className="absolute inset-0 w-full h-full"
                                    />
                                ) : (
                                    <div className="w-full h-full cursor-zoom-in" onClick={handleImageClick} onMouseMove={handleImageMouseMove} onMouseLeave={handleMouseLeave}>
                                         <img 
                                            ref={imgRef} 
                                            src={activeMedia?.original || activeMedia?.thumbnail} 
                                            alt={product.name} 
                                            className="w-full h-full object-contain transition-transform duration-200" 
                                            style={{ transform: isActive ? 'scale(2.5)' : 'scale(1)' }}
                                        />
                                    </div>
                                )}
                                {product.isSold && <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"><div className="bg-[#d35153]/90 text-white text-3xl font-black px-8 py-4 -rotate-12 border-4 border-white shadow-2xl uppercase tracking-widest">Sold Out</div></div>}
                            </div>
                            
                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="flex items-center gap-2">
                                     <button onClick={() => scrollThumbs('left')} disabled={!showLeft} className="bg-white/90 border border-[#487ec8]/20 text-[#487ec8] shadow-lg rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-30"><ChevronLeft size={18} /></button>
                                    <div ref={thumbsRef} className="flex gap-3 overflow-x-auto pb-2 no-scrollbar flex-1 px-1">
                                        {images.map((img, idx) => (
                                            <button key={idx} onClick={() => setActiveImgIndex(idx)} className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all relative ${activeImgIndex === idx ? 'border-[#487ec8] ring-2 ring-white shadow-md' : 'border-transparent opacity-60 hover:opacity-100'} bg-white`}>
                                                <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                                                {img.isVideo && <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white"><PlayCircle size={24} fill="rgba(0,0,0,0.5)" /></div>}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => scrollThumbs('right')} disabled={!showRight} className="bg-white/90 border border-[#487ec8]/20 text-[#487ec8] shadow-lg rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-30"><ChevronRight size={18} /></button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: INFO */}
                        <div className="lg:col-span-5 select-text">
                            
                            {/* Header Section */}
                            <div className="border-b-2 border-[#514d46]/5 pb-6">
                                <div className="mb-2 text-xs font-bold text-[#514d46]/60 uppercase tracking-wider">{product.manufacturer}</div>
                                <h1 className="text-3xl md:text-4xl font-black text-[#514d46] leading-tight mb-4" style={{ fontFamily: '"Jua", sans-serif' }}>{product.name}</h1>
                                <div className="flex items-center justify-between">
                                    <span className={`text-3xl font-mono font-bold ${!product.isSold ? 'text-[#487ec8]' : 'text-[#514d46]/40 decoration-double'}`}>£{product.price.toFixed(2)}</span>
                                    {!product.isSold
                                        ? <span className="flex items-center gap-1.5 text-xs font-black bg-[#487ec8]/10 text-[#487ec8] px-3 py-1 rounded-full uppercase tracking-wider"><div className="w-2 h-2 rounded-full bg-[#487ec8]"></div> In Stock</span> 
                                        : <span className="text-xs font-black bg-[#d35153]/10 text-[#d35153] px-3 py-1 rounded-full uppercase tracking-wider">Sold Out</span>
                                    }
                                </div>
                            </div>

                            {/* Technical Specs */}
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

                            {/* Description */}
                             <div className="pt-6 prose prose-lg text-[#514d46]/80 leading-relaxed font-outfit">
                                 <p>{product.description}</p>
                             </div>

                            {/* Dynamic Actions */}
                            <div className="pt-8 space-y-3">
                                {product.links && product.links.length > 0 ? (
                                    product.links.map((link, i) => (
                                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-4 rounded-xl bg-[#514d46] text-white hover:bg-[#3f3b36] transition-all duration-300 group font-bold shadow-lg hover:shadow-xl active:scale-[0.98]">
                                            <span className="flex items-center gap-3">
                                                <ShoppingBag size={20} />
                                                <span>Buy on {link.platform}</span>
                                            </span>
                                            <div className="flex items-center gap-3">
                                                {link.logo && <img src={link.logo} alt={link.platform} className="h-6 brightness-0 invert opacity-50 group-hover:opacity-100 transition-opacity" />}
                                                <ExternalLink size={20} className="opacity-50 group-hover:opacity-100" />
                                            </div>
                                        </a>
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