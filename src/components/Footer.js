// src/components/Footer.js
import React from 'react';
import { JaggedLine } from './About';
import { Logo } from './Header';

const Footer = () => {
    return (
        <footer className="relative bg-[#f4e799] mt-auto pt-12 pb-12 z-10">
            <JaggedLine position="top" />
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 opacity-50">
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-500">
                    <Logo className="scale-75 origin-left" />
                </div>
                <div className="text-center md:text-right">
                    <p className="text-xs text-[#514d46] font-medium">© {new Date().getFullYear()} Loft Loot. <br/>Items are part of a private collection and are sold as-is. We have no affiliation <br />with the original brands, manufacturers or retailers of the products listed.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
