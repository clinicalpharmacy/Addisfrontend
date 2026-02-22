import React, { useState, useEffect } from 'react';
import { FaSearch, FaBookmark, FaFile, FaDownload, FaTrash, FaLink, FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';
import api from '../utils/api';

const UsefulLinks = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        url: '',
        file: null
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setFormData({ ...formData, file: file, url: '' }); // Clear URL when file is selected
            
            // Create file preview URL
            const previewUrl = URL.createObjectURL(file);
            setFilePreview(previewUrl);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear file if URL is being entered
        if (name === 'url' && value) {
            setSelectedFile(null);
            setFilePreview(null);
            setFormData(prev => ({ ...prev, file: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('category', formData.category);
        
        if (formData.url) {
            formDataToSend.append('url', formData.url);
            formDataToSend.append('type', 'url');
        } else if (selectedFile) {
            formDataToSend.append('file', selectedFile);
            formDataToSend.append('type', 'file');
        }

        try {
            const response = await api.post('/useful-links', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.success) {
                // Reset form
                setFormData({ title: '', category: '', url: '', file: null });
                setSelectedFile(null);
                setFilePreview(null);
                setShowAddForm(false);
                fetchLinks(); // Refresh the list
            }
        } catch (error) {
            console.error('Error adding link/file:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await api.delete(`/useful-links/${id}`);
                fetchLinks(); // Refresh the list
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
    };

    const getFileIcon = (filename) => {
        const ext = filename?.split('.').pop().toLowerCase();
        switch(ext) {
            case 'pdf':
                return <FaFilePdf className="text-red-500" />;
            case 'doc':
            case 'docx':
                return <FaFileWord className="text-blue-500" />;
            default:
                return <FaFileAlt className="text-gray-500" />;
        }
    };

    const filteredLinks = links.filter(link =>
        link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group links by category
    const categories = [...new Set(filteredLinks.map(link => link.category))];

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header with Add Button */}
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                    <FaBookmark className="text-indigo-500" />
                    Useful Links & Files
                </h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-sm"
                >
                    {showAddForm ? 'Cancel' : 'Add New'}
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            name="title"
                            placeholder="Title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                        <input
                            type="text"
                            name="category"
                            placeholder="Category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                        
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-600 mb-1">OR</label>
                                <input
                                    type="url"
                                    name="url"
                                    placeholder="Enter URL (https://...)"
                                    value={formData.url}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    disabled={selectedFile !== null}
                                />
                            </div>
                            <div className="text-gray-400">or</div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                                    onChange={handleFileChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    disabled={formData.url !== ''}
                                />
                            </div>
                        </div>

                        {/* File Preview */}
                        {filePreview && selectedFile && (
                            <div className="mt-4 p-4 border border-gray-300 rounded-md bg-white">
                                <h3 className="text-sm font-semibold mb-2">Preview:</h3>
                                {selectedFile.type === 'application/pdf' ? (
                                    <iframe
                                        src={filePreview}
                                        title="PDF Preview"
                                        className="w-full h-64 border border-gray-200 rounded"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                                        {getFileIcon(selectedFile.name)}
                                        <span className="text-sm">{selectedFile.name}</span>
                                        <span className="text-xs text-gray-500">
                                            ({(selectedFile.size / 1024).toFixed(2)} KB)
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            disabled={!formData.title || !formData.category || (!formData.url && !selectedFile)}
                        >
                            Add Item
                        </button>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search links and files..."
                    className="w-full py-2 border-b border-gray-200 focus:border-indigo-500 outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : links.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No items available</div>
            ) : (
                <div className="space-y-6">
                    {categories.map(category => {
                        const categoryLinks = filteredLinks.filter(link => link.category === category);
                        if (categoryLinks.length === 0) return null;

                        return (
                            <div key={category}>
                                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                    {category}
                                </h2>
                                <div className="grid grid-cols-1 gap-2">
                                    {categoryLinks.map(item => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-md hover:border-gray-200 transition-colors"
                                        >
                                            {item.type === 'url' ? (
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-2 flex-1"
                                                >
                                                    <FaLink className="text-gray-400" />
                                                    <span>{item.title}</span>
                                                    <span className="text-gray-300 text-xs">↗</span>
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-3 flex-1">
                                                    {getFileIcon(item.filename)}
                                                    <span className="font-medium text-sm">{item.title}</span>
                                                    <span className="text-xs text-gray-500">{item.filename}</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-2">
                                                {item.type === 'file' && (
                                                    <a
                                                        href={item.fileUrl}
                                                        download={item.filename}
                                                        className="p-2 text-gray-500 hover:text-indigo-600"
                                                        title="Download"
                                                    >
                                                        <FaDownload />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
                                        </div>
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
