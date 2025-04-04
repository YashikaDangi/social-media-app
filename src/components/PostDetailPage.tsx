'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

// Types
interface Comment {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  author?: {
    name: string;
    email: string;
  };
}

// Comment Form Component
interface CommentFormProps {
  postId: string;
  onCommentAdded: (comment: Comment) => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }
    
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }
      
      const data = await response.json();
      onCommentAdded(data.comment);
      setContent('');
    } catch (err: any) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mt-4">
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Please <a href="/auth/login" className="text-indigo-600 hover:text-indigo-500">log in</a> to add a comment
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-2">
        <textarea
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
      </div>
      
      {error && (
        <div className="mb-2 p-2 text-sm bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

// Comment List Component
interface CommentListProps {
  postId: string;
}

export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${postId}/comments`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        
        const data = await response.json();
        setComments(data);
      } catch (err: any) {
        setError(err.message || 'Error loading comments');
        console.error('Error fetching comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleCommentAdded = (newComment: Comment) => {
    setComments(prevComments => [newComment, ...prevComments]);
  };

  if (loading) {
    return <div className="text-center py-4">Loading comments...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-4 mt-6">
      <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
      
      <h3 className="text-lg font-semibold mt-6">{comments.length > 0 ? `Comments (${comments.length})` : 'No comments yet'}</h3>
      
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-indigo-800">
                    {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.author?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {typeof comment.createdAt === 'string' 
                        ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                        : formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

// Export a combined component for easier imports
export default function CommentComponents({ postId }: CommentListProps) {
  return <CommentList postId={postId} />;
}