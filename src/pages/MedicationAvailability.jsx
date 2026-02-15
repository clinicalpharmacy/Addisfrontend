import React, { useState, useEffect } from 'react';
import {
    FaPills, FaSearch, FaPlus, FaTrash,
    FaCommentMedical, FaPaperPlane, FaTimes, FaEdit, FaArrowLeft
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
    const [isPoster, setIsPoster] = useState(false);
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editPostId, setEditPostId] = useState(null);

    const [formData, setFormData] = useState({
        medication_name: '',
        search_date: '',
        notes: '',
    });

    // -------------------------
    // INITIAL LOAD
    // -------------------------
    useEffect(() => {
        fetchCurrentUser();
        fetchPosts();
    }, []);

    // -------------------------
    // AUTO DELETE EXPIRED POSTS
    // -------------------------
    useEffect(() => {
        const interval = setInterval(() => {
            autoDeleteExpiredPosts();
        }, 60000);

        return () => clearInterval(interval);
    }, [posts]);

    const autoDeleteExpiredPosts = async () => {
        const now = new Date();

        for (const post of posts) {
            if (!post.search_date) continue;

            const expiry = new Date(post.search_date);
            if (expiry < now) {
                try {
                    await api.delete(`/medication-availability/${post.id}`);
                    setPosts(prev => prev.filter(p => p.id !== post.id));
                } catch {}
            }
        }
    };

    const fetchCurrentUser = () => {
        const userData = localStorage.getItem('user');
        if (userData) setCurrentUser(JSON.parse(userData));
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await api.get('/medication-availability');
            if (data.success) setPosts(data.posts || []);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (postId, chatWithId = null) => {
        if (!postId) return;

        try {
            setLoadingComments(true);
            const url = chatWithId
                ? `/medication-availability/${postId}/comments?chat_with=${chatWithId}`
                : `/medication-availability/${postId}/comments`;

            const data = await api.get(url);
            if (data.success) setComments(data.comments || []);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const recipient_id = isPoster
                ? selectedChatUser?.id
                : selectedPost.user_id;

            const data = await api.post(
                `/medication-availability/${selectedPost.id}/comments`,
                { content: newComment, recipient_id }
            );

            if (data.success) {
                setComments(prev => [...prev, data.comment]);
                setNewComment('');
            }
        } catch (err) {
            alert('Message failed');
        }
    };

    const openChat = (post) => {
        setSelectedPost(post);
        const amIPoster = currentUser?.id === post.user_id;
        setIsPoster(amIPoster);
        setSelectedChatUser(null);
        fetchComments(post.id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isEditing) {
                await api.put(`/medication-availability/${editPostId}`, formData);
            } else {
                await api.post('/medication-availability', formData);
            }

            setShowAddForm(false);
            setIsEditing(false);
            setFormData({ medication_name:'', search_date:'', notes:'' });
            fetchPosts();
        } catch {
            alert('Save failed');
        }
    };

    const handleEdit = (post) => {
        setFormData({
            medication_name: post.medication_name,
            search_date: post.search_date || '',
            notes: post.notes || '',
        });
        setEditPostId(post.id);
        setIsEditing(true);
        setShowAddForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this post?')) return;

        await api.delete(`/medication-availability/${id}`);
        setPosts(prev => prev.filter(p => p.id !== id));
        if (selectedPost?.id === id) setSelectedPost(null);
    };

    // -------------------------
    // FILTER
    // -------------------------
    const filteredPosts = posts.filter(post =>
        (post.medication_name || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const formatDate = (d) => {
        if (!d) return '';
        const date = new Date(d);
        return date.toLocaleDateString();
    };

    // =========================
    // UI
    // =========================
    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">

            {/* HEADER */}
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold flex gap-2 items-center">
                    <FaPills className="text-blue-600"/> Medication Finder
                </h1>

                <button
                    onClick={()=>setShowAddForm(!showAddForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                    <FaPlus/> Add
                </button>
            </div>

            {/* SEARCH */}
            <input
                className="border p-3 rounded-xl mb-4"
                placeholder="Search medication"
                value={searchTerm}
                onChange={e=>setSearchTerm(e.target.value)}
            />

            {/* FORM */}
            {showAddForm && (
                <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl mb-4 space-y-3">
                    <input
                        className="border p-2 w-full rounded"
                        value={formData.medication_name}
                        onChange={e=>setFormData({...formData, medication_name:e.target.value})}
                        placeholder="Medication name"
                        required
                    />
                    <input
                        type="date"
                        className="border p-2 w-full rounded"
                        value={formData.search_date}
                        onChange={e=>setFormData({...formData, search_date:e.target.value})}
                    />
                    <textarea
                        className="border p-2 w-full rounded"
                        value={formData.notes}
                        onChange={e=>setFormData({...formData, notes:e.target.value})}
                        placeholder="Notes"
                    />
                    <button className="bg-green-600 text-white px-4 py-2 rounded">
                        Save
                    </button>
                </form>
            )}

            {/* POSTS */}
            <div className="space-y-4 overflow-y-auto">
                {filteredPosts.map(post=>(
                    <div
                        key={post.id}
                        onClick={()=>openChat(post)}
                        className="bg-white p-4 rounded-2xl border hover:border-blue-400 cursor-pointer"
                    >
                        {/* TOP ROW */}
                        <div className="flex justify-between items-start">

                            <div>
                                <h3 className="font-bold text-lg">{post.medication_name}</h3>
                                <p className="text-xs text-gray-500">
                                    {post.user?.full_name || 'User'}
                                </p>
                            </div>

                            {/* DATE ONLY */}
                            <div className="text-right">
                                <p className="text-xs text-gray-400">
                                    {formatDate(post.created_at)}
                                </p>

                                {currentUser?.id === post.user_id && (
                                    <div className="flex gap-2 mt-1 justify-end">
                                        <FaEdit
                                            onClick={(e)=>{e.stopPropagation();handleEdit(post)}}
                                            className="text-blue-500 cursor-pointer"
                                        />
                                        <FaTrash
                                            onClick={(e)=>{e.stopPropagation();handleDelete(post.id)}}
                                            className="text-red-500 cursor-pointer"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MedicationAvailability;
