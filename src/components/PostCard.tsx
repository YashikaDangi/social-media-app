'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Post } from '@/models/Post';
import { User } from '@/models/User';
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';

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

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showOptions) setShowOptions(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showOptions]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      {/* Post header - Instagram style */}
      <div className="p-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full ring-2 ring-gray-200 p-0.5">
            <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
              {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">
              {post.author?.name || 'Unknown User'}
            </p>
          </div>
        </div>
        
        {isOwner && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="More options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            
            {showOptions && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-100 overflow-hidden">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 font-medium focus:outline-none border-t border-gray-100"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Post image - Instagram style square format */}
      {post.imageUrl && (
        <div className="aspect-square w-full bg-gray-100 border-y border-gray-100">
          <img
            src={post.imageUrl}
            alt={post.caption || 'Post image'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Post actions - Instagram style */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-4">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`focus:outline-none ${isLiking ? 'opacity-50' : ''}`}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <Heart 
                className={`h-6 w-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-black'}`} 
                strokeWidth={isLiked ? 0 : 1.5} 
              />
            </button>
            
            <Link href={`/posts/${post._id}`} className="focus:outline-none">
              <MessageCircle className="h-6 w-6 text-black" strokeWidth={1.5} />
            </Link>
          </div>
          
          <button className="focus:outline-none">
            <Bookmark className="h-6 w-6 text-black" strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Like count - Instagram style */}
        {likeCount > 0 && (
          <p className="text-sm font-semibold mb-1">
            {likeCount === 1 ? '1 like' : `${likeCount} likes`}
          </p>
        )}
        
        {/* Caption - Instagram style */}
        {post.caption && (
          <div className="mb-1">
            <p className="text-sm">
              <span className="font-semibold mr-1">{post.author?.name || 'Unknown'}</span>
              {post.caption.length > 125 
                ? `${post.caption.substring(0, 125)}...` 
                : post.caption}
            </p>
            {post.caption.length > 125 && (
              <Link href={`/posts/${post._id}`} className="text-xs text-gray-500 hover:text-gray-700">
                more
              </Link>
            )}
          </div>
        )}
        
        {/* View comments link - Instagram style */}
        {commentCount > 0 && (
          <Link href={`/posts/${post._id}`} className="block text-xs text-gray-500 hover:text-gray-700 mt-1">
            {commentCount === 1 ? 'View 1 comment' : `View all ${commentCount} comments`}
          </Link>
        )}
        
        {/* Post date - Instagram style */}
        <p className="text-xs text-gray-400 uppercase mt-2">{formattedDate}</p>
      </div>
    </div>
  );
}