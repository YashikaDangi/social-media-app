'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/app/context/AuthContext';
import { PostDetailComments } from '@/components/CommentComponents';
import { Post } from '@/models/Post';
import { Heart, MessageCircle, Bookmark, ArrowLeft, MoreHorizontal } from 'lucide-react';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params properly using React.use()
  const resolvedParams = React.use(params);
  const postId = resolvedParams.id;
  
  const { user, loading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch post details
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`/api/posts/${postId}`, {
          headers
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        
        const data = await response.json();
        setPost(data);
        setLikeCount(data.likes || 0);
        setIsLiked(data.userLiked || false);
      } catch (err: any) {
        setError(err.message || 'Failed to load post');
        console.error('Error fetching post:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Handle like action
  const handleLike = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      setIsLiking(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Check if current user is post owner
  const isOwner = user && post && post.userId === user._id;

  // Handle post deletion
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post');
    }
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <div className="w-full max-w-lg animate-pulse">
          <div className="h-14 bg-gray-100 mb-2"></div>
          <div className="h-96 bg-gray-100 mb-4"></div>
          <div className="h-10 bg-gray-100 mb-4"></div>
          <div className="h-24 bg-gray-100"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md p-6 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-center mb-6 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-800 mb-4 text-center">Post not found</h2>
          <p className="text-gray-600 mb-6 text-center">{error || 'The post you\'re looking for doesn\'t exist or has been removed.'}</p>
          <div className="flex justify-center">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Instagram-style header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-black p-2 -ml-2">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-base font-normal ml-2">Post</h1>
            </div>
            
            {isOwner && (
              <button 
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 text-black"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Post content */}
      <div className="pt-14 pb-6 max-w-5xl mx-auto">
        <div className="md:flex md:bg-white md:border md:border-gray-200 md:rounded-md overflow-hidden">
          {/* Left side - Image (bigger on desktop) */}
          <div className="md:w-3/5 bg-black flex items-center">
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post content"
                className="w-full h-auto object-contain max-h-[600px]"
              />
            )}
          </div>
          
          {/* Right side - Comments (only visible on desktop) */}
          <div className="hidden md:flex md:flex-col md:w-2/5">
            {/* Post Header */}
            <div className="p-3 border-b border-gray-200 flex items-center">
              <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
                <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                  {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {post.author?.name || 'Unknown User'}
              </span>
            </div>
            
            {/* Comments section */}
            <div className="flex-grow overflow-y-auto">
              {/* First comment is the post caption */}
              {post.caption && (
                <div className="px-4 py-3 flex">
                  <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                    <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                      {post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold mr-2 text-gray-800">{post.author?.name || 'Unknown User'}</span>
                      <span className="text-gray-800">{post.caption}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
                  </div>
                </div>
              )}
              
              {/* Comments */}
              <div className="flex-grow">
                <PostDetailComments postId={postId} />
              </div>
            </div>
            
            {/* Post actions */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex justify-between mb-2">
                <div className="flex space-x-4">
                  <button
                    onClick={handleLike}
                    disabled={isLiking}
                    className="focus:outline-none"
                  >
                    <Heart 
                      className={`h-6 w-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-black'}`} 
                      strokeWidth={isLiked ? 0 : 1.5} 
                    />
                  </button>
                  <button className="focus:outline-none">
                    <MessageCircle className="h-6 w-6 text-black" strokeWidth={1.5} />
                  </button>
                </div>
                <button className="focus:outline-none">
                  <Bookmark className="h-6 w-6 text-black" strokeWidth={1.5} />
                </button>
              </div>
              
              {/* Like count */}
              {likeCount > 0 && (
                <p className="text-sm font-semibold text-gray-800 mb-1">
                  {likeCount === 1 ? '1 like' : `${likeCount} likes`}
                </p>
              )}
              
              {/* Post date */}
              <p className="text-xs uppercase text-gray-400">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
        
        {/* Mobile version of post details */}
        <div className="md:hidden bg-white border-b border-gray-200">
          {/* Post actions */}
          <div className="p-3">
            <div className="flex justify-between mb-2">
              <div className="flex space-x-4">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className="focus:outline-none"
                >
                  <Heart 
                    className={`h-6 w-6 ${isLiked ? 'text-red-500 fill-red-500' : 'text-black'}`} 
                    strokeWidth={isLiked ? 0 : 1.5} 
                  />
                </button>
                <button className="focus:outline-none">
                  <MessageCircle className="h-6 w-6 text-black" strokeWidth={1.5} />
                </button>
              </div>
              <button className="focus:outline-none">
                <Bookmark className="h-6 w-6 text-black" strokeWidth={1.5} />
              </button>
            </div>
            
            {/* Like count */}
            {likeCount > 0 && (
              <p className="text-sm font-semibold text-gray-800 mb-1">
                {likeCount === 1 ? '1 like' : `${likeCount} likes`}
              </p>
            )}
            
            {/* Caption */}
            {post.caption && (
              <div className="mb-2">
                <p className="text-sm">
                  <span className="font-semibold mr-1 text-gray-800">{post.author?.name || 'Unknown User'}</span>
                  <span className="text-gray-800">{post.caption}</span>
                </p>
              </div>
            )}
            
            {/* Post date */}
            <p className="text-xs uppercase text-gray-400 mb-2">
              {formattedDate}
            </p>
          </div>
          
          {/* Comments for mobile */}
          <div className="bg-white" id="comments-section">
            <PostDetailComments postId={postId} />
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl overflow-hidden max-w-xs w-full">
            <div className="text-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-500">Delete Post?</h3>
              <p className="text-sm text-gray-500 mt-2">Are you sure you want to delete this post? This action cannot be undone.</p>
            </div>
            <div className="divide-y divide-gray-200">
              <button 
                onClick={handleDelete}
                className="w-full p-3 text-red-500 font-semibold text-sm hover:bg-gray-50"
              >
                Delete
              </button>
              <button 
                onClick={() => setShowDeleteDialog(false)}
                className="w-full p-3 text-gray-800 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}