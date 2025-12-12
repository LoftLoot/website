// src/components/About.js
import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
// FIX: Import image directly
import siblingImg from '../images/us.png';

// --- SHARED COMPONENT ---
export const JaggedLine = React.memo(({ position, color = "#f4e799" }) => (
    <div 
        // FIX: Changed -top-[10px] to -top-[9px] and -bottom-[10px] to -bottom-[9px]
        // This creates a 1px overlap to prevent "white line" gaps on mobile screens due to sub-pixel rendering.
        className={`absolute left-0 right-0 h-[10px] w-full z-20 ${position === 'top' ? '-top-[9px]' : '-bottom-[9px] rotate-180'}`} 
        style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='10' viewBox='0 0 30 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 L15 0 L30 10 Z' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E")`, 
            backgroundSize: '30px 10px', 
            backgroundRepeat: 'repeat-x' 
        }} 
    />
));
JaggedLine.displayName = 'JaggedLine';

// --- MAIN COMPONENT ---

const About = () => {
    const [isPeeled, setIsPeeled] = useState(false);

    useEffect(() => { document.title = "About Us | Loft Loot"; }, []);

    return (
        <>
            {/* TOP SECTION: STORY - Cream Background */}
            <div className="relative bg-[#f2e9d9] text-[#514d46] mb-12 pb-12">
                <div className="max-w-3xl mx-auto px-4 pt-12 relative z-10">
                    
                    <div className="space-y-8 leading-relaxed text-sm md:text-base lg:text-lg relative text-left text-[#514d46]">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#514d46] leading-tight" style={{ fontFamily: '"Jua", sans-serif' }}>About Us</h1>
                        </div>

                        {/* BROTHER */}
                        <div className="float-left mr-6 mb-2 relative select-none z-10 w-[90px] md:w-[115px]" style={{ transform: 'translateY(-1rem)' }}>
                            <div className="absolute top-2 left-1 bg-[#fffbf0] -rotate-12 w-full h-[85px] md:h-[120px]"></div>
                            <div className="relative overflow-hidden -rotate-3 w-full h-[110px] md:h-[150px]">
                                <img src={siblingImg} alt="Brother" className="absolute h-full max-w-none object-cover object-left" style={{ left: '15px', width: 'auto' }} />
                            </div>
                        </div>

                        <p>We are a brother and sister who grew up in the North East in the early '90s. Like most kids, we spent every Christmas circling <i>all the things</i> in the Argos catalogue.</p>
                        
                        <p>Recently, while looking through <a href="https://retromash.com/argos/" target="_blank" rel="noopener noreferrer" className="font-bold text-[#d35153] transition-all hover:brightness-110">archived catalogues</a> online, we realized we actually still own most of it. It's been sitting in our parents' loft for decades! We've decided to catalog our collection here, hoping to find new homes for them with people who appreciate them as much as we did.</p>

                        {/* SISTER */}
                        <div className="float-right ml-6 mb-1 relative select-none z-10 w-[115px] md:w-[160px]" style={{ transform: 'translateY(-0.5rem)' }}>
                            <div className="absolute top-2 right-1 bg-[#fffbf0] rotate-12 w-[90%] h-[85px] md:h-[120px]"></div>
                            <div className="relative overflow-hidden rotate-3 w-full h-[110px] md:h-[150px]">
                                <img src={siblingImg} alt="Sister" className="absolute h-full max-w-none object-cover object-right" style={{ right: '15px', width: 'auto' }} />
                            </div>
                        </div>

                        <p>We aren't resellers. Every item has been played with and loved.</p>

                        <p>We hope you find an old favourite, or finally get your hands on that one thing Santa never brought.</p>
                        
                        <div className="clear-both"></div>

                        <div className="text-sm text-[#514d46]/60 italic mt-4 pt-2">
                            Artwork by Shishido Doshi.
                        </div>
                    </div>
                </div>
                <JaggedLine position="bottom" color="#f2e9d9" />
            </div>

            {/* BOTTOM SECTION: CONTACT */}
            <div className="max-w-3xl mx-auto px-4 pb-20 relative z-10">
                <div className="text-center flex flex-col items-center justify-center">
                    <h3 className="text-xl md:text-2xl font-black text-[#514d46] mb-4" style={{ fontFamily: '"Jua", sans-serif' }}>Get in Touch</h3>
                    <p className="opacity-60 text-sm md:text-base max-w-md mx-auto">Have a question about a specific item? We'd love to hear from you.</p>
                    
                    <div className="relative mt-8 h-16 w-64 mx-auto flex items-center justify-center group sticker-container">
                        <div className="absolute inset-0 flex items-center justify-center bg-white border-2 border-[#f4e799] border-dashed rounded-xl z-0 shadow-sm">
                            <a href="mailto:hello@loftloot.co.uk" className="font-bold text-[#d35153] text-lg hover:underline">hello@loftloot.co.uk</a>
                        </div>
                        <button 
                            onClick={() => setIsPeeled(true)} 
                            className={`sticker-front absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#487ec8] text-white font-bold text-lg rounded-xl cursor-pointer overflow-hidden hover:bg-[#3a66a3] transition-colors ${isPeeled ? 'animate-tear-off pointer-events-none' : ''}`} 
                            aria-label="Reveal Email"
                        >
                            <Mail size={20} className="relative z-10" /><span className="relative z-10">Email Us</span>
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

export default About;
