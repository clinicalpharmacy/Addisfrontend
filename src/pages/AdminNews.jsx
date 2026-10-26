import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSave, FaNewspaper, FaTag, FaBookmark, FaEye, FaImage, FaLink, FaExternalLinkAlt } from 'react-icons/fa';
import api from '../utils/api';
import { format } from 'date-fns';

const AdminNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        reference: '',
        category: '',
        image_url: '',
        published: true
    });

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const data = await api.get('/news/admin/all');
            if (data.success) {
                setNews(data.news || []);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            let response;

            const payload = {
                ...formData,
                title: formData.title.trim(),
                content: formData.content.trim(),
                reference: formData.reference.trim(),
                category: formData.category.trim() || 'general',
                image_url: formData.image_url.trim() || null
            };

            if (editingArticle) {
                response = await api.put(`/news/${editingArticle.id}`, payload);
            } else {
                response = await api.post('/news', payload);
            }

            if (response.success) {
                alert(editingArticle ? 'Article updated' : 'Article added');
                resetForm();
                fetchNews();
            }
        } catch (error) {
            alert('Error saving article: ' + (error?.details?.join(', ') || error?.error || error?.message || JSON.stringify(error)));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this article? This cannot be undone.')) return;
        try {
            const data = await api.delete(`/news/${id}`);
            if (data.success) {
                fetchNews();
            }
        } catch (error) {
            alert('Error deleting article');
        }
    };

    const togglePublish = async (article) => {
        try {
            const data = await api.post(`/news/${article.id}/toggle-publish`, {});
            if (data.success) {
                fetchNews();
            }
        } catch (error) {
            alert('Error updating publish status');
        }
    };

    const startEdit = (article) => {
        setEditingArticle(article);
        setFormData({
            title: article.title || '',
            content: article.content || '',
            reference: article.reference || '',
            category: article.category || '',
            image_url: article.image_url || '',
            published: article.published ?? true
        });
        setIsAdding(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingArticle(null);
        setFormData({
            title: '',
            content: '',
            reference: '',
            category: '',
            image_url: '',
            published: true
        });
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <FaNewspaper className="text-green-600 text-lg" /> News Management
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Manage articles shown on the public news page.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (isAdding) resetForm();
                            else setIsAdding(true);
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm font-black text-xs active:scale-95 ${isAdding
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {isAdding ? <FaPlus className="rotate-45" /> : <FaPlus />}
                        {isAdding ? 'Cancel' : 'New Article'}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-gray-50/50 p-5 md:p-8 rounded-2xl border border-gray-100 shadow-inner mb-8 animate-slideDown">
                        <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                <FaNewspaper className="text-green-600" />
                            </div>
                            {editingArticle ? 'Edit Article' : 'Publish New Article'}
                        </h3>
                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">
                                    Title *
                                </label>
                                <input
                                    type="text" required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-green-500 outline-none bg-white font-bold transition-all"
                                    placeholder="e.g. New Malaria Vaccine Shows 90% Efficacy in Trial"
                                    maxLength={200}
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1 font-medium">
                                    {formData.title.length}/200
                                </p>
                            </div>

                            {/* Content */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">
                                    Content *
                                </label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-green-500 outline-none bg-white font-medium min-h-[300px] leading-relaxed"
                                    placeholder="Write the full article content here..."
                                    rows="12"
                                />
                            </div>

                            {/* Reference */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1 flex items-center gap-1.5">
                                    <FaBookmark className="text-green-600" /> Reference *
                                </label>
                                <textarea
                                    required
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white font-mono font-medium min-h-[80px] leading-relaxed"
                                    placeholder="e.g. World Health Organization. (2024). Malaria Vaccine Report. https://who.int/..."
                                    rows="3"
                                />
                                <p className="text-[10px] text-gray-400 mt-1 ml-1 font-medium">
                                    Citation, source, or URL — plain text
                                </p>
                            </div>

                            {/* Category */}
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1 flex items-center gap-1.5">
                                    <FaTag className="text-green-600" /> Category
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-green-500 outline-none bg-white font-bold transition-all"
                                    placeholder="e.g. Research, Policy, Public Health"
                                />
                            </div>

                            {/* Image URL */}
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1 flex items-center gap-1.5">
                                    <FaImage className="text-green-600" /> Cover Image URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-green-500 outline-none bg-white font-mono font-bold"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Published toggle + submit */}
                            <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.published}
                                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                                    />
                                    <span className="text-sm font-bold text-gray-700">
                                        Published (Visible to public)
                                    </span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading
                                        ? <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                                        : <FaSave />
                                    }
                                    {editingArticle ? 'Update' : 'Publish'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Title & Content</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {news.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-300 font-bold uppercase tracking-widest text-xs italic">
                                            No articles found.
                                        </td>
                                    </tr>
                                ) : (
                                    news.map(article => (
                                        <tr key={article.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4 align-top">
                                                <button
                                                    onClick={() => togglePublish(article)}
                                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-colors ${article.published
                                                        ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'
                                                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {article.published ? 'Published' : 'Draft'}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 align-top max-w-md">
                                                <div className="font-black text-gray-900 text-sm mb-1 leading-snug">
                                                    {article.title}
                                                </div>
                                                <div className="text-[11px] font-medium text-gray-500 leading-snug line-clamp-2 mb-2">
                                                    {article.content?.slice(0, 150)}...
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-medium">
                                                    {article.category && (
                                                        <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wide border border-green-100">
                                                            {article.category}
                                                        </span>
                                                    )}
                                                    {article.created_at && (
                                                        <span>{format(new Date(article.created_at), 'MMM dd, yyyy')}</span>
                                                    )}
                                                    {article.views > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <FaEye /> {article.views}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top max-w-xs">
                                                <div className="text-[11px] text-gray-600 font-mono leading-snug line-clamp-3 break-words">
                                                    {article.reference}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <Link
                                                        to={`/news/${article.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors text-xs flex items-center justify-center"
                                                        title="View / Read Article"
                                                    >
                                                        <FaExternalLinkAlt />
                                                    </Link>
                                                    <button
                                                        onClick={() => startEdit(article)}
                                                        className="text-green-700 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors text-xs"
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(article.id)}
                                                        className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors text-xs"
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View Grid */}
                    <div className="lg:hidden grid grid-cols-1 gap-4">
                        {news.map(article => (
                            <div key={article.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex flex-col hover:bg-white hover:border-green-200 transition-all group shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <button
                                        onClick={() => togglePublish(article)}
                                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-colors ${article.published
                                            ? 'bg-green-50 text-green-600 border-green-100'
                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        {article.published ? 'Published' : 'Draft'}
                                    </button>
                                    <div className="flex gap-1">
                                        <Link
                                            to={`/news/${article.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white p-2 rounded-lg text-gray-600 border border-gray-100 shadow-sm active:scale-90 transition-transform flex items-center justify-center"
                                            title="View / Read Article"
                                        >
                                            <FaExternalLinkAlt size={12} />
                                        </Link>
                                        <button
                                            onClick={() => startEdit(article)}
                                            className="bg-white p-2 rounded-lg text-green-700 border border-gray-100 shadow-sm active:scale-90 transition-transform"
                                        >
                                            <FaEdit size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            className="bg-white p-2 rounded-lg text-red-500 border border-gray-100 shadow-sm active:scale-90 transition-transform"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-black text-gray-900 text-sm mb-2 leading-tight">{article.title}</h4>
                                <p className="text-[11px] text-gray-500 font-medium line-clamp-2 mb-3">
                                    {article.content?.slice(0, 100)}...
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-medium">
                                    {article.category && (
                                        <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wide border border-green-100">
                                            {article.category}
                                        </span>
                                    )}
                                    {article.created_at && (
                                        <span>{format(new Date(article.created_at), 'MMM dd, yyyy')}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNews;
