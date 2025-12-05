// src/components/Hero.js
import React from 'react';
import { JaggedLine } from './AboutSection';

const Hero = () => {
    return (
        <div className="relative bg-[#f4e799] text-[#514d46] transition-all duration-500 mb-8">
            <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
                <div 
                    className="absolute top-4 bottom-4 right-4 left-4 z-0 pointer-events-none [background-position:right_center] lg:[background-position:95%_center]" 
                    style={{ 
                        backgroundImage: 'url("https://raw.githubusercontent.com/LoftLoot/site/refs/heads/main/images/header_full.png")', 
                        backgroundSize: 'contain', 
                        backgroundRepeat: 'no-repeat' 
                    }} 
                />
                <div className="relative z-10 text-left">
                    <h2 className="text-4xl md:text-6xl lg:text-6xl font-black mb-6 leading-tight text-[#514d46]" style={{ fontFamily: '"Jua", sans-serif', textShadow: '0 0 30px rgba(244, 231, 153, 0.8), 0 0 15px rgba(244, 231, 153, 0.5)' }}>
                        From our <span className="text-[#d35153]">loft</span><br />to your <span className="text-[#487ec8]">home.</span>
                    </h2>
                    <p className="text-[#514d46] text-lg md:text-xl leading-relaxed max-w-[90%] md:max-w-[28rem]" style={{ textShadow: '0 0 30px rgba(244, 231, 153, 0.8), 0 0 15px rgba(244, 231, 153, 0.5)' }}>
                        Our genuine childhood collection, unboxed after decades of being in storage. Find the old favourite you forgot you loved.
                    </p>
                </div>
            </div>
            <JaggedLine position="bottom" />
        </div>
    );
};

export default Hero;