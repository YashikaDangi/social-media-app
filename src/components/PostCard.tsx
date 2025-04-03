'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { User } from '@/models/User';
import { Post } from '@/models/Post';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onDelete: (postId: string) => void;
}

export default function PostCard({ post, currentUser, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [postAuthor, setPostAuthor] = useState<Partial<User> | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Check if post is liked by current user
  useEffect(() => {
    if (post.likes && currentUser._id) {
      // Convert to string safely with optional chaining
      const currentUserIdStr = typeof currentUser._id === 'string' 
        ? currentUser._id 
        : String(currentUser._id);
      
      // Check if the user's ID is in the likes array
      const isUserLiked = Array.isArray(post.likes) && post.likes.some(likeId => {
        if (typeof likeId === 'string') {
          return likeId === currentUserIdStr;
        } else if (likeId && typeof likeId === 'object') {
          // Handle ObjectId or object with toString method
          return String(likeId) === currentUserIdStr;
        }
        return false;
      });
      
      setIsLiked(isUserLiked);
    } else {
      setIsLiked(false);
    }
  }, [post.likes, currentUser._id]);
  
  // Fetch post author info
  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = typeof post.userId === 'string' 
          ? post.userId 
          : String(post.userId);
          
        const response = await fetch(`/api/auth/user?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPostAuthor(data.user);
        }
      } catch (error) {
        console.error('Error fetching post author:', error);
      }
    };
    
    fetchAuthor();
  }, [post.userId]);
  
  // Handle like/unlike
  const handleToggleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      const method = isLiked ? 'DELETE' : 'POST';
      const postId = typeof post._id === 'string' ? post._id : String(post._id);
      
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  
  // Handle delete post
  const handleDeletePost = async () => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      const postId = typeof post._id === 'string' ? post._id : String(post._id);
      
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        onDelete(postId);
      } else {
        console.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Format date
  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) 
    : '';
  
  // Compare user IDs safely
  const isCurrentUserAuthor = () => {
    if (!currentUser._id || !post.userId) return false;
    
    const currentUserId = typeof currentUser._id === 'string' 
      ? currentUser._id 
      : String(currentUser._id);
    
    const postUserId = typeof post.userId === 'string'
      ? post.userId
      : String(post.userId);
      
    return currentUserId === postUserId;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md dark:bg-gray-800 overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-gray-600">
              {postAuthor?.name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{postAuthor?.name || 'Loading...'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</p>
          </div>
        </div>
        
        {/* Post Options (only for post author) */}
        {isCurrentUserAuthor() && (
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 dark:bg-gray-700">
                <Link 
                  href={`/post/edit/${typeof post._id === 'string' ? post._id : String(post._id)}`} 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Edit Post
                </Link>
                <button 
                  onClick={handleDeletePost}
                  disabled={isDeleting}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">{post.content}</p>
      </div>
      
      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1 p-4`}>
          {post.images.map((image, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-md">
              <img
                src={image}
                alt={`Post image ${index + 1}`}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Post Stats */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <button 
          onClick={() => { /* Show likes modal */ }}
          className="text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
        </button>
      </div>
      
      {/* Post Actions */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex">
        <button 
          onClick={handleToggleLike}
          className={`flex items-center justify-center w-1/2 py-2 space-x-2 rounded-md ${
            isLiked ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
          } hover:bg-gray-100 dark:hover:bg-gray-700`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center justify-center w-1/2 py-2 space-x-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>Comment</span>
        </button>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          postId={typeof post._id === 'string' ? post._id : String(post._id)} 
          currentUser={currentUser} 
        />
      )}
    </div>
  );
}