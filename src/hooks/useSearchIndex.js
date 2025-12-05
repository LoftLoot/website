// src/hooks/useSearchIndex.js
import { useMemo, useCallback } from 'react';
import { 
    normalizeText, 
    generateYearTokens, 
    STATIC_COLLECTIONS, 
    STATIC_TYPES, 
    STATIC_DECADES, 
    TYPE_CONFIG 
} from '../data';

export const useSearchIndex = (products) => {
    const index = useMemo(() => {
        return products.map(p => ({
            id: p.id,
            original: p,
            // Pre-normalize all fields for faster matching
            norm: {
                name: normalizeText(p.name),
                brand: normalizeText(p.brand),
                manufacturer: normalizeText(p.manufacturer),
                collection: normalizeText(p.collection),
                type: normalizeText(p.type),
                desc: normalizeText(p.description),
                // Pre-generate numeric year tokens for fuzzy matching
                years: generateYearTokens(p)
            }
        }));
    }, [products]);

    const getSnippet = useCallback((product, query) => {
        const q = normalizeText(query);
        if (!q) return null;
        
        // Priority: releaseYear > brand > manufacturer > type > collection > description
        if (product.releaseDate && product.releaseDate.toString().includes(q)) return { text: `Release year: ${product.releaseDate}`, field: 'year' };
        if (product.lowerBrand.includes(q)) return { text: `Brand: ${product.brand}`, field: 'brand' };
        if (product.lowerManufacturer.includes(q)) return { text: `Manufacturer: ${product.manufacturer}`, field: 'manufacturer' };
        if (product.lowerType.includes(q)) return { text: `Type: ${product.type}`, field: 'type' };
        if (product.lowerCollection.includes(q)) return { text: `Collection: ${product.collection}`, field: 'collection' };
        
        if (product.lowerDescription.includes(q)) {
            const idx = product.lowerDescription.indexOf(q);
            const start = Math.max(0, idx - 20);
            const end = Math.min(product.description.length, idx + q.length + 50);
            return { text: `...${product.description.substring(start, end)}...`, field: 'desc' };
        }
        return null;
    }, []);

    const autocomplete = useCallback((query, showInStockOnly) => {
        if (!query || query.length < 2) return { filters: [], products: [], totalProducts: 0 };
        
        const normQ = normalizeText(query);
        // Split query into tokens (e.g. "1985 skeletor" -> ["1985", "skeletor"])
        const tokens = normQ.split(" ").filter(t => t.length > 0);

        // Pass A: Filters (Simple match against full string for UI filters)
        const filterCandidates = [];
        const addFilter = (label, kind, value) => {
            const normLabel = normalizeText(label);
            if (normLabel.includes(normQ)) {
                const score = normLabel.startsWith(normQ) ? 10 : 5;
                filterCandidates.push({ label, kind, value, score });
            }
        };

        STATIC_COLLECTIONS.forEach(c => addFilter(c, 'Collection', c));
        STATIC_TYPES.forEach(t => {
            const label = TYPE_CONFIG[t] ? TYPE_CONFIG[t].plural : t;
            addFilter(label, 'Type', t);
        });
        STATIC_DECADES.forEach(d => addFilter(d, 'Era', d));

        // Dedupe and Sort Filters
        const uniqueFilters = Array.from(new Map(filterCandidates.map(item => [item.label + item.kind, item])).values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);

        // Pass B: Products (Multi-token, Out-of-order Logic)
        const scoredProducts = [];
        
        for (const item of index) {
            if (showInStockOnly && item.original.stock < 1) continue;

            // Rule: Every token must match AT LEAST ONE field
            const allTokensMatch = tokens.every(token => {
                return (
                    item.norm.name.includes(token) ||
                    item.norm.brand.includes(token) ||
                    item.norm.manufacturer.includes(token) ||
                    item.norm.collection.includes(token) ||
                    item.norm.type.includes(token) ||
                    item.norm.desc.includes(token) ||
                    item.norm.years.includes(token)
                );
            });

            if (allTokensMatch) {
                // Calculate Score based on field importance across all tokens
                let score = 0;
                tokens.forEach(token => {
                    if (item.norm.name.includes(token)) score += item.norm.name.startsWith(token) ? 20 : 10;
                    if (item.norm.brand.includes(token)) score += 8;
                    if (item.norm.manufacturer.includes(token)) score += 8;
                    if (item.norm.collection.includes(token)) score += 6;
                    if (item.norm.type.includes(token)) score += 6;
                    if (item.norm.years.includes(token)) score += 15; // High score for year/decade match
                    if (item.norm.desc.includes(token)) score += 1;
                });

                scoredProducts.push({ 
                    ...item.original, 
                    score, 
                    snippet: getSnippet(item.original, query)
                });
            }
        }

        scoredProducts.sort((a, b) => b.score - a.score);
        const productsSlice = scoredProducts.slice(0, 5);
        
        return {
            filters: uniqueFilters,
            products: productsSlice,
            totalProducts: scoredProducts.length
        };
    }, [index, getSnippet]);

    const search = useCallback((query, filters = {}) => {
        let results = [...products];
        const normQ = normalizeText(query);
        const tokens = normQ.split(" ").filter(t => t.length > 0);

        // 1. Keyword Score & Filtering
        if (tokens.length > 0) {
            const scored = [];
            
            for (const p of results) {
                const idxItem = index.find(i => i.id === p.id);
                if (!idxItem) continue;

                // Rule: Every token must match AT LEAST ONE field
                const allTokensMatch = tokens.every(token => {
                    return (
                        idxItem.norm.name.includes(token) ||
                        idxItem.norm.brand.includes(token) ||
                        idxItem.norm.manufacturer.includes(token) ||
                        idxItem.norm.collection.includes(token) ||
                        idxItem.norm.type.includes(token) ||
                        idxItem.norm.desc.includes(token) ||
                        idxItem.norm.years.includes(token)
                    );
                });

                if (allTokensMatch) {
                    let score = 0;
                    tokens.forEach(token => {
                         if (idxItem.norm.name.includes(token)) score += idxItem.norm.name.startsWith(token) ? 20 : 10;
                         if (idxItem.norm.brand.includes(token)) score += 8;
                         if (idxItem.norm.manufacturer.includes(token)) score += 8;
                         if (idxItem.norm.collection.includes(token)) score += 6;
                         if (idxItem.norm.type.includes(token)) score += 6;
                         if (idxItem.norm.years.includes(token)) score += 15;
                         if (idxItem.norm.desc.includes(token)) score += 1;
                    });
                    scored.push({ ...p, _score: score });
                }
            }
            
            scored.sort((a, b) => b._score - a._score);
            results = scored;
        }

        // 2. Apply strict filters
        return results.filter(p => {
             if (filters.showInStockOnly && p.stock < 1) return false;
             if (filters.collection && filters.collection !== 'All' && p.collection !== filters.collection) return false;
             if (filters.decade && filters.decade !== 'All' && p.decade !== filters.decade) return false;
             if (filters.type && filters.type !== 'All' && p.type !== filters.type) return false;
             if (filters.priceRange && (p.price < filters.priceRange[0] || p.price > filters.priceRange[1])) return false;
             return true;
        });
    }, [products, index]);

    return { autocomplete, search };
};