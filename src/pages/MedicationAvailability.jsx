import React, { useState, useEffect } from 'react';
import {
    FaPills, FaSearch, FaPlus, FaHospital, FaPhone,
    FaCalendarAlt, FaTrash, FaCheckCircle, FaExclamationCircle,
    FaUserMd, FaMapMarkerAlt, FaCommentMedical, FaPaperPlane, FaTimes
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

    const [formData, setFormData] = useState({
        medication_name: '',
        quantity: '',
        expiry_date: '',
        notes: '',
        status: 'available'
    });

    useEffect(() => {
        fetchCurrentUser();
        fetchPosts();
    }, []);

    const fetchCurrentUser = () => {
        const userData = localStorage.getItem('user');
        if (userData) setCurrentUser(JSON.parse(userData));
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await api.get('/medication-availability');
            if (data.success) {
                setPosts(data.posts);
            }
        } catch (error) {
            console.error('Error fetching availability:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (postId) => {
        try {
            setLoadingComments(true);
            const data = await api.get(`/medication-availability/${postId}/comments`);
            if (data.success) {
                setComments(data.comments);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            console.log('Sending chat for post:', selectedPost.id, 'with content:', newComment);
            const data = await api.post(`/medication-availability/${selectedPost.id}/comments`, {
                content: newComment
            });
            console.log('Response data:', data);

            if (data.success) {
                setComments([...comments, data.comment]);
                setNewComment('');
            } else {
                alert('Server returned success:false. Error: ' + JSON.stringify(data));
            }
        } catch (error) {
            console.error('Chat error full object:', error);

            // The api utility interceptor returns just the data on rejection if error.response exists
            const serverError = error.error || error.message || (error.response?.data?.error);

            alert(`Message Failed!\n\nReason: ${serverError || 'Unknown connection error'}\n\nPlease check if you ran the SQL for 'medication_availability_comments' table.`);
        }
    };

    const openChat = (post) => {
        setSelectedPost(post);
        fetchComments(post.id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/medication-availability', formData);
            if (response.success) {
                setShowAddForm(false);
                setFormData({
                    medication_name: '',
                    quantity: '',
                    expiry_date: '',
                    notes: '',
                    status: 'available'
                });
                fetchPosts();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message;
            alert('Failed to post medication: ' + errorMsg);
            console.error('Post error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            const data = await api.delete(`/medication-availability/${id}`);
            if (data.success) {
                setPosts(posts.filter(p => p.id !== id));
            }
        } catch (error) {
            alert('Error deleting post');
        }
    };

    const filteredPosts = Array.isArray(posts) ? posts.filter(post => {
        const term = searchTerm.toLowerCase();
        const medName = (post.medication_name || '').toLowerCase();
        const institution = (post.user?.institution || '').toLowerCase();
        const location = (post.user?.location || '').toLowerCase();

        return medName.includes(term) || institution.includes(term) || location.includes(term);
    }) : [];

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex flex-col md:row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaPills className="text-blue-600" />
                        Medication Availability & Chat
                    </h1>
                    <p className="text-gray-600 mt-1">Found a shortage? See who has it or post what you can share.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`${showAddForm ? 'bg-gray-500' : 'bg-blue-600'} text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition shadow-lg font-bold`}
                >
                    {showAddForm ? 'Cancel' : <><FaPlus /> Post Available Med</>}
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Left Side: Posts List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {/* Search */}
                    <div className="relative mb-4 sticky top-0 z-10">
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search medication or pharmacy location..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Add Form (In-list) */}
                    {showAddForm && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100 mb-6">
                            <h2 className="text-lg font-bold mb-4 text-gray-800">Share Medication</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.medication_name}
                                        onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-3 focus:border-blue-500"
                                        placeholder="Medication Name (e.g. Insulin Glargine)"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="border border-gray-200 rounded-xl p-3"
                                    placeholder="Quantity"
                                />
                                <input
                                    type="text"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                    className="border border-gray-200 rounded-xl p-3"
                                    placeholder="Expiry Date (e.g. 12/2025)"
                                />
                                <div className="md:col-span-2">
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-3"
                                        placeholder="Notes/Directions"
                                        rows="2"
                                    />
                                </div>
                                <button type="submit" className="md:col-span-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700">
                                    Post Available medication
                                </button>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-10 text-center">Loading posts...</div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">No postings found.</div>
                    ) : (
                        filteredPosts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => openChat(post)}
                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white ${selectedPost?.id === post.id ? 'border-blue-500 shadow-md scale-[1.01]' : 'border-gray-100 hover:border-blue-200'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-800">{post.medication_name}</h3>
                                    {currentUser?.id === post.user_id && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                                    )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FaHospital className="text-blue-500" />
                                        <span className="font-semibold">{post.user?.institution || 'Pharmacy/Clinic'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-red-400" />
                                        <span className="underline">{post.user?.location || 'Contact for location'}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    {post.quantity && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Qty: {post.quantity}</span>}
                                    {post.expiry_date && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">Exp: {post.expiry_date}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right Side: Chat Sidebar */}
                <div className="w-full md:w-96 flex flex-col bg-gray-50 rounded-3xl overflow-hidden border border-gray-200">
                    {selectedPost ? (
                        <>
                            <div className="p-4 bg-white border-b flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-800 truncate w-48">{selectedPost.medication_name}</h4>
                                    <p className="text-xs text-blue-600 font-bold">{selectedPost.user?.institution}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedPost(null)} className="p-2 text-gray-400 hover:text-gray-600"><FaTimes /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                                {/* Post Summary Card in Chat */}
                                <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-800 border border-blue-100 italic">
                                    {selectedPost.notes || "No additional notes provided."}
                                </div>

                                {loadingComments ? (
                                    <div className="flex flex-col items-center justify-center py-10">
                                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
                                        <p className="text-xs text-gray-400">Loading conversation...</p>
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">No messages yet. Start a conversation about this medication.</div>
                                ) : (
                                    comments.map(comment => {
                                        // Bulletproof identification logic
                                        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                                        const myId = String(localStorage.getItem('userId') || userObj.id || userObj.user_id || '').toLowerCase();
                                        const myName = (userObj.full_name || '').toLowerCase();

                                        const commentUserId = String(comment.user_id || '').toLowerCase();
                                        const commentUserName = (comment.user?.full_name || '').toLowerCase();

                                        const isMe = (commentUserId === myId && myId !== '') ||
                                            (commentUserName === myName && myName !== '');

                                        // 🎨 Helper to get consistent color for each user
                                        const getUserStyle = (userId, isCurrentUser) => {
                                            if (isCurrentUser) return {
                                                bubble: 'bg-blue-600',
                                                label: 'text-blue-600',
                                                align: 'items-end',
                                                radius: 'rounded-tr-none'
                                            };

                                            const otherColors = [
                                                { bubble: 'bg-gray-900', label: 'text-gray-900' },     // Black
                                                { bubble: 'bg-emerald-600', label: 'text-emerald-600' }, // Green
                                                { bubble: 'bg-indigo-600', label: 'text-indigo-600' },   // Indigo
                                                { bubble: 'bg-purple-600', label: 'text-purple-600' },   // Purple
                                                { bubble: 'bg-pink-600', label: 'text-pink-600' },       // Pink
                                                { bubble: 'bg-orange-600', label: 'text-orange-600' }    // Orange
                                            ];

                                            // Improved hash based on ID string
                                            const idStr = String(userId);
                                            let hash = 0;
                                            for (let i = 0; i < idStr.length; i++) {
                                                hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
                                                hash |= 0; // Convert to 32bit integer
                                            }
                                            const index = Math.abs(hash) % otherColors.length;
                                            return {
                                                ...otherColors[index],
                                                align: 'items-start',
                                                radius: 'rounded-tl-none'
                                            };
                                        };

                                        const style = getUserStyle(comment.user_id, isMe);

                                        return (
                                            <div key={comment.id} className={`flex flex-col ${isMe ? 'self-end items-end' : 'self-start items-start'} max-w-[85%] mb-2`}>
                                                <div className={`p-3 px-4 rounded-2xl shadow-md text-sm leading-relaxed transition-all hover:shadow-lg text-white ${style.bubble} ${style.radius}`}>
                                                    {comment.content}
                                                </div>
                                                <div className={`flex items-center gap-2 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${style.label}`}>
                                                        {isMe ? 'You' : comment.user?.institution || 'Pharmacist'}
                                                    </span>
                                                    <span className="text-[9px] text-gray-300">•</span>
                                                    <span className="text-[9px] text-gray-400 font-medium">
                                                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <form onSubmit={handlePostComment} className="p-4 bg-white border-t flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="flex-1 border rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition">
                                    <FaPaperPlane />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                            <FaCommentMedical className="text-5xl mb-4 text-gray-200" />
                            <p className="font-medium">Select a medication posting to view details and start a conversation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicationAvailability;
