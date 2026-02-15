import React, { useState, useEffect } from 'react';
import {
    FaPills, FaSearch, FaPlus, FaHospital,
    FaCalendarAlt, FaTrash, FaCheckCircle, FaExclamationCircle,
    FaUserMd, FaMapMarkerAlt, FaCommentMedical, FaPaperPlane, FaTimes, FaEdit, FaArrowLeft
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
        medication_needed: '',
        search_date: '',
        notes: '',
    });

    useEffect(() => {
        fetchCurrentUser();
        fetchPosts();
    }, []);

    // Auto-delete posts when search_date has passed
    useEffect(() => {
        const checkAndDeleteExpiredPosts = async () => {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const expiredPosts = posts.filter(post => 
                post.search_date && post.search_date < today
            );
            
            for (const post of expiredPosts) {
                try {
                    await api.delete(`/medication-availability/${post.id}`);
                    console.log(`Auto-deleted expired post: ${post.id}`);
                } catch (error) {
                    console.error(`Failed to auto-delete post ${post.id}:`, error);
                }
            }
            
            // Refresh posts after deletions
            if (expiredPosts.length > 0) {
                fetchPosts();
            }
        };

        // Check every hour (3600000 ms)
        const interval = setInterval(checkAndDeleteExpiredPosts, 3600000);
        
        // Initial check
        checkAndDeleteExpiredPosts();

        return () => clearInterval(interval);
    }, [posts]);

    // Polling for live chat
    useEffect(() => {
        let interval;
        if (selectedPost) {
            // Initial fetch or when chat user changes
            if (isPoster) {
                if (selectedChatUser) fetchComments(selectedPost.id, selectedChatUser.id);
            } else {
                fetchComments(selectedPost.id);
            }

            interval = setInterval(() => {
                if (isPoster) {
                    if (selectedChatUser) fetchComments(selectedPost.id, selectedChatUser.id);
                } else {
                    fetchComments(selectedPost.id);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [selectedPost, selectedChatUser, isPoster]);

    const fetchCurrentUser = () => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setCurrentUser(JSON.parse(userData));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const data = await api.get('/medication-availability');
            if (data && data.success) {
                setPosts(Array.isArray(data.posts) ? data.posts : []);
            } else {
                setPosts([]);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async (postId, chatWithId = null) => {
        if (!postId || postId === 'undefined') {
            return;
        }
        try {
            setLoadingComments(true);
            const isValidChatId = chatWithId && chatWithId !== 'undefined' && chatWithId !== 'null';
            const url = isValidChatId
                ? `/medication-availability/${postId}/comments?chat_with=${chatWithId}`
                : `/medication-availability/${postId}/comments`;

            const data = await api.get(url);
            if (data && data.success) {
                setComments(Array.isArray(data.comments) ? data.comments : []);
            } else {
                setComments([]);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            setComments([]);
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchConversations = async (postId) => {
        try {
            const data = await api.get(`/medication-availability/${postId}/conversations`);
            if (data && data.success) {
                setConversations(Array.isArray(data.conversations) ? data.conversations : []);
            } else {
                setConversations([]);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setConversations([]);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            alert('Please enter a message');
            return;
        }

        try {
            const recipient_id = isPoster ? selectedChatUser?.id : selectedPost?.user_id;

            if (!recipient_id) {
                alert('Cannot determine recipient');
                return;
            }

            const data = await api.post(`/medication-availability/${selectedPost.id}/comments`, {
                content: newComment,
                recipient_id: recipient_id
            });

            if (data && data.success) {
                setComments(prevComments => [...prevComments, data.comment]);
                setNewComment('');
                // If this was a new conversation, refresh the list
                if (isPoster && !conversations.find(c => c.id === selectedChatUser?.id)) {
                    fetchConversations(selectedPost.id);
                }
            } else {
                alert('Message failed to send. Please try again.');
            }
        } catch (error) {
            const serverError = error?.error || error?.message || (typeof error === 'string' ? error : 'Unknown connection error');
            alert(`Message Failed!\n\nReason: ${serverError}`);
        }
    };

    const openChat = (post) => {
        setSelectedPost(post);
        const amIPoster = currentUser?.id === post.user_id;
        setIsPoster(amIPoster);
        setSelectedChatUser(null);
        setComments([]);

        if (amIPoster) {
            fetchConversations(post.id);
        }
    };

    const startChatWithUser = (user) => {
        setSelectedChatUser(user);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.medication_needed.trim()) {
            alert('Medication name is required');
            return;
        }
    
        try {
            const response = await api.post('/medication-availability', formData);
            
            // Check if response exists and has success property
            if (response && response.success) {
                setShowAddForm(false);
                setFormData({
                    medication_needed: '',
                    search_date: '',
                    notes: '',
                });
                await fetchPosts();
            } else {
                // If response doesn't have success property, check for error message
                const errorMsg = response?.error || response?.message || 'Failed to create post';
                alert('Operation failed: ' + errorMsg);
            }
        } catch (error) {
            // Better error handling to extract the actual error message
            console.error('Full error object:', error);
            
            // Try to extract the error message from different possible locations
            let errorMsg = 'Unknown error occurred';
            
            if (error.response?.data?.error) {
                // If error comes from axios with response data
                errorMsg = error.response.data.error;
            } else if (error.error) {
                // If error has error property
                errorMsg = error.error;
            } else if (error.message) {
                // If error has message property
                errorMsg = error.message;
            } else if (typeof error === 'string') {
                // If error is a string
                errorMsg = error;
            }
            
            alert('Operation failed: ' + errorMsg);
        }
    };

    const handleEdit = (post) => {
        setFormData({
            medication_needed: post.medication_needed || '',
            search_date: post.search_date || '',
            notes: post.notes || '',
        });
        setEditPostId(post.id);
        setIsEditing(true);
        setShowAddForm(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        
        // Check if user is authorized to delete (poster or admin)
        const post = posts.find(p => p.id === id);
        if (!post) return;
        
        const isAuthorized = currentUser?.id === post.user_id || currentUser?.role === 'admin';
        
        if (!isAuthorized) {
            alert('You are not authorized to delete this post');
            return;
        }
        
        try {
            const data = await api.delete(`/medication-availability/${id}`);
            if (data && data.success) {
                setPosts(prevPosts => prevPosts.filter(p => p.id !== id));
                if (selectedPost?.id === id) {
                    setSelectedPost(null);
                    setSelectedChatUser(null);
                }
            }
        } catch (error) {
            const errorMsg = error?.error || error?.message || 'Error deleting post';
            alert(errorMsg);
        }
    };

    // Filter posts
    const filteredPosts = Array.isArray(posts) ? posts.filter(post => {
        if (!post || !post.medication_needed) return false;
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        
        const medName = (post.medication_needed || '').toLowerCase();
        const institution = (post.user?.institution || '').toLowerCase();
        const location = (post.user?.location || '').toLowerCase();

        return medName.includes(term) || institution.includes(term) || location.includes(term);
    }) : [];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            return date.toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return '';
        }
    };

    // Check if search date has passed
    const isDatePassed = (dateString) => {
        if (!dateString) return false;
        const today = new Date().toISOString().split('T')[0];
        return dateString < today;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex flex-col md:row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaPills className="text-blue-600" />
                        ያጡትን መድሃኒት ማፈላለጊያ
                    </h1>
                    <p className="text-gray-600 mt-1">Found a shortage? See who has it or post what you can share.</p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        if (isEditing) {
                            setIsEditing(false);
                            setFormData({ medication_needed: '', search_date: '', notes: '' });
                        }
                    }}
                    className={`${showAddForm ? 'bg-gray-500' : 'bg-blue-600'} text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition shadow-lg font-bold`}
                >
                    {showAddForm ? 'Cancel' : <><FaPlus /> መድሃኒቱን ያጋሩ</>}
                </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 gap-6 overflow-hidden">
                {/* Left Side: Posts List */}
                <div className={`flex-1 overflow-y-auto pr-2 space-y-4 ${selectedPost ? 'hidden md:block' : ''}`}>
                    {/* Search */}
                    <div className="relative mb-4 sticky top-0 z-10 bg-gray-50 pt-2 pb-2">
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search medication"
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Add/Edit Form (In-list) */}
                    {showAddForm && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100 mb-6">
                            <h2 className="text-lg font-bold mb-4 text-gray-800">{isEditing ? 'Edit Medication' : 'የሚፈልጉትን መድሃኒት ይጻፉ'}</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.medication_needed}
                                        onChange={(e) => setFormData({ ...formData, medication_needed: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-3 focus:border-blue-500"
                                        placeholder="የመድሃኒቱ ስም"
                                    />
                                </div>
                                
                                <div className="flex flex-col gap-1 w-full">
                                    <label className="text-xs text-gray-500 ml-1">እስከ መች ይፈለግ</label>
                                    <input
                                        type="date"
                                        value={formData.search_date}
                                        onChange={(e) => setFormData({ ...formData, search_date: e.target.value })}
                                        className="border border-gray-200 rounded-xl p-3 w-full"
                                        placeholder="እስከ መች ይፈለግ"
                                        min={new Date().toISOString().split('T')[0]} // Can't select past dates
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl p-3"
                                        placeholder="ተጨማሪ መረጃ (ካስፈለገ)"
                                        rows="2"
                                    />
                                </div>
                                <button type="submit" className="md:col-span-2 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700">
                                    {isEditing ? 'Update medication' : 'Post medication'}
                                </button>
                            </form>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-10 text-center">Loading posts...</div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="py-20 text-center text-gray-400">No postings found.</div>
                    ) : (
                        filteredPosts.map(post => {
                            const searchDatePassed = isDatePassed(post.search_date);
                            
                            return (
                                <div
                                    key={post.id}
                                    onClick={() => openChat(post)}
                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer bg-white 
                                        ${selectedPost?.id === post.id ? 'border-blue-500 shadow-md scale-[1.01]' : 'border-gray-100 hover:border-blue-200'}
                                        ${searchDatePassed ? 'opacity-50 border-red-200' : ''}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        {/* LEFT: medication name */}
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {post.medication_needed}
                                                {searchDatePassed && (
                                                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                                        Expired
                                                    </span>
                                                )}
                                            </h3>
                                        </div>
                                    
                                        {/* RIGHT: date + edit/delete */}
                                        <div className="flex flex-col items-end gap-1">
                                    
                                            {/* created at date */}
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                Posted: {formatDate(post.created_at)}
                                            </span>
                                    
                                            {/* edit/delete if owner or admin */}
                                            {currentUser && (currentUser.id === post.user_id || currentUser.role === 'admin') && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(post); }}
                                                        className="text-blue-500 hover:text-blue-700 p-1"
                                                        title="Edit"
                                                    >
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                        title="Delete"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right Side: Chat Sidebar */}
                <div className={`w-full md:w-96 flex flex-col bg-gray-50 rounded-3xl overflow-hidden border border-gray-200 ${!selectedPost ? 'hidden md:flex' : 'flex'}`}>
                    {selectedPost ? (
                        <>
                            <div className="p-4 bg-white border-b flex justify-between items-center">
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="mr-3 md:hidden text-gray-500 p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <FaArrowLeft />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 truncate">{selectedPost.medication_needed}</h4>
                                    <p className="text-xs text-blue-600 font-bold truncate">
                                        {isPoster
                                            ? (selectedChatUser ? `Chatting with: ${selectedChatUser.full_name}` : 'Select a conversation')
                                            : `Contacting: ${selectedPost.user?.institution || 'Pharmacy'}`
                                        }
                                    </p>
                                </div>
                                <button onClick={() => { setSelectedPost(null); setSelectedChatUser(null); }} className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"><FaTimes /></button>
                            </div>

                            {isPoster && !selectedChatUser ? (
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Inquiries</h5>
                                    {conversations.length === 0 ? (
                                        <div className="text-center py-20 text-gray-400">
                                            <FaCommentMedical className="text-4xl mx-auto mb-4 opacity-20" />
                                            <p className="text-sm px-4">No one has messaged about this post yet.</p>
                                        </div>
                                    ) : (
                                        conversations.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => startChatWithUser(user)}
                                                className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-3"
                                            >
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-800 truncate">{user.full_name || 'User'}</p>
                                                    <p className="text-xs text-gray-500 truncate">{user.institution || 'Pharmacy'}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                                        {/* Back to list if poster */}
                                        {isPoster && (
                                            <button
                                                onClick={() => setSelectedChatUser(null)}
                                                className="self-start text-[10px] font-bold text-blue-600 hover:underline mb-2 flex items-center gap-1"
                                            >
                                                ← Back to all inquiries
                                            </button>
                                        )}

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
                                                const userObj = JSON.parse(localStorage.getItem('user') || '{}');
                                                const myId = String(userObj.id || userObj.user_id || '').toLowerCase();
                                                const commentUserId = String(comment.user_id || '').toLowerCase();
                                                const isMe = (commentUserId === myId && myId !== '');

                                                const getUserStyle = (userId, isCurrentUser) => {
                                                    if (isCurrentUser) return {
                                                        bubble: 'bg-blue-600',
                                                        label: 'text-blue-600',
                                                        align: 'items-end',
                                                        radius: 'rounded-tr-none'
                                                    };
                                                    return {
                                                        bubble: 'bg-gray-800',
                                                        label: 'text-gray-800',
                                                        align: 'items-start',
                                                        radius: 'rounded-tl-none'
                                                    };
                                                };

                                                const style = getUserStyle(comment.user_id, isMe);

                                                return (
                                                    <div key={comment.id} className={`flex flex-col ${isMe ? 'self-end items-end' : 'self-start items-start'} max-w-[90%] mb-2`}>
                                                        <div className={`p-3 px-4 rounded-2xl shadow-md text-sm leading-relaxed text-white ${style.bubble} ${style.radius}`}>
                                                            {comment.content}
                                                        </div>
                                                        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.label}`}>
                                                                {isMe ? 'You' : comment.user?.full_name || 'Pharmacist'}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 font-medium ml-2">
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
                                            placeholder="Type a secrete message..."
                                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition">
                                            <FaPaperPlane />
                                        </button>
                                    </form>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                            <FaCommentMedical className="text-5xl mb-4 text-gray-200" />
                            <p className="font-medium">Select a medication posting to view details and start a private (secrete) conversation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MedicationAvailability;
