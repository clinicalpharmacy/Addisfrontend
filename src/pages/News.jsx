// pages/News.jsx
import React, { useState, useEffect } from 'react';
import {
    FaNewspaper,
    FaSearch,
    FaCalendarAlt,
    FaUser,
    FaEye,
    FaArrowRight,
    FaArrowLeft,
    FaTag,
    FaBookmark
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { format } from 'date-fns';

const News = () => {
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const data = await api.get('/news');
            if (data.success) {
                setNews(data.news || []);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(news.map(n => n.category).filter(Boolean))];

    const filteredNews = news.filter(n => {
        const matchesSearch =
            (n.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (n.content?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (n.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory ? n.category === filterCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Top Navigation Bar with Return Header */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (window.history.length > 1) {
                                    navigate(-1);
                                } else {
                                    navigate('/');
                                }
                            }}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-green-50 hover:text-green-700 rounded-xl transition-all border border-gray-200/70 shadow-sm active:scale-95"
                            title="Return to previous page"
                        >
                            <FaArrowLeft className="text-xs" />
                            <span>Return</span>
                        </button>

                        <Link to="/" className="flex items-center gap-2.5 group">
                            <img src="/logo.png" alt="Addis Med Logo" className="w-9 h-9 rounded-lg object-contain group-hover:scale-105 transition-transform" />
                            <div className="flex flex-col">
                                <span className="font-extrabold text-lg text-gray-900 tracking-tight leading-tight group-hover:text-green-600 transition-colors">
                                    Addis Med
                                </span>
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
                                    Health News
                                </span>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
                        >
                            Home
                        </Link>
                        {isLoggedIn && (
                            <Link
                                to="/home"
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-sm active:scale-95"
                            >
                                Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white pt-24 pb-20 px-4 text-center">
                <div className="max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-green-100 border border-white/20 mb-5">
                        <FaNewspaper className="text-xs" /> Official Health Updates
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-5 tracking-tight">
                        Health News & Insights
                    </h1>
                    <p className="text-lg md:text-xl text-green-100 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                        Stay informed with the latest clinical developments, public health updates, and healthcare research.
                    </p>

                    {/* Search Bar */}
                    <div className="bg-white p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3 max-w-3xl mx-auto">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search articles, topics, or references..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 text-gray-900 font-medium placeholder-gray-400"
                            />
                        </div>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-4 py-3.5 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-green-500 text-gray-700 font-medium md:w-48 appearance-none cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat, i) => (
                                <option key={i} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-grow max-w-6xl mx-auto w-full px-4 py-16">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-gray-900">
                                {filteredNews.length} {filteredNews.length === 1 ? 'Article' : 'Articles'} Found
                            </h2>
                        </div>

                        {filteredNews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {filteredNews.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group"
                                    >
                                        {item.image_url && (
                                            <div className="h-48 overflow-hidden bg-gray-100">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}

                                        <div className="p-8 flex flex-col flex-grow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-green-50 p-3 rounded-xl group-hover:bg-green-600 transition-colors duration-300">
                                                    <FaNewspaper className="text-xl text-green-600 group-hover:text-white transition-colors duration-300" />
                                                </div>
                                                {item.category && (
                                                    <span className="bg-green-50 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-green-200/80 flex items-center gap-1">
                                                        <FaTag className="text-[8px]" /> {item.category}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-2xl font-black text-gray-900 mb-3 leading-tight group-hover:text-green-600 transition-colors">
                                                {item.title}
                                            </h3>

                                            {/* Content preview */}
                                            <p className="text-base text-gray-600 mb-4 flex-grow leading-relaxed line-clamp-4">
                                                {item.content?.length > 220
                                                    ? item.content.slice(0, 220).trim() + '...'
                                                    : item.content}
                                            </p>

                                            {/* Reference preview */}
                                            {item.reference && (
                                                <div className="bg-green-50/60 border-l-4 border-green-500 px-3 py-2 rounded text-xs text-gray-700 font-medium mb-4 flex items-start gap-2">
                                                    <FaBookmark className="text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2 break-words">
                                                        {item.reference.length > 140 ? item.reference.slice(0, 140) + '...' : item.reference}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Meta */}
                                            <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-5 pt-3 border-t border-gray-50">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1.5">
                                                        <FaUser className="text-gray-400" /> {item.author_name || 'Addis Med'}
                                                    </span>
                                                    {item.created_at && (
                                                        <span className="flex items-center gap-1.5">
                                                            <FaCalendarAlt className="text-gray-400" />
                                                            {format(new Date(item.created_at), 'MMM dd, yyyy')}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="flex items-center gap-1.5">
                                                    <FaEye className="text-gray-400" /> {item.views ?? 0}
                                                </span>
                                            </div>

                                            <Link
                                                to={`/news/${item.id}`}
                                                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 group/btn shadow-sm hover:shadow-md active:scale-[0.99]"
                                            >
                                                Read Full Article
                                                <FaArrowRight className="text-[10px] group-hover/btn:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 py-24 px-4 text-center">
                                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaSearch className="text-3xl text-green-600" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">No articles found</h3>
                                <p className="text-gray-500 font-medium">Try adjusting your search filters or check back later for new articles.</p>
                                {(searchTerm || filterCategory) && (
                                    <button
                                        onClick={() => { setSearchTerm(''); setFilterCategory(''); }}
                                        className="mt-6 text-green-600 font-black hover:text-green-700 underline underline-offset-4 decoration-2"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <footer className="bg-white border-t border-gray-200 mt-auto py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Addis Med. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default News;
