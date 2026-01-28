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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Useful Links</h1>
                    <p className="text-gray-600">Add or edit resources for all system users</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingLink(null);
                        setFormData({ title: '', url: '', category: 'General', icon: 'FaExternalLinkAlt', description: '' });
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <FaPlus /> {isAdding ? 'Cancel' : 'Add New Link'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <FaLink /> {editingLink ? 'Edit Link' : 'Add New Resource'}
                    </h3>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="E.g. Pharmacopeia Online"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                            <input
                                type="url"
                                required
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="Briefly describe what this resource is for..."
                                rows="2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                placeholder="General, Clinical, Guidelines, etc."
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FaSave /> {loading ? 'Saving...' : 'Save Resource'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-700">Category</th>
                            <th className="p-4 font-semibold text-gray-700">Title & Description</th>
                            <th className="p-4 font-semibold text-gray-700">URL</th>
                            <th className="p-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {links.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500">
                                    No useful links found. Add your first resource above.
                                </td>
                            </tr>
                        ) : (
                            links.map(link => (
                                <tr key={link.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold uppercase">
                                            {link.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{link.title}</div>
                                        {link.description && (
                                            <div className="text-xs text-gray-500 mt-1">{link.description}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline">
                                            {link.url.substring(0, 30)}... <FaExternalLinkAlt className="text-xs" />
                                        </a>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(link)} className="text-blue-500 hover:text-blue-700 p-2 rounded hover:bg-blue-50">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(link.id)} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50">
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
        </div>
    );
};

export default AdminUsefulLinks;
