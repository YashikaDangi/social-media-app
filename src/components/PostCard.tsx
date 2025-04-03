// src/components/PostCard.tsx
'use client';

import { useState } from 'react';
import { Post } from '@/models/Post';
import { User } from '@/models/User';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onDelete: (postId: string) => void;
}

export default function PostCard({ post, currentUser, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Check if current user is the author
  const isAuthor = post.userId === currentUser._id;
  
  // Handle post deletion
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    setIsDeleting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      // Call the parent callback
      onDelete(post._id);
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md dark:bg-gray-800 overflow-hidden">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700">
          {error}
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {post.title}
          </h2>
          
          {/* Action buttons */}
          {isAuthor && (
            <div className="flex space-x-2">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                aria-label="Delete post"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-line">
          {post.content}
        </p>
        
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Posted by {post.user?.name || 'Unknown'} • {formatDate(post.createdAt)}
        </div>
      </div>
    </div>
  );
}