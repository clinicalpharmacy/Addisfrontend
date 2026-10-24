// pages/NewsDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaUser, FaEye, FaBookmark, FaNewspaper, FaTag } from 'react-icons/fa';
import api from '../utils/api';
import { format } from 'date-fns';

const NewsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full"></div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
                <FaNewspaper className="text-6xl text-gray-300 mb-6" />
                <h1 className="text-2xl font-black text-gray-900 mb-2">Article Not Found</h1>
                <p className="text-gray-500 mb-6 font-medium">The article you are looking for doesn't exist or has been removed.</p>
                <button
                    onClick={() => navigate('/news')}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-black text-sm transition-colors"
                >
                    Back to News
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Navigation */}
            <div className="bg-white py-4 px-6 border-b flex justify-between items-center shadow-sm">
                <Link to="/" className="flex items-center gap-2 cursor-pointer">
                    <img src="/logo.png" alt="Addis Med Logo" className="w-10 h-10 rounded-lg object-contain" />
                    <span className="font-bold text-xl text-gray-800 tracking-tight">Addis Med</span>
                </Link>
                <Link to="/news" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <FaArrowLeft className="text-xs" /> Back to News
                </Link>
            </div>

            <div className="flex-grow max-w-4xl mx-auto w-full px-4 py-12">
                <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {article.image_url && (
                        <div className="h-64 md:h-96 overflow-hidden bg-gray-100">
                            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="p-6 md:p-12">
                        {/* Category badge */}
                        {article.category && (
                            <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 mb-4">
                                <FaTag className="text-[8px]" /> {article.category}
                            </span>
                        )}

                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                            {article.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium mb-8 pb-6 border-b border-gray-100">
                            {article.author_name && (
                                <span className="flex items-center gap-1.5">
                                    <FaUser className="text-gray-400" /> {article.author_name}
                                </span>
                            )}
                            {article.created_at && (
                                <span className="flex items-center gap-1.5">
                                    <FaCalendarAlt className="text-gray-400" />
                                    {format(new Date(article.created_at), 'MMMM dd, yyyy')}
                                </span>
                            )}
                            {typeof article.views === 'number' && (
                                <span className="flex items-center gap-1.5">
                                    <FaEye className="text-gray-400" /> {article.views} {article.views === 1 ? 'view' : 'views'}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="prose prose-indigo max-w-none text-gray-700 text-base leading-loose whitespace-pre-line mb-10">
                            {article.content}
                        </div>

                        {/* Reference Section */}
                        {article.reference && (
                            <div className="bg-indigo-50/50 border-l-4 border-indigo-500 rounded-r-xl px-5 py-4">
                                <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest mb-2">
                                    <FaBookmark /> Reference
                                </div>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed break-words whitespace-pre-line">
                                    {article.reference}
                                </p>
                            </div>
                        )}
                    </div>
                </article>

                <div className="mt-8 text-center">
                    <Link
                        to="/news"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-black text-sm transition-colors shadow-sm"
                    >
                        <FaArrowLeft className="text-xs" /> Back to All News
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
