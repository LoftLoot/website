// src/data.js

// --- KEEP HELPER FUNCTIONS ---
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

// --- KEEP CONSTANTS ---
export const BASE_LOGOS = {
    "eBay": "https://raw.githubusercontent.com/LoftLoot/site/refs/heads/main/images/logo_ebay.png",
    "Etsy": "https://raw.githubusercontent.com/LoftLoot/site/refs/heads/main/images/logo_etsy.png"
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

// --- NEW DATA PROCESSOR (Replaces static exports) ---

export const processProductData = (rawProducts) => {
    if (!rawProducts || !Array.isArray(rawProducts)) return null;

    // 1. Process basic fields and images
    const intermediate = rawProducts.map(product => {
        const processedImages = (product.images || []).map(url => {
            const videoId = extractYouTubeId(url);
            return { original: url, thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : url, isVideo: !!videoId, videoId: videoId };
        });
        
        const fallbackColor = "cbd5e1";
        const tinyPlaceholder = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23${product.imageColor || fallbackColor}'/%3E%3C/svg%3E`;
        
        return {
            ...product,
            collection: product.collection || "Other",
            decade: product.releaseDate ? `${Math.floor(product.releaseDate / 10) * 10}s` : 'Unknown',
            lowerName: normalizeText(product.name),
            lowerBrand: normalizeText(product.brand),
            lowerManufacturer: normalizeText(product.manufacturer),
            lowerCollection: normalizeText(product.collection || "Other"),
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

    // 2. Calculate Related Items
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

    // 3. Extract Global Stats (Used for filters)
    const productMap = new Map(finalProducts.map(p => [p.id, p]));
    const collections = [...new Set(finalProducts.map(p => p.collection))].sort((a, b) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b));
    const decades = [...new Set(finalProducts.map(p => p.decade).filter(Boolean))].sort();
    const types = [...new Set(finalProducts.map(p => p.type).filter(Boolean))];
    const maxPrice = Math.max(...finalProducts.map(p => p.price));
    const minPrice = Math.min(...finalProducts.map(p => p.price));

    return {
        products: finalProducts,
        productMap,
        collections,
        decades,
        types,
        minPrice,
        maxPrice
    };
};