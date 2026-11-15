import React, { useState, useEffect } from 'react';
import { FaBookmark, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import api from '../utils/api';

const UsefulLinks = () => {
    const [links, setLinks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            // Safety timeout so a hanging request can't freeze the UI
            const data = await Promise.race([
                api.get('/useful-links'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timed out')), 10000)
                ),
            ]);

            // Guard the response shape so a bad payload can't crash the render
            if (data?.success && Array.isArray(data.links)) {
                setLinks(data.links);
            } else {
                console.warn('Unexpected /useful-links response:', data);
            }
        } catch (error) {
            console.error('Error fetching links:', error);
        }
    };

    const filteredLinks = links.filter(link =>
        link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = [...new Set(filteredLinks.map(link => link.category))];

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    // While searching, keep everything open so matches are visible
    const isExpanded = (category) =>
        searchTerm.trim() !== '' ? true : !!expandedCategories[category];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <FaBookmark className="text-indigo-500" />
                    Useful Links
                </h1>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search links..."
                    className="w-full py-2 border-b border-gray-200 focus:border-indigo-500 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {links.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No links available</div>
            ) : filteredLinks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No links match your search</div>
            ) : (
                <div className="space-y-2">
                    {categories.map(category => {
                        const categoryLinks = filteredLinks.filter(link => link.category === category);
                        if (categoryLinks.length === 0) return null;

                        const expanded = isExpanded(category);

                        return (
                            <div key={category} className="border-b border-gray-100 last:border-0">
                                {/* Clickable category header */}
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    aria-expanded={expanded}
                                    className="w-full flex items-center justify-between py-2 text-left group hover:text-indigo-600 transition-colors"
                                >
                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider group-hover:text-indigo-500">
                                        {category}
                                        <span className="ml-2 text-gray-300 normal-case tracking-normal">
                                            ({categoryLinks.length})
                                        </span>
                                    </span>
                                    <span className="text-gray-400 text-xs group-hover:text-indigo-500">
                                        {expanded ? <FaChevronDown /> : <FaChevronRight />}
                                    </span>
                                </button>

                                {/* Links belonging to the category */}
                                {expanded && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-3 pl-1">
                                        {categoryLinks.map(link => {
                                            const hasUrl = link.url && link.url.trim() !== '';

                                            return hasUrl ? (
                                                <a
                                                    key={link.id}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-800 font-bold text-sm py-1 border-b border-gray-50 md:border-0 flex items-center gap-1 group/link"
                                                >
                                                    <span>{link.title}</span>
                                                    <span className="text-gray-300 group-hover/link:text-indigo-400 text-xs">↗</span>
                                                </a>
                                            ) : (
                                                <div
                                                    key={link.id}
                                                    className="text-gray-500 font-bold text-sm py-1 border-b border-gray-50 md:border-0 flex items-center gap-1 cursor-default"
                                                >
                                                    <span>{link.title}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UsefulLinks;
