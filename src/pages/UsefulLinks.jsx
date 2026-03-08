import React, { useState, useEffect } from 'react';
import { FaSearch, FaBookmark } from 'react-icons/fa';
import api from '../utils/api';

const UsefulLinks = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const data = await api.get('/useful-links');
            if (data.success) {
                setLinks(data.links);
            }
        } catch (error) {
            console.error('Error fetching links:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLinks = links.filter(link =>
        link.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categories = [...new Set(filteredLinks.map(link => link.category))];

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

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : links.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No links available</div>
            ) : (
                <div className="space-y-6">
                    {categories.map(category => {
                        const categoryLinks = filteredLinks.filter(link => link.category === category);
                        if (categoryLinks.length === 0) return null;

                        return (
                            <div key={category}>
                                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                    {category}
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {categoryLinks.map(link => {
                                        const hasUrl = link.url && link.url.trim() !== '';

                                        return hasUrl ? (
                                            <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800 font-bold text-sm py-1 border-b border-gray-50 md:border-0 flex items-center gap-1 group"
                                            >
                                                <span>{link.title}</span>
                                                <span className="text-gray-300 group-hover:text-indigo-400 text-xs">↗</span>
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
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UsefulLinks;
