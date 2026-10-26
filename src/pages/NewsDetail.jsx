// pages/NewsDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaUser,
    FaEye,
    FaBookmark,
    FaNewspaper,
    FaTag,
    FaHome
} from 'react-icons/fa';
import api from '../utils/api';
import { format } from 'date-fns';

const NewsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const data = await api.get(`/news/${id}`);
                if (data.success) setArticle(data.news);
            } catch (error) {
                console.error('Error fetching article:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <FaNewspaper className="text-6xl text-green-300 mb-6" />
                <h1 className="text-2xl font-black text-gray-900 mb-2">Article Not Found</h1>
                <p className="text-gray-500 mb-6 font-medium text-center max-w-md">
                    The article you are looking for doesn't exist, has been removed, or is not yet published.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/news')}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm transition-all shadow-sm"
                    >
                        Back to News
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

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
                                    navigate('/news');
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
                            to="/news"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-green-700 bg-green-50 hover:bg-green-100 transition-all border border-green-200"
                        >
                            <FaNewspaper className="text-xs" />
                            <span>All News</span>
                        </Link>
                        {isLoggedIn ? (
                            <Link
                                to="/home"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all shadow-sm active:scale-95"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                to="/"
                                className="text-sm font-semibold text-gray-600 hover:text-green-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50 hidden sm:inline-block"
                            >
                                Home
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
                <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {article.image_url && (
                        <div className="h-64 md:h-96 overflow-hidden bg-gray-100">
                            <img
                                src={article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        </div>
                    )}

                    <div className="p-6 md:p-12">
                        {/* Category badge */}
                        {article.category && (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-green-200/80 mb-4">
                                <FaTag className="text-[8px]" /> {article.category}
                            </span>
                        )}

                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                            {article.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium mb-8 pb-6 border-b border-gray-100">
                            <span className="flex items-center gap-1.5">
                                <FaUser className="text-gray-400" /> {article.author_name || 'Addis Med'}
                            </span>
                            {article.created_at && (
                                <span className="flex items-center gap-1.5">
                                    <FaCalendarAlt className="text-gray-400" />
                                    {format(new Date(article.created_at), 'MMMM dd, yyyy')}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <FaEye className="text-gray-400" /> {article.views ?? 0} {article.views === 1 ? 'view' : 'views'}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="prose prose-emerald max-w-none text-gray-700 text-base leading-loose whitespace-pre-line mb-10">
                            {article.content}
                        </div>

                        {/* Reference Section */}
                        {article.reference && (
                            <div className="bg-green-50/60 border-l-4 border-green-500 rounded-r-xl px-5 py-4">
                                <div className="flex items-center gap-2 text-green-700 font-black text-xs uppercase tracking-widest mb-2">
                                    <FaBookmark /> Reference
                                </div>
                                <div className="text-sm text-gray-700 font-medium leading-relaxed break-words whitespace-pre-line">
                                    {article.reference.startsWith('http://') || article.reference.startsWith('https://') ? (
                                        <a
                                            href={article.reference}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-800 underline underline-offset-2 break-all font-semibold"
                                        >
                                            {article.reference}
                                        </a>
                                    ) : (
                                        article.reference
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </article>

                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
                    <button
                        onClick={() => {
                            if (window.history.length > 1) {
                                navigate(-1);
                            } else {
                                navigate('/news');
                            }
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all shadow-sm"
                    >
                        <FaArrowLeft className="text-xs" /> Return
                    </button>
                    <Link
                        to="/news"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm transition-all shadow-sm active:scale-[0.99]"
                    >
                        <FaNewspaper className="text-xs" /> Back to All News
                    </Link>
                </div>
            </div>

            <footer className="bg-white border-t border-gray-200 mt-auto py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Addis Med. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default NewsDetail;
