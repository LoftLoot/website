// src/components/Hero.js
import React from 'react';
import { JaggedLine } from './About';
import headerImg from '../images/header_full.png'; 

const Hero = () => {
  return (
    <div
      className="relative bg-[#f4e799] text-[#514d46] mb-8 flex flex-row justify-center overflow-visible h-[clamp(200px,35vw,400px)]"
    >
      <div className="w-full mx-auto px-4 pt-2 pb-0 relative z-10 flex flex-row flex-nowrap items-center gap-4 h-full">

        {/* TEXT COLUMN */}
        <div className="relative z-30 shrink-0 flex flex-col items-start justify-center select-none w-fit max-w-[50%] md:max-w-[60%]">
          <h2
            className="font-black text-[#514d46] text-left leading-none whitespace-normal md:whitespace-nowrap text-[1.75rem] md:text-5xl lg:text-6xl"
            style={{
              fontFamily: '"Jua", sans-serif',
              textShadow: '0 0 30px rgba(244, 231, 153, 0.8), 0 0 15px rgba(244, 231, 153, 0.5)',
            }}
          >
            From our <span className="text-[#d35153]">loft</span>
            <br />
            to your <span className="text-[#487ec8]">home.</span>
          </h2>

          <div className="w-0 min-w-full pt-2 md:pt-6 pointer-events-none relative">
            {/* FIX: Changed w-[125%] to w-full md:w-[125%] to prevent blowout on small screens */}
            <p
              className="text-[#514d46] leading-relaxed text-xs md:text-base lg:text-lg w-full md:w-[125%]"
              style={{
                textShadow: '0 0 30px rgba(244, 231, 153, 0.8), 0 0 15px rgba(244, 231, 153, 0.5)',
              }}
            >
              Our genuine childhood collection, unboxed after decades{'\u00A0'}of{'\u00A0'}being
              in storage.
              <span className="hidden md:inline">
                {' '}Find the old favourite you{'\u00A0'}forgot{'\u00A0'}you loved.
              </span>
            </p>
          </div>
        </div>

        {/* IMAGE COLUMN */}
        <div className="flex-1 relative z-10 flex justify-end items-center h-full pt-4 pb-0 -mt-4 md:-mt-8 overflow-visible">
          <img
            src={headerImg}
            alt=""
            // FIX: Changed from fetchPriority to fetchpriority
            fetchpriority="high"
            loading="eager"
            className="w-full h-full object-contain object-right"
          />
        </div>
      </div>

      <JaggedLine position="bottom" />
    </div>
  );
};

export default Hero;
