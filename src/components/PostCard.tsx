'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Post } from '@/models/Post';
import { User } from '@/models/User';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onDelete?: (postId: string) => void;
  onLikeUpdate?: (postId: string, likeCount: number, isLiked: boolean) => void;
}

export default function PostCard({ post, currentUser, onDelete, onLikeUpdate }: PostCardProps) {
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(post.userLiked || false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  // Fetch comment count
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const response = await fetch(`/api/posts/${post._id}/comments`);
        if (response.ok) {
          const comments = await response.json();
          setCommentCount(comments.length);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchCommentCount();
  }, [post._id]);

  // Handle like
  const handleLike = async () => {
    try {
      setIsLiking(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
        
        // Update parent component if callback provided
        if (onLikeUpdate) {
          onLikeUpdate(post._id, data.likeCount, data.liked);
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (onDelete) {
          onDelete(post._id);
        }
      } else {
        console.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) 
    : '';
  
  const isOwner = currentUser && post.userId === currentUser._id;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Post header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-indigo-800">
              {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {post.author?.name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</p>
          </div>
        </div>
        
        {isOwner && (
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Post image */}
      {post.imageUrl && (
        <Link href={`/posts/${post._id}`} className="block">
          <div className="relative pb-[75%] bg-gray-100 dark:bg-gray-700">
            <img
              src={post.imageUrl}
              alt={post.caption || 'Post image'}
              className="absolute h-full w-full object-cover"
            />
          </div>
        </Link>
      )}
      
      {/* Post actions */}
      <div className="p-4">
        <div className="flex space-x-4 mb-3">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-1 ${
              isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
            } hover:text-red-500 transition-colors disabled:opacity-50 focus:outline-none`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill={isLiked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={isLiked ? 0 : 1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{likeCount}</span>
          </button>
          
          <Link href={`/posts/${post._id}`} className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{commentCount}</span>
          </Link>
        </div>
        
        {/* Post caption */}
        {post.caption && (
          <div className="mt-1">
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">{post.author?.name || 'Unknown'}: </span>
              {post.caption.length > 150 
                ? `${post.caption.substring(0, 150)}...` 
                : post.caption}
            </p>
            {post.caption.length > 150 && (
              <Link href={`/posts/${post._id}`} className="text-sm text-gray-500 dark:text-gray-400 hover:underline">
                Read more
              </Link>
            )}
          </div>
        )}
        
        {/* View comments link */}
        {commentCount > 0 && (
          <Link href={`/posts/${post._id}`} className="block mt-2 text-sm text-gray-500 dark:text-gray-400 hover:underline">
            {commentCount === 1 ? 'View 1 comment' : `View all ${commentCount} comments`}
          </Link>
        )}
      </div>
    </div>
  );
}