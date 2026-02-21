import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaLink } from 'react-icons/fa';
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
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <FaLink className="text-blue-600 text-lg" />
                        Resource Pipeline
                    </h2>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
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
                    className={`px-4 py-2 rounded-md flex items-center gap-2 text-xs font-bold transition ${
                        isAdding
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isAdding ? <FaPlus className="rotate-45" /> : <FaPlus />}
                    {isAdding ? 'Cancel' : 'New Resource'}
                </button>
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <form
                    onSubmit={handleSave}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6"
                >
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            URL *
                        </label>
                        <input
                            type="url"
                            required
                            value={formData.url}
                            onChange={(e) =>
                                setFormData({ ...formData, url: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            rows="3"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Category
                        </label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <FaSave />
                            {editingLink ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            {/* Clean Line-Based Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b text-xs uppercase text-gray-500">
                            <th className="py-3 text-left">Category</th>
                            <th className="py-3 text-left">Link Name</th>
                            <th className="py-3 text-left">URL</th>
                            <th className="py-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="text-sm text-gray-700">
                        {links.length > 0 ? (
                            links.map((link) => (
                                <tr
                                    key={link.id}
                                    className="border-b hover:bg-gray-50 transition"
                                >
                                    <td className="py-3 font-medium text-blue-600">
                                        {link.category}
                                    </td>

                                    <td className="py-3 font-semibold">
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline"
                                        >
                                            {link.title}
                                        </a>
                                    </td>

                                    <td className="py-3 text-xs text-gray-500 break-all">
                                        {link.url}
                                    </td>

                                    <td className="py-3 text-center space-x-3">
                                        <button
                                            onClick={() => startEdit(link)}
                                            className="text-yellow-600 hover:underline text-xs"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDelete(link.id)}
                                            className="text-red-600 hover:underline text-xs"
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
    );
};

export default AdminUsefulLinks;
