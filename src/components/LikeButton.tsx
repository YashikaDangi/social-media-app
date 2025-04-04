'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface LikeButtonProps {
  postId: string;
  initialLikeCount?: number;
  initialUserLiked?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  postId, 
  initialLikeCount = 0, 
  initialUserLiked = false 
}) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialUserLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch the initial like status if the user is logged in
    const fetchLikeStatus = async () => {
      if (!user) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/posts/${postId}/like`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setLiked(data.userLiked);
          setLikeCount(data.likeCount);
        }
      } catch (error) {
        console.error('Error fetching like status:', error);
      }
    };

    fetchLikeStatus();
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login';
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center space-x-1 ${
        liked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
      } hover:text-red-500 transition-colors disabled:opacity-50 focus:outline-none`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill={liked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={liked ? 0 : 1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{likeCount}</span>
    </button>
  );
};

export default LikeButton;