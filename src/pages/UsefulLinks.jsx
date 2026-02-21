import React, { useState, useEffect } from 'react';
import { FaExternalLinkAlt, FaSearch, FaBookmark } from 'react-icons/fa';
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

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Simple Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-light text-gray-700 flex items-center gap-2">
                    <FaBookmark className="text-indigo-400" />
                    Useful Links
                </h1>
                <p className="text-sm text-gray-400 mt-1">Curated resources for pharmaceutical care</p>
            </div>

            {/* Minimal Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full py-2 border-b border-gray-200 focus:border-indigo-300 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : links.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No links available</div>
            ) : (
                <div className="space-y-4">
                    {filteredLinks.map(link => (
                        <div key={link.id} className="py-2 border-b border-gray-50 last:border-0">
                            <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center justify-between"
                            >
                                <div>
                                    <span className="text-indigo-600 group-hover:text-indigo-800 text-sm">
                                        {link.title}
                                    </span>
                                    {link.description && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {link.description}
                                        </p>
                                    )}
                                </div>
                                <FaExternalLinkAlt className="text-xs text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UsefulLinks;
