import React, { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaLink, FaSearch, FaBookmark } from 'react-icons/fa';
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
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group links by category
    const categories = [...new Set(links.map(link => link.category))];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FaBookmark className="text-blue-600" />
                    Useful Resources & Links
                </h1>
                <p className="text-gray-600 mt-2">Curated links and resources provided by the system administrator to assist in your daily pharmaceutical care.</p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-8 max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search resources or categories..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading resources...</p>
                </div>
            ) : links.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FaLink className="text-5xl text-gray-300 mx-auto mb-4" />
                    <p className="text-xl font-medium text-gray-500">No resources available yet.</p>
                    <p className="text-gray-400">Please check back later or contact your administrator.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {categories.map(category => {
                        const categoryLinks = filteredLinks.filter(link => link.category === category);
                        if (categoryLinks.length === 0) return null;

                        return (
                            <div key={category}>
                                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                    {category}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {categoryLinks.map(link => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col h-full"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <FaLink className="text-xl" />
                                                </div>
                                                <FaExternalLinkAlt className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                                                {link.title}
                                            </h3>
                                            {link.description && (
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                    {link.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mb-4 flex-grow truncate">
                                                {link.url}
                                            </p>
                                            <div className="mt-auto">
                                                <span className="text-blue-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                                    Open Resource <FaExternalLinkAlt className="text-xs" />
                                                </span>
                                            </div>
                                        </a>
                                    ))}
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
