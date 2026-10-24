import React, { useState, useEffect } from 'react';
import { 
    FaBookmark, FaFont, FaSearchPlus, FaSearchMinus, 
    FaExclamationTriangle, FaShieldAlt, FaUserMd, FaBaby, 
    FaCapsules, FaCheckCircle, FaFlask, FaListUl, FaStethoscope,
    FaFilter, FaExchangeAlt, FaUsers, FaExclamationCircle
} from 'react-icons/fa';

/**
 * FormattedDosageView parses DailyMed FDA Monographs
 * into clean, precisely structured clinical cards for Uses, Dosage & Directions,
 * Warnings & Precautions, and Active/Inactive Ingredients without regulatory clutter.
 */
const FormattedDosageView = ({ text }) => {
    // Zoom presets: 'standard' (18px), 'large' (22px - default), 'extra' (26px), 'huge' (32px)
    const [fontSizeLevel, setFontSizeLevel] = useState(() => {
        return localStorage.getItem('cdss_dosage_font_size') || 'large';
    });

    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        try {
            localStorage.setItem('cdss_dosage_font_size', fontSizeLevel);
        } catch (e) {
            // Ignore storage quota issues
        }
    }, [fontSizeLevel]);

    if (!text || !text.trim()) {
        return (
            <div className="p-8 bg-gray-50 rounded-2xl text-lg text-gray-700 italic text-center border-2 border-gray-200">
                No FDA monograph details available for this label.
            </div>
        );
    }

    // --- High-Precision Clinical Text Cleaner ---
    const cleanAndStructureDosage = (rawText) => {
        // 1. Remove XML/HTML remnants
        let cleaned = rawText
            .replace(/<[^>]+>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#160;|&nbsp;/g, ' ');

        // 2. Fix broken units & exponents (e.g. m\n2 -> m²)
        cleaned = cleaned.replace(/m\s*\n\s*2\b/g, 'm²');
        cleaned = cleaned.replace(/mL\/minute\/1\.73\s*m\s*2/g, 'mL/min/1.73 m²');

        // 3. Remove FDA SPL cross-reference citations like "( 2.1 )", "( 2.1 ).", "( 2.1 , 2.2 )", "[see 2.1]"
        cleaned = cleaned.replace(/\[\s*see\s+[^\]]+\]/gi, '');
        cleaned = cleaned.replace(/\(\s*see\s+[^)]+\)/gi, '');
        cleaned = cleaned.replace(/\(\s*\d+\.\d+(\s*,\s*\d+\.\d+)*\s*\)\.?/g, '');
        cleaned = cleaned.replace(/\(\s*\d+(\.\d+)*\s*\)\.?/g, '');

        // 4. Split into lines
        const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

        const isMainTitle = (line) => /^#*\s*(\d+\s+)?(DOSAGE\s+AND\s+ADMINISTRATION|HIGHLIGHTS\s+OF|INDEX|SPL\s+UNCLASSIFIED)/i.test(line);

        const isSectionHeader = (line) => {
            if (isMainTitle(line)) return false;
            if (line.startsWith('###')) return true;
            if (/^(\d+\.\d+\s+[A-Za-z])/i.test(line)) return true;
            if (/^(Boxed Warning|Active Ingredient|Purpose|Uses|Indications|Dosage|Directions|Warnings|Precautions|Contraindications|Drug Interactions|Use in Specific Populations|Specific Populations|Inactive Ingredients|Overdosage|Child Safety|Adults?|Pediatric|Renal Impairment|Hepatic Impairment|Elderly|Administration|Titration|Recommended Dosage|Maximum Dose|Questions)\b/i.test(line) && line.length < 110 && !line.includes('.')) return true;
            if (line.endsWith(':') && line.length < 65) return true;
            return false;
        };

        const cleanHeaderTitle = (title) => {
            return title
                .replace(/^###\s*/, '')
                .replace(/^\d+(\.\d+)*\s*[-–:.]*\s*/, '') // Remove "2.1 ", "2.2 ", "2. "
                .replace(/\s*:\s*$/, '')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const cleanItemText = (item) => {
            return item
                .replace(/^[•\-\*o■▪]\s*/, '') // Remove raw bullet symbol
                .replace(/^\d+(\.\d+)*\s*[-–:.]*\s*/, '') // Remove item numbering like "2.1 "
                .replace(/\s+/g, ' ')
                .trim();
        };

        const cards = [];
        let currentCard = { title: 'General FDA Information', items: [] };

        lines.forEach(line => {
            if (isMainTitle(line)) return;

            if (isSectionHeader(line)) {
                const cleanTitle = cleanHeaderTitle(line);
                if (cleanTitle) {
                    if (currentCard.items.length > 0) {
                        cards.push(currentCard);
                    }
                    currentCard = { title: cleanTitle, items: [] };
                }
            } else {
                const cleanItem = cleanItemText(line);
                if (cleanItem && cleanItem.length > 1 && !/^[•\-\*.:,]$/.test(cleanItem)) {
                    currentCard.items.push(cleanItem);
                }
            }
        });

        if (currentCard.items.length > 0) {
            cards.push(currentCard);
        }

        return cards;
    };

    const sections = cleanAndStructureDosage(text);

    const totalChars = sections.reduce((sum, s) => sum + s.items.join(' ').length, 0);
    const hasOnlyStub = sections.length > 0 && sections.every(s => s.items.length === 0 || s.items.every(i => /^(USAGE|DIRECTIONS)$/i.test(i.trim())));

    if (sections.length === 0 || totalChars < 25 || hasOnlyStub) {
        return (
            <div className="p-7 bg-amber-50/90 rounded-2xl border-2 border-amber-300 text-slate-900 space-y-2.5 font-sans">
                <div className="flex items-center gap-2.5 text-amber-900 font-black text-lg">
                    <FaExclamationTriangle className="text-xl shrink-0 text-amber-600" />
                    <span>Incomplete Manufacturer Label</span>
                </div>
                <p className="text-base text-slate-700 leading-relaxed font-medium">
                    This specific manufacturer packaging insert only contains a heading stub without full dosage, uses, or ingredients parameters.
                </p>
            </div>
        );
    }

    // Size definitions with explicit pixel values to guarantee massive, clear readability
    const sizeConfig = {
        standard: {
            titlePx: 22,
            bodyPx: 18,
            lineHeight: '1.65',
            name: 'Standard (18px)'
        },
        large: {
            titlePx: 26,
            bodyPx: 22,
            lineHeight: '1.7',
            name: 'Large (22px)'
        },
        extra: {
            titlePx: 30,
            bodyPx: 26,
            lineHeight: '1.75',
            name: 'Extra Large (26px)'
        },
        huge: {
            titlePx: 36,
            bodyPx: 32,
            lineHeight: '1.85',
            name: 'Maximum (32px)'
        }
    };

    const currentSize = sizeConfig[fontSizeLevel] || sizeConfig.large;

    const handleZoomIn = () => {
        if (fontSizeLevel === 'standard') setFontSizeLevel('large');
        else if (fontSizeLevel === 'large') setFontSizeLevel('extra');
        else if (fontSizeLevel === 'extra') setFontSizeLevel('huge');
    };

    const handleZoomOut = () => {
        if (fontSizeLevel === 'huge') setFontSizeLevel('extra');
        else if (fontSizeLevel === 'extra') setFontSizeLevel('large');
        else if (fontSizeLevel === 'large') setFontSizeLevel('standard');
    };

    // Category styling & icon resolver
    const getSectionCategory = (title) => {
        const lower = (title || '').toLowerCase();
        
        // 1. Boxed Warning (Critical Hazard)
        if (lower.includes('boxed warning') || lower.includes('black box')) {
            return {
                group: 'contraindications',
                icon: FaExclamationCircle,
                badge: 'FDA Boxed Warning (Critical Safety Hazard)',
                cardBorder: 'border-rose-500 shadow-md',
                headerBg: 'from-rose-200 via-red-100 to-rose-100 border-rose-400 text-rose-950',
                badgeBg: 'bg-rose-600 text-white border-rose-700 font-black',
                iconColor: 'text-rose-700'
            };
        }

        // 2. Contraindications (When medication severely harms user)
        if (lower.includes('contraindicated') || lower.includes('contraindication') || lower.includes('do not use')) {
            return {
                group: 'contraindications',
                icon: FaShieldAlt,
                badge: 'Contraindications (Do Not Use - Harmful)',
                cardBorder: 'border-rose-400',
                headerBg: 'from-rose-100 via-red-50 to-rose-50 border-rose-300 text-rose-950',
                badgeBg: 'bg-rose-200 text-rose-900 border-rose-300 font-extrabold',
                iconColor: 'text-rose-700'
            };
        }

        // 3. Drug Interactions
        if (lower.includes('interaction')) {
            return {
                group: 'interactions',
                icon: FaExchangeAlt,
                badge: 'Drug Interactions (Dangerous Combinations)',
                cardBorder: 'border-purple-300',
                headerBg: 'from-purple-100 via-fuchsia-50 to-purple-50 border-purple-300 text-purple-950',
                badgeBg: 'bg-purple-200 text-purple-900 border-purple-300 font-bold',
                iconColor: 'text-purple-700'
            };
        }

        // 4. Specific Populations (Pregnancy, Lactation, Pediatric, Geriatric, Renal/Hepatic Impairment)
        if (lower.includes('population') || lower.includes('pregnancy') || lower.includes('lactation') || lower.includes('nursing') || lower.includes('geriatric') || lower.includes('renal') || lower.includes('kidney') || lower.includes('hepatic') || lower.includes('liver')) {
            return {
                group: 'populations',
                icon: FaUsers,
                badge: 'Special Populations (Pregnancy, Renal, Liver, Age)',
                cardBorder: 'border-sky-300',
                headerBg: 'from-sky-100 via-blue-50 to-sky-50 border-sky-300 text-sky-950',
                badgeBg: 'bg-sky-200 text-sky-900 border-sky-300 font-bold',
                iconColor: 'text-sky-700'
            };
        }

        // 5. Dosage & Administration (Adult, Pediatric, Renal adjustments, Titration)
        if (lower.includes('dosage') || lower.includes('administration') || lower.includes('direction') || lower.includes('titration') || lower.includes('recommended dose')) {
            return {
                group: 'dosage',
                icon: FaUserMd,
                badge: 'Dosage & Administration (Prescribing Guidelines)',
                cardBorder: 'border-blue-300',
                headerBg: 'from-blue-100 via-indigo-50 to-blue-50 border-blue-300 text-blue-950',
                badgeBg: 'bg-blue-200 text-blue-900 border-blue-300 font-bold',
                iconColor: 'text-blue-700'
            };
        }

        // 6. Approved Clinical Indications (Condition Compatibility)
        if (lower.includes('use') || lower.includes('indication')) {
            return {
                group: 'indications',
                icon: FaCheckCircle,
                badge: 'Approved Indications & Condition Compatibility',
                cardBorder: 'border-emerald-300',
                headerBg: 'from-emerald-100 via-green-50 to-emerald-50 border-emerald-300 text-emerald-950',
                badgeBg: 'bg-emerald-200 text-emerald-900 border-emerald-300 font-bold',
                iconColor: 'text-emerald-700'
            };
        }

        // 7. Overdose & Toxicity Handling
        if (lower.includes('overdose') || lower.includes('overdosage') || lower.includes('reach of children')) {
            return {
                group: 'warnings',
                icon: FaExclamationTriangle,
                badge: 'Overdose & Emergency Hazard',
                cardBorder: 'border-amber-400',
                headerBg: 'from-amber-100 via-yellow-50 to-amber-50 border-amber-300 text-amber-950',
                badgeBg: 'bg-amber-200 text-amber-900 border-amber-400 font-bold',
                iconColor: 'text-amber-700'
            };
        }

        // 8. General Warnings & Safety Precautions (Default)
        return {
            group: 'warnings',
            icon: FaExclamationTriangle,
            badge: 'Warnings & Adverse Reactions (Harmful to User)',
            cardBorder: 'border-amber-300',
            headerBg: 'from-amber-100 via-orange-50 to-amber-50 border-amber-300 text-amber-950',
            badgeBg: 'bg-amber-200 text-amber-900 border-amber-300 font-bold',
            iconColor: 'text-amber-700'
        };
    };

    // Filter sections by activeTab
    const filteredSections = activeTab === 'all' 
        ? sections 
        : sections.filter(s => getSectionCategory(s.title).group === activeTab);

    return (
        <div className="space-y-6 font-sans">
            {/* Quick Text Size Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-white px-5 py-3.5 rounded-2xl border-2 border-blue-200 shadow-sm">
                <div className="flex items-center gap-3 text-slate-900 font-extrabold text-base md:text-lg">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                        <FaFont className="text-base" />
                    </div>
                    <div>
                        <span className="block">Dosage Reading Size:</span>
                        <span className="text-xs font-semibold text-blue-700">Currently: {currentSize.name}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Zoom In / Zoom Out */}
                    <div className="flex items-center bg-white rounded-xl border-2 border-gray-300 p-1 shadow-xs">
                        <button
                            type="button"
                            onClick={handleZoomOut}
                            disabled={fontSizeLevel === 'standard'}
                            className="p-2 text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            title="Decrease text size"
                            aria-label="Decrease text size"
                        >
                            <FaSearchMinus className="text-base" />
                        </button>
                        <div className="w-px h-6 bg-gray-200 mx-1" />
                        <button
                            type="button"
                            onClick={handleZoomIn}
                            disabled={fontSizeLevel === 'huge'}
                            className="p-2 text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            title="Increase text size"
                            aria-label="Increase text size"
                        >
                            <FaSearchPlus className="text-base" />
                        </button>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-gray-300 shadow-xs">
                        <button
                            type="button"
                            onClick={() => setFontSizeLevel('standard')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                fontSizeLevel === 'standard' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100'
                            }`}
                        >
                            18px
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizeLevel('large')}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-black transition-all ${
                                fontSizeLevel === 'large' 
                                    ? 'bg-blue-600 text-white shadow-sm' 
                                    : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100'
                            }`}
                        >
                            22px (Default)
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizeLevel('extra')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                fontSizeLevel === 'extra' 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100'
                            }`}
                        >
                            26px
                        </button>
                        <button
                            type="button"
                            onClick={() => setFontSizeLevel('huge')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-black transition-all ${
                                fontSizeLevel === 'huge' 
                                    ? 'bg-purple-600 text-white shadow-sm' 
                                    : 'text-gray-700 hover:text-gray-950 hover:bg-gray-100'
                            }`}
                        >
                            32px (Huge)
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Section Category Filter Tabs */}
            {sections.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/90 rounded-2xl border-2 border-slate-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                            activeTab === 'all'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-50 border border-gray-300'
                        }`}
                    >
                        📋 All Details ({sections.length})
                    </button>

                    {sections.some(s => getSectionCategory(s.title).group === 'contraindications') && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('contraindications')}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                activeTab === 'contraindications'
                                    ? 'bg-rose-700 text-white shadow-sm'
                                    : 'bg-white text-rose-800 hover:text-rose-950 hover:bg-rose-50 border border-rose-300'
                            }`}
                        >
                            🛑 Contraindications (Do Not Use)
                        </button>
                    )}

                    {sections.some(s => getSectionCategory(s.title).group === 'warnings') && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('warnings')}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                activeTab === 'warnings'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'bg-white text-slate-700 hover:text-amber-900 hover:bg-amber-50 border border-gray-300'
                            }`}
                        >
                            ⚡ Warnings & Harm Precautions
                        </button>
                    )}

                    {sections.some(s => getSectionCategory(s.title).group === 'interactions') && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('interactions')}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                activeTab === 'interactions'
                                    ? 'bg-purple-700 text-white shadow-sm'
                                    : 'bg-white text-slate-700 hover:text-purple-900 hover:bg-purple-50 border border-gray-300'
                            }`}
                        >
                            🔄 Drug Interactions
                        </button>
                    )}

                    {sections.some(s => getSectionCategory(s.title).group === 'populations') && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('populations')}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                activeTab === 'populations'
                                    ? 'bg-sky-700 text-white shadow-sm'
                                    : 'bg-white text-slate-700 hover:text-sky-900 hover:bg-sky-50 border border-gray-300'
                            }`}
                        >
                            👥 Special Populations (Pregnancy/Renal/Elderly)
                        </button>
                    )}

                    {sections.some(s => getSectionCategory(s.title).group === 'dosage') && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('dosage')}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                activeTab === 'dosage'
                                    ? 'bg-blue-700 text-white shadow-sm'
                                    : 'bg-white text-slate-700 hover:text-blue-900 hover:bg-blue-50 border border-gray-300'
                            }`}
                        >
                            💊 Dosage & Administration
                        </button>
                    )}

                    {sections.some(s => getSectionCategory(s.title).group === 'indications') && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('indications')}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                activeTab === 'indications'
                                    ? 'bg-emerald-700 text-white shadow-sm'
                                    : 'bg-white text-slate-700 hover:text-emerald-900 hover:bg-emerald-50 border border-gray-300'
                            }`}
                        >
                            🎯 Indication Compatibility Check
                        </button>
                    )}
                </div>
            )}

            {/* Structured Sections without raw bullets or 2.1 numbering */}
            <div className="space-y-6">
                {filteredSections.map((section, sIdx) => {
                    const category = getSectionCategory(section.title);
                    const HeaderIcon = category.icon;

                    return (
                        <div key={sIdx} className={`bg-white rounded-2xl border-2 ${category.cardBorder} shadow-sm overflow-hidden`}>
                            {/* Card Header */}
                            {section.title && (
                                <div className={`bg-gradient-to-r ${category.headerBg} px-6 py-5 border-b-2 flex flex-wrap items-center justify-between gap-3`}>
                                    <div className="flex items-center gap-3">
                                        <HeaderIcon className={`${category.iconColor} shrink-0`} style={{ fontSize: `${currentSize.titlePx - 2}px` }} />
                                        <h4 
                                            className="font-black text-slate-950 tracking-tight"
                                            style={{ 
                                                fontSize: `${currentSize.titlePx}px`,
                                                lineHeight: '1.3'
                                            }}
                                        >
                                            {section.title}
                                        </h4>
                                    </div>
                                    <span className={`text-xs md:text-sm font-black px-3 py-1 rounded-full border shadow-2xs ${category.badgeBg}`}>
                                        {category.badge}
                                    </span>
                                </div>
                            )}

                            {/* Clean Clinical Statements (No bullets, no 2.1) */}
                            <div className="p-6 md:p-8 space-y-4">
                                {section.items.map((item, iIdx) => {
                                    const isCriticalAlert = /boxed warning|black box|death|fatal|contraindicated|severe allergy|poison control|emergency/i.test(item);
                                    const isCaution = isCriticalAlert || /maximum dose|renal impairment|crcl|egfr|toxicity|warning|avoid|dose reduction|do not use|fetal harm|teratogenic|overdose|interaction/i.test(item);

                                    return (
                                        <div 
                                            key={iIdx} 
                                            className={`p-5 rounded-2xl border-2 transition-all ${
                                                isCriticalAlert
                                                    ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-xs'
                                                    : isCaution 
                                                        ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs' 
                                                        : 'bg-slate-50/80 border-gray-200 hover:bg-slate-100/90 text-slate-950'
                                            }`}
                                        >
                                            {item.includes('|') && item.split('|').filter(c => c.trim().length > 0).length > 1 ? (
                                                <div className="overflow-x-auto my-1">
                                                    <div className="grid grid-flow-col auto-cols-fr gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                                        {item.split('|').map(c => c.trim()).filter(Boolean).map((cell, cIdx) => (
                                                            <div 
                                                                key={cIdx} 
                                                                className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-center"
                                                                style={{ fontSize: `${Math.max(14, currentSize.bodyPx - 4)}px` }}
                                                            >
                                                                {cell}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p 
                                                    className={`leading-relaxed ${isCaution ? 'font-bold text-amber-950' : 'font-medium text-slate-950'}`}
                                                    style={{ 
                                                        fontSize: `${currentSize.bodyPx}px`,
                                                        lineHeight: currentSize.lineHeight
                                                    }}
                                                >
                                                    {item.replace(/\|/g, ' ')}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {filteredSections.length === 0 && (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-gray-200 text-slate-600 space-y-2">
                        <p className="font-bold text-base">No sections found under this category filter.</p>
                        <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className="text-sm text-blue-600 hover:text-blue-800 font-black underline"
                        >
                            View All Monograph Sections
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormattedDosageView;
