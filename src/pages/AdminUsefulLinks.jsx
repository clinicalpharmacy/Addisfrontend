import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaExternalLinkAlt, FaLink, FaFolder } from 'react-icons/fa';
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

            if (response.success) {
                alert(editingLink ? 'Link updated' : 'Link added');
                setIsAdding(false);
                setEditingLink(null);
                setFormData({ title: '', url: '', category: 'General', icon: 'FaExternalLinkAlt', description: '' });
                fetchLinks();
            }
        } catch (error) {
            alert('Error saving link: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this link?')) return;
        try {
            const data = await api.delete(`/useful-links/${id}`);
            if (data.success) {
                fetchLinks();
            }
        } catch (error) {
            alert('Error deleting link');
        }
    };

    const startEdit = (link) => {
        setEditingLink(link);
        setFormData({
            title: link.title,
            url: link.url,
            category: link.category,
            icon: link.icon,
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
                            setFormData({ title: '', url: '', category: 'General', icon: 'FaExternalLinkAlt', description: '' });
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
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">
                                    Title Designation *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold transition-all"
                                    placeholder="e.g. Clinical Pharmacopeia"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">
                                    Destination URL (Global) *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono text-[11px] font-bold"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">
                                    Intelligence Summary
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium min-h-[80px]"
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1.5 ml-1">
                                    Taxonomy Category
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-black"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
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

                <div className="overflow-hidden">

                    {/* Desktop View Table (UNCHANGED) */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxonomy</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource & Utility</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Interface</th>
                                    <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {links.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-300 font-bold uppercase tracking-widest text-xs italic">
                                            No intelligence nodes active.
                                        </td>
                                    </tr>
                                ) : (
                                    links.map(link => (
                                        <tr key={link.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-100">
                                                    {link.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-gray-900 text-sm mb-0.5">{link.title}</div>
                                                {link.description && (
                                                    <div className="text-[10px] font-medium text-gray-400 leading-tight max-w-xs">
                                                        {link.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <a href={link.url} target="_blank" rel="noopener noreferrer"
                                                   className="text-blue-500 font-mono text-[10px] flex items-center gap-1.5 hover:text-blue-700 font-bold">
                                                    {link.url.replace(/^https?:\/\//, '').substring(0, 30)}...
                                                    <FaExternalLinkAlt className="text-[8px]" />
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => startEdit(link)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg text-xs">
                                                        <FaEdit />
                                                    </button>
                                                    <button onClick={() => handleDelete(link.id)} className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg text-xs">
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

                    {/* ✅ REVISED Mobile View – Line Style */}
                    <div className="lg:hidden divide-y divide-gray-100">
                        {links.length === 0 ? (
                            <div className="text-center py-10 text-gray-300 font-bold uppercase tracking-widest text-xs italic">
                                System links buffer empty.
                            </div>
                        ) : (
                            links.map(link => (
                                <div key={link.id} className="py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">

                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                            {link.category}
                                        </span>

                                        <h4 className="font-black text-gray-900 text-sm leading-tight truncate">
                                            {link.title}
                                        </h4>

                                        {link.description && (
                                            <p className="text-[10px] text-gray-400 font-medium truncate">
                                                {link.description}
                                            </p>
                                        )}

                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 font-mono text-[10px] flex items-center gap-1 mt-1"
                                        >
                                            {link.url.replace(/^https?:\/\//, '').substring(0, 30)}...
                                            <FaExternalLinkAlt className="text-[8px]" />
                                        </a>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <button onClick={() => startEdit(link)} className="text-blue-600 text-xs">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDelete(link.id)} className="text-red-500 text-xs">
                                            <FaTrash />
                                        </button>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminUsefulLinks;
