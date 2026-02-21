import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaExternalLinkAlt, FaLink } from 'react-icons/fa';
import api from '../utils/api';

const AdminUsefulLinks = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        category: 'General',
        icon: 'FaExternalLinkAlt',
        description: ''
    });

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/useful-links');
            const data = response.data;

            if (data?.success) {
                setLinks(data.links || []);
            } else {
                setLinks([]);
            }
        } catch (error) {
            console.error('Error fetching links:', error);
            setLinks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            let response;

            if (editingLink) {
                response = await api.put(`/useful-links/${editingLink.id}`, formData);
            } else {
                response = await api.post('/useful-links', formData);
            }

            const data = response.data;

            if (data?.success) {
                alert(editingLink ? 'Link updated' : 'Link added');
                setIsAdding(false);
                setEditingLink(null);
                setFormData({
                    title: '',
                    url: '',
                    category: 'General',
                    icon: 'FaExternalLinkAlt',
                    description: ''
                });
                fetchLinks();
            }
        } catch (error) {
            alert('Error saving link: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this link?')) return;

        try {
            const response = await api.delete(`/useful-links/${id}`);
            const data = response.data;

            if (data?.success) {
                fetchLinks();
            }
        } catch (error) {
            alert('Error deleting link');
        }
    };

    const startEdit = (link) => {
        setEditingLink(link);
        setFormData({
            title: link.title || '',
            url: link.url || '',
            category: link.category || 'General',
            icon: link.icon || 'FaExternalLinkAlt',
            description: link.description || ''
        });
        setIsAdding(true);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <FaLink className="text-blue-600 text-lg" /> Resource Pipeline
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            Global intelligence links for all system users.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setIsAdding(!isAdding);
                            setEditingLink(null);
                            setFormData({
                                title: '',
                                url: '',
                                category: 'General',
                                icon: 'FaExternalLinkAlt',
                                description: ''
                            });
                        }}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm font-black text-xs active:scale-95 ${
                            isAdding
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isAdding ? <FaPlus className="rotate-45" /> : <FaPlus />}
                        {isAdding ? 'Decline Entry' : 'New Resource'}
                    </button>
                </div>

                {isAdding && (
                    <div className="bg-gray-50/50 p-5 md:p-8 rounded-2xl border border-gray-100 shadow-inner mb-8 animate-slideDown">
                        <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                <FaLink className="text-blue-600" />
                            </div>
                            {editingLink ? 'Calibrate Resource' : 'Inject New Data Node'}
                        </h3>

                        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">
                                    Title Designation *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">
                                    Destination URL *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono text-[11px]"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">
                                    Intelligence Summary
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-h-[80px]"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5">
                                    Taxonomy Category
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                                    ) : (
                                        <FaSave />
                                    )}
                                    {editingLink ? 'Flush Changes' : 'Commit Resource'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Unified Line-Based Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white rounded-xl overflow-hidden">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <th className="py-3 px-6 text-left">Category</th>
                                <th className="py-3 px-6 text-left">Link Name</th>
                                <th className="py-3 px-6 text-left">URL</th>
                                <th className="py-3 px-6 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="text-gray-700 text-sm">
                            {links.length > 0 ? (
                                links.map((link) => (
                                    <tr
                                        key={link.id}
                                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 px-6 font-semibold text-blue-600">
                                            {link.category}
                                        </td>

                                        <td className="py-3 px-6 font-bold">
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:underline"
                                            >
                                                {link.title}
                                            </a>
                                        </td>

                                        <td className="py-3 px-6 text-xs text-gray-500 break-all">
                                            {link.url}
                                        </td>

                                        <td className="py-3 px-6 text-center space-x-2">
                                            <button
                                                onClick={() => startEdit(link)}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => handleDelete(link.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-6 text-gray-400">
                                        No links found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsefulLinks;
