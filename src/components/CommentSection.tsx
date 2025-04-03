'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User } from '@/models/User';
import { Comment } from '@/models/Post';

interface CommentSectionProps {
  postId: string;
  currentUser: User;
}

interface CommentWithUser extends Comment {
  user: Partial<User>;
}

export default function CommentSection({ postId, currentUser }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Fetch comments
  const fetchComments = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/posts/${postId}/comments?page=${pageNum}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(pageNum === 1 ? data.comments : [...comments, ...data.comments]);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load more comments
  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage);
    }
  };
  
  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add user info to the comment for display
        const newCommentWithUser = {
          ...data.comment,
          user: {
            _id: currentUser._id,
            name: currentUser.name
          }
        };
        
        setComments([newCommentWithUser, ...comments]);
        setNewComment('');
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Start editing a comment
  const handleEditComment = (comment: CommentWithUser) => {
    setEditingCommentId(comment._id?.toString() || null);
    setEditContent(comment.content);
  };
  
  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent })
      });
      
      if (response.ok) {
        // Update comment in state
        setComments(comments.map(comment => 
          comment._id?.toString() === commentId 
            ? { ...comment, content: editContent, updatedAt: new Date() } 
            : comment
        ));
        
        setEditingCommentId(null);
        setEditContent('');
      } else {
        console.error('Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };
  
  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Remove comment from state
        setComments(comments.filter(comment => comment._id?.toString() !== commentId));
      } else {
        console.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };
  
  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [postId]);
  
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="mb-4">
        <div className="flex items-start space-x-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-gray-600">
              {currentUser.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={2}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
      
      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          <>
            {comments.map((comment) => (
              <div key={comment._id?.toString()} className="flex space-x-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-600">
                    {comment.user?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  {editingCommentId === comment._id?.toString() ? (
                    // Edit mode
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={2}
                      />
                      <div className="mt-2 flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment._id?.toString() || '')}
                          disabled={!editContent.trim()}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {comment.user?.name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {comment.createdAt 
                              ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) 
                              : ''}
                          </p>
                        </div>
                        
                        {/* Comment actions (only for comment author) */}
                        {currentUser._id === comment.userId && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditComment(comment)}
                              className="p-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment._id?.toString() || '')}
                              className="p-1 text-xs text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-gray-800 dark:text-gray-200">{comment.content}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Load More Button */}
            {page < totalPages && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none focus:underline dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Load more comments'}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}