// src/components/Footer.js
import React from 'react';
import { JaggedLine } from './About';
import { Logo } from './Header';

const Footer = () => {
    return (
        <>
            {/* FIX: Little spacer to prevent content touching the footer jagged line */}
            <div className="h-10 w-full shrink-0"></div>

            <footer className="relative bg-[#f4e799] mt-auto pt-12 pb-12 z-50">
                <JaggedLine position="top" />
                <div className="max-w-7xl mx-auto px-2 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                    
                    {/* Column 1: Logo */}
                    <div className="flex justify-center md:justify-start">
                        <Logo className="scale-75 origin-center md:origin-left" />
                    </div>

                    {/* Column 2: Middle Spacer (Hidden on mobile to avoid gaps) */}
                    <div className="hidden md:block"></div>

                    {/* Column 3: Disclaimer */}
                    <div className="text-center md:text-right">
                        <p className="text-xs text-[#514d46]/60 font-medium leading-relaxed">
                            © {new Date().getFullYear()} Loft Loot. 
                            <br />
                            Items are part of a private collection and are sold as-is. 
                            <br />
                            We have no affiliation with the original brands, manufacturers or retailers of the products listed.
                        </p>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;



