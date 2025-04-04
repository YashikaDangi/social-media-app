'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Heart } from 'lucide-react';

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
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
          ? err 
          : 'Failed to add comment';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="border-t border-gray-200 pt-3 pb-3 px-4">
        <p className="text-sm text-gray-500 text-center">
          Please <Link href="/auth/login" className="text-blue-500 font-medium">log in</Link> to add a comment
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-3 pb-3 px-4">
      {error && (
        <div className="mb-2 p-2 text-xs bg-red-50 text-red-500 rounded">
          {error}
        </div>
      )}
      
      <div className="flex items-center">
        <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
          <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <input
          type="text"
          className="flex-grow py-2 px-3 text-sm border-none focus:outline-none bg-transparent"
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className={`ml-2 text-blue-500 font-semibold text-sm ${
            isSubmitting || !content.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-700'
          }`}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
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
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : typeof err === 'string' 
            ? err 
            : 'Error loading comments';
        
        setError(errorMessage);
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
    return (
      <div className="px-4 py-2 text-center">
        <div className="inline-block animate-pulse w-5 h-5 rounded-full bg-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-center">
        <div className="text-red-500 text-xs">Failed to load comments</div>
      </div>
    );
  }

  return (
    <div>
      {/* Comments preview section - Instagram style */}
      {comments.length > 0 && (
        <div className="px-4 py-2">
          <Link href={`/posts/${postId}`} className="block text-sm text-gray-500 mb-2">
            {comments.length === 1 
              ? 'View 1 comment' 
              : `View all ${comments.length} comments`
            }
          </Link>
          
          {/* Only show up to 2 most recent comments in feed view */}
          {comments.slice(0, 2).map((comment) => (
            <div key={comment._id} className="mb-1">
              <p className="text-sm">
                <span className="font-semibold mr-1">{comment.author?.name || 'Anonymous'}</span>
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Time posted */}
      <div className="px-4 py-1">
        <p className="text-xs uppercase text-gray-400">
          {comments.length > 0 && comments[0].createdAt
            ? formatDistanceToNow(
                new Date(typeof comments[0].createdAt === 'string' 
                  ? comments[0].createdAt 
                  : comments[0].createdAt
                ), 
                { addSuffix: true }
              )
            : ''
          }
        </p>
      </div>
      
      {/* Comment form */}
      <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
    </div>
  );
};

// Full comment view for post detail page
export const PostDetailComments: React.FC<CommentListProps> = ({ postId }) => {
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
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : typeof err === 'string' 
            ? err 
            : 'Error loading comments';
        
        setError(errorMessage);
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
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 text-sm">Error loading comments</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Comments header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-semibold">Comments {comments.length > 0 && `(${comments.length})`}</h2>
      </div>
      
      {/* Comment list - full version for post detail page */}
      <div className="max-h-96 overflow-y-auto">
        {comments.length > 0 ? (
          <div>
            {comments.map((comment) => (
              <div key={comment._id} className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                      {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline flex-wrap">
                      <p className="text-sm font-semibold mr-2">
                        {comment.author?.name || 'Anonymous'}
                      </p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <div className="mt-1 flex items-center space-x-4">
                      <p className="text-xs text-gray-500">
                        {typeof comment.createdAt === 'string'
                          ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                          : formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </p>
                      <button className="text-xs font-semibold text-gray-500">Like</button>
                      <button className="text-xs font-semibold text-gray-500">Reply</button>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="text-gray-400 hover:text-gray-600">
                      <Heart className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
      
      {/* Comment form */}
      <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
    </div>
  );
};

// Export a combined component for easier imports
export default function CommentComponents({ postId }: CommentListProps) {
  return <CommentList postId={postId} />;
}