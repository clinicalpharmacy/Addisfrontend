import React, { useState, useEffect } from 'react';
import {
    FaPills, FaSearch, FaPlus,
    FaTrash, FaCommentMedical, FaPaperPlane,
    FaTimes, FaEdit, FaArrowLeft
} from 'react-icons/fa';
import api from '../utils/api';

const MedicationAvailability = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const [isPoster, setIsPoster] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editPostId, setEditPostId] = useState(null);

    const [formData, setFormData] = useState({
        medication_name: '',
        days_available: '',
        notes: ''
    });

    useEffect(() => {
        fetchCurrentUser();
        fetchPosts();
    }, []);

    useEffect(() => {
        let interval;
        if (selectedPost) {
            fetchComments(selectedPost.id);
            interval = setInterval(() => fetchComments(selectedPost.id), 5000);
        }
        return () => clearInterval(interval);
    }, [selectedPost]);

    const fetchCurrentUser = () => {
        const userData = localStorage.getItem('user');
        if (userData) setCurrentUser(JSON.parse(userData));
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await api.get('/medication-availability');
            if (data.success) setPosts(data.posts);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (postId) => {
        if (!postId) return;
        try {
            setLoadingComments(true);
            const data = await api.get(`/medication-availability/${postId}/comments`);
            if (data.success) setComments(data.comments || []);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            posted_date: new Date().toISOString()
        };

        try {
            if (isEditing) {
                await api.put(`/medication-availability/${editPostId}`, payload);
                setIsEditing(false);
                setEditPostId(null);
            } else {
                await api.post('/medication-availability', payload);
            }

            setFormData({ medication_name: '', days_available: '', notes: '' });
            setShowAddForm(false);
            fetchPosts();
        } catch (error) {
            alert('Operation failed');
        }
    };

    const handleEdit = (post) => {
        setFormData({
            medication_name: post.medication_name,
            days_available: post.days_available || '',
            notes: post.notes || ''
        });
        setEditPostId(post.id);
        setIsEditing(true);
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this post?')) return;
        const data = await api.delete(`/medication-availability/${id}`);
        if (data.success) {
            setPosts(posts.filter(p => p.id !== id));
            if (selectedPost?.id === id) setSelectedPost(null);
        }
    };

    const filteredPosts = posts.filter(post =>
        (post.medication_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            <div className="flex justify-between mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <FaPills /> ያጡትን መድሃኒት ማፈላለጊያ
                </h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold"
                >
                    <FaPlus /> መድሃኒቱን ያጋሩ
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-2xl shadow mb-6">
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <input
                            required
                            value={formData.medication_name}
                            onChange={e => setFormData({ ...formData, medication_name: e.target.value })}
                            placeholder="የመድሃኒቱ ስም"
                            className="border p-3 rounded-xl"
                        />
                        <input
                            type="number"
                            value={formData.days_available}
                            onChange={e => setFormData({ ...formData, days_available: e.target.value })}
                            placeholder="Number of days available"
                            className="border p-3 rounded-xl"
                        />
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Notes"
                            className="border p-3 rounded-xl"
                        />
                        <button className="bg-green-600 text-white py-3 rounded-xl font-bold">
                            {isEditing ? 'Update' : 'Post'}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {filteredPosts.map(post => (
                    <div key={post.id} className="bg-white p-5 rounded-2xl border">
                        <div className="flex justify-between">
                            <h3 className="font-bold">{post.medication_name}</h3>
                            {currentUser?.id === post.user_id && (
                                <div className="flex gap-2">
                                    <FaEdit onClick={() => handleEdit(post)} className="cursor-pointer text-blue-500" />
                                    <FaTrash onClick={() => handleDelete(post.id)} className="cursor-pointer text-red-500" />
                                </div>
                            )}
                        </div>
                        <div className="text-sm mt-2">
                            Days: {post.days_available} | Posted: {post.posted_date?.slice(0, 10)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MedicationAvailability;
