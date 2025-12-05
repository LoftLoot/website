import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';

// --- SHARED COMPONENTS ---

// Exporting JaggedLine in case other components need it later
export const JaggedLine = React.memo(({ position, color = "#f4e799" }) => (
    <div 
        className={`absolute left-0 right-0 h-[10px] w-full z-20 ${position === 'top' ? '-top-[10px]' : '-bottom-[10px] rotate-180'}`} 
        style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='10' viewBox='0 0 30 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 L15 0 L30 10 Z' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E")`, 
            backgroundSize: '30px 10px', 
            backgroundRepeat: 'repeat-x' 
        }} 
    />
));
JaggedLine.displayName = 'JaggedLine';

// --- MAIN COMPONENT ---

const AboutSection = () => {
    const [isPeeled, setIsPeeled] = useState(false);

    // Canvas SEO stub - safe to keep or remove if managed by App.js
    useEffect(() => { document.title = "About Us | LoftLoot"; }, []);

    // CONSTANTS
    const SIBLING_IMG = "https://raw.githubusercontent.com/LoftLoot/site/refs/heads/main/images/us.png";
    const BOY_WIDTH = "92px";
    const GIRL_WIDTH = "119px"; 
    const IMG_HEIGHT = "122px";

    return (
        <>
            {/* TOP SECTION: STORY */}
            <div className="relative bg-[#f2e9d9] text-[#514d46] transition-all duration-500 mb-12 pb-12">
                <div className="max-w-2xl mx-auto px-6 pt-12 relative z-10">
                    
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black text-[#514d46] leading-tight" style={{ fontFamily: '"Jua", sans-serif' }}>About Us</h1>
                    </div>

                    <div className="leading-relaxed text-lg text-left">
                        
                        {/* --- TOP LEFT: BROTHER --- */}
                        <div className="float-left mr-8 mb-2 relative group cursor-pointer select-none z-10">
                            {/* Yellow Backing */}
                            <div 
                                className="absolute top-2 -left-2 bg-[#f4e799] rounded-xl -rotate-12 shadow-sm transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105"
                                style={{ width: BOY_WIDTH, height: '100px' }}
                            ></div>
                            {/* Character Mask */}
                            <div 
                                className="relative overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
                                style={{ width: BOY_WIDTH, height: IMG_HEIGHT }}
                            >
                                <img 
                                    src={SIBLING_IMG} 
                                    alt="Brother" 
                                    className="absolute h-full max-w-none object-cover object-left"
                                    style={{ left: '0', width: 'auto' }} 
                                />
                            </div>
                        </div>

                        <p className="font-medium mb-8">We are a brother and sister who grew up in the North East of England in the early '90s. Like most kids, we spent every Christmas circling <i>all the things</i> in the Argos catalogue.</p>
                        
                        <p className="mb-8">Recently, while looking through <a href="https://retromash.com/argos/" target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-2 decoration-[#487ec8]/50 hover:decoration-[#487ec8] hover:text-[#487ec8] transition-all">archived catalogues</a> online, we realized we actually still own most of it. It's been sitting in our parents' loft for decades! We've decided to catalog our collection here, hoping to find new homes for them with people who appreciate them as much as we did.</p>

                        {/* --- BOTTOM RIGHT: SISTER --- */}
                        <div className="float-right ml-8 mb-1 mt-1 relative group cursor-pointer select-none z-10">
                            {/* Yellow Backing */}
                            <div 
                                className="absolute top-2 -right-1 bg-[#f4e799] rounded-xl rotate-12 shadow-sm transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105"
                                style={{ width: GIRL_WIDTH, height: '100px' }}
                            ></div>
                            {/* Character Mask */}
                            <div 
                                className="relative overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
                                style={{ width: GIRL_WIDTH, height: IMG_HEIGHT }}
                            >
                                <img 
                                    src={SIBLING_IMG} 
                                    alt="Sister" 
                                    className="absolute h-full max-w-none object-cover object-right"
                                    style={{ right: '0', width: 'auto' }}
                                />
                            </div>
                        </div>

                        <p className="mb-8">We aren't resellers. Every item has been played with and loved.</p>

                        <p className="font-bold text-[#514d46]">We hope you find an old favourite, or finally get your hands on that one thing Santa never brought.</p>
                        
                        {/* Clear floats */}
                        <div className="clear-both"></div>

                        <div className="pt-3 mt-8 border-t-2 border-[#514d46]/10">
                            <p className="text-sm text-[#514d46]/60 italic">Artwork by Shishido Doshi.</p>
                        </div>
                    </div>
                </div>
                {/* Jagged Divider */}
                <JaggedLine position="bottom" color="#f2e9d9" />
            </div>

            {/* BOTTOM SECTION: CONTACT */}
            <div className="max-w-3xl mx-auto px-4 pb-20 relative z-10">
                <div className="text-center space-y-6 relative overflow-hidden flex flex-col items-center justify-center">
                    <h3 className="text-2xl font-black text-[#514d46]" style={{ fontFamily: '"Jua", sans-serif' }}>Get in Touch</h3>
                    <p className="opacity-60 text-lg max-w-md mx-auto">Have a question about a specific item? We'd love to hear from you.</p>
                    
                    <div className="relative mt-8 h-16 w-64 mx-auto flex items-center justify-center group sticker-container">
                        <div className="absolute inset-0 flex items-center justify-center bg-white border-2 border-[#487ec8] border-dashed rounded-xl z-0 shadow-sm">
                            <a href="mailto:hello@loftloot.co.uk" className="font-bold text-[#d35153] text-xl hover:underline">hello@loftloot.co.uk</a>
                        </div>
                        <button 
                            onClick={() => setIsPeeled(true)} 
                            className={`sticker-front absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#487ec8] text-white font-bold text-xl rounded-xl border-2 border-white shadow-md cursor-pointer overflow-hidden ${isPeeled ? 'animate-tear-off pointer-events-none' : ''}`} 
                            aria-label="Reveal Email"
                        >
                            <Mail size={20} className="relative z-10" /><span className="relative z-10">Email Us</span>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 rounded-xl pointer-events-none z-0"></div>
                            <div className="sticker-curl absolute top-0 right-0 w-0 h-0 bg-[#fffbf0] shadow-[-2px_2px_5px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out z-20 pointer-events-none" style={{ borderBottomLeftRadius: '10px' }}></div>
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default AboutSection;