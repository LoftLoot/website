// src/data.js

// --- HELPER FUNCTIONS ---
export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export const normalizeText = (text) => {
    if (!text) return "";
    return text.toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

export const extractYouTubeId = (url) => {
    if (url.includes('youtu.be/')) return url.split('/').pop();
    if (url.includes('youtube.com/watch')) try { return new URL(url).searchParams.get('v'); } catch (e) { return null; }
    return null;
};

export const generateYearTokens = (product) => {
    const tokens = new Set();
    if (product.releaseDate) {
        const year = product.releaseDate;
        for (let i = -2; i <= 2; i++) { tokens.add((year + i).toString()); }
        const decadeStart = Math.floor(year / 10) * 10;
        tokens.add(`${decadeStart}s`);
        tokens.add(decadeStart.toString());
        tokens.add(`${decadeStart.toString().substring(2)}s`);
        tokens.add(decadeStart.toString().substring(2));
        tokens.add(year.toString().substring(0, 3)); 
    }
    return Array.from(tokens);
};

// --- CONSTANTS ---
export const BASE_LOGOS = {
    "eBay": process.env.PUBLIC_URL + "/images/logos/logo_ebay.png",
    "Etsy": process.env.PUBLIC_URL + "/images/logos/logo_etsy.png"
};

export const ITEMS_PER_PAGE = 12;

export const FILTER_COLORS = {
    Era: "#79aa6b", Collection: "#f0c83c", Type: "#d35153", Price: "#d99875"
};

export const TYPE_CONFIG = {
    "Action Figure": { shorthand: "Figures", plural: "Action Figures" },
    "Playset": { shorthand: "Playsets", plural: "Playsets" },
    "Vehicle": { shorthand: "Vehicles", plural: "Vehicles" },
    "Plush": { shorthand: "Plush", plural: "Plush Toys" },
    "Art Toy": { shorthand: "Art Toys", plural: "Art Toys" },
    "Home Decor": { shorthand: "Decor", plural: "Home Decor" },
    "Electronics": { shorthand: "Electronics", plural: "Electronics" },
    "Board Game": { shorthand: "Board Games", plural: "Board Games" },
};

export const ORGANIZATION_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "Organization", "name": "LoftLoot", "url": "https://loftloot.co.uk", "logo": "https://loftloot.co.uk/logo.png",
    "sameAs": ["https://twitter.com/loftloot", "https://instagram.com/loftloot"]
};

export const SORT_STRATEGIES = {
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    'name-asc': (a, b) => a.lowerName.localeCompare(b.lowerName),
    'name-desc': (a, b) => b.lowerName.localeCompare(a.lowerName),
    'latest': (a, b) => b.id - a.id
};

export const SORT_OPTIONS = [
    { label: "Latest", value: "latest" },
    { label: "Name: A - Z", value: "name-asc" },
    { label: "Name: Z - A", value: "name-desc" },
    { label: "Price: Low to High", value: "price-low" },
    { label: "Price: High to Low", value: "price-high" },
];

export const PRELOAD_CACHE = new Map();
export const addToBoundedCache = (cache, key, value, limit) => {
    if (cache.has(key)) cache.delete(key);
    cache.set(key, value);
    if (cache.size > limit) cache.delete(cache.keys().next().value);
};

// --- GLOBAL OBSERVER ---
export const GlobalObserver = { 
    observer: null, 
    elements: new Map(), 
    
    init() { 
        if (typeof window === 'undefined') return; 
        this.setupObserver('600px'); 
    }, 
    
    setupObserver(margin) { 
        if (this.observer) this.observer.disconnect(); 
        
        this.observer = new IntersectionObserver((entries) => { 
            entries.forEach(entry => { 
                if (entry.isIntersecting) { 
                    const cb = this.elements.get(entry.target); 
                    if (cb) cb(); 
                    this.unobserve(entry.target); 
                } 
            }); 
        }, { rootMargin: `0px 0px ${margin} 0px` }); 

        this.elements.forEach((_, el) => this.observer.observe(el)); 
    }, 
    
    observe(el, cb) { 
        if (!this.observer) this.init(); 
        if (this.elements.has(el)) return; 
        
        this.elements.set(el, cb); 
        this.observer.observe(el); 
    }, 
    
    unobserve(el) { 
        if (!el) return; 
        this.elements.delete(el); 
        if (this.observer) this.observer.unobserve(el); 
    }
}; 

// --- DATA PROCESSOR ---

export const processProductData = (rawProducts) => {
    if (!rawProducts || !Array.isArray(rawProducts)) return null;

    const intermediate = rawProducts.map(product => {
        const processedImages = (product.images || []).map(url => {
            const videoId = extractYouTubeId(url);
            let finalUrl = url;
            if (!videoId && url.startsWith('/')) {
                finalUrl = process.env.PUBLIC_URL + url;
            }

            return { 
                original: finalUrl, 
                thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : finalUrl, 
                isVideo: !!videoId, 
                videoId: videoId 
            };
        });
        
        const fallbackColor = "cbd5e1";
        const tinyPlaceholder = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23${product.imageColor || fallbackColor}'/%3E%3C/svg%3E`;
        
        const collectionName = product.collection || "Other";
        const collectionSlug = slugify(collectionName);
        const itemSlug = slugify(`${product.releaseDate || 'vintage'}-${product.manufacturer}-${product.name}`);
        const fullSlug = `${collectionSlug}/${itemSlug}`;

        return {
            ...product,
            collection: collectionName,
            collectionSlug, // NEW
            itemSlug,       // NEW
            fullSlug,       // NEW: Combined for easier linking
            decade: product.releaseDate ? `${Math.floor(product.releaseDate / 10) * 10}s` : 'Unknown',
            lowerName: normalizeText(product.name),
            lowerBrand: normalizeText(product.brand),
            lowerManufacturer: normalizeText(product.manufacturer),
            lowerCollection: normalizeText(collectionName),
            lowerType: normalizeText(product.type),
            lowerDescription: normalizeText(product.description),
            isSold: product.stock < 1,
            processedImages,
            mainImage: processedImages.find(img => !img.isVideo)?.thumbnail || processedImages[0]?.thumbnail,
            tinyPlaceholder,
            imageColor: product.imageColor || fallbackColor,
            links: (product.links || []).map(l => ({ ...l, logo: BASE_LOGOS[l.platform] })),
            schemaCondition: (product.condition && product.condition.toLowerCase().includes('new')) ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
        };
    });

    const finalProducts = intermediate.map(p1 => {
        const candidates = intermediate.filter(p2 => p2.id !== p1.id && !p2.isSold);
        const scoredCandidates = candidates.map(p2 => {
            let score = 0;
            if (p2.collection === p1.collection) score += 10;
            if (p2.type === p1.type) score += 8;
            if (p2.decade === p1.decade) score += 5;
            if (p2.manufacturer === p1.manufacturer) score += 3;
            if (p2.demographic === p1.demographic) score += 2;
            else if (p2.demographic === 'neutral' || p1.demographic === 'neutral') score += 1;
            return { id: p2.id, score };
        }).filter(item => item.score > 0);
        
        scoredCandidates.sort((a, b) => b.score - a.score);
        let limit = 5; 
        const superRelevantCount = scoredCandidates.filter(c => c.score >= 18).length;
        if (superRelevantCount > 10) limit = Math.min(superRelevantCount, 20);
        else if (scoredCandidates.filter(c => c.score >= 10).length >= 5) limit = 10;
        
        return { ...p1, relatedIds: scoredCandidates.slice(0, limit).map(s => s.id) };
    });

    const productMap = new Map(finalProducts.map(p => [p.id, p]));
    const slugMap = new Map(finalProducts.map(p => [p.fullSlug, p]));
    // NEW: Map to find Collection Name by Collection Slug
    const collectionSlugMap = new Map(finalProducts.map(p => [p.collectionSlug, p.collection])); 

    const collections = [...new Set(finalProducts.map(p => p.collection))].sort((a, b) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b));
    const decades = [...new Set(finalProducts.map(p => p.decade).filter(Boolean))].sort();
    const types = [...new Set(finalProducts.map(p => p.type).filter(Boolean))];
    const maxPrice = Math.max(...finalProducts.map(p => p.price));
    const minPrice = Math.min(...finalProducts.map(p => p.price));

    return {
        products: finalProducts,
        productMap,
        slugMap,
        collectionSlugMap,
        collections,
        decades,
        types,
        minPrice,
        maxPrice
    };
};

export const COLLECTION_DESCRIPTIONS = {
    "Thundercats": "Vintage 1985 LJN Thundercats toys for sale. Explore iconic figures like Lion-O and Mumm-Ra, original vehicles like the Thundertank, and playsets.",
    "WWF": "The complete 1990-1994 WWF Hasbro line for sale. Golden era wrestling action figures featuring Hulk Hogan, Ultimate Warrior, Randy Savage, and more.",
    "TMNT": "Original 90s Playmates Teenage Mutant Ninja Turtles figures for sale. Includes Leonardo, Donatello, Michelangelo, Raphael, and classic villains.",
    "Pokémon": "Vintage late-90s Pokémon toys for sale. Original Tomy figures, Hasbro plush toys, and the first wave of trading cards.",
    "Star Wars": "Vintage Kenner Star Wars vehicles for sale, plus 90s Power of the Force and Phantom Menace collectibles, including Micro Machines sets.",
    "Disney": "Nostalgic 90s Disney memorabilia and plush toys for sale. Featuring beloved characters from the Disney Renaissance era.",
    "Gargoyles": "Original 1995 Kenner Gargoyles figures for sale. Action figures based on the dark Disney animated series, featuring Goliath and the Manhattan Clan.",
    "He-Man": "Original 80s Masters of the Universe (MOTU) figures for sale. Explore He-Man, Skeletor, and the warriors of Eternia in this vintage collection.",
    "She-Ra": "The original 1980s Princess of Power toy line for sale. Vintage She-Ra figures and allies from the Great Rebellion against the Horde.",
    "Conan": "Vintage action figures from the 90s Conan the Adventurer cartoon for sale. Features the barbarian hero, his allies, and star-metal weapons."
};
