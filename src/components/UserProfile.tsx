'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import PostCard from '@/components/PostCard';
import { Post } from '@/models/Post';
import { User } from '@/models/User';
import Link from 'next/link';

export default function UserProfile() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Fetch the user's posts with like information
  useEffect(() => {
    if (user) {
      const fetchUserPosts = async () => {
        try {
          setIsLoading(true);
          const token = localStorage.getItem('token');
          
          // Fetch user's posts
          const response = await fetch('/api/posts/user', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setPostCount(data.posts.length);
            
            // Fetch like information for each post
            const postsWithLikes = await Promise.all(data.posts.map(async (post: Post) => {
              try {
                const likeResponse = await fetch(`/api/posts/${post._id}/like`, {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                });
                
                if (likeResponse.ok) {
                  const likeData = await likeResponse.json();
                  post.likes = likeData.likeCount;
                  post.userLiked = likeData.userLiked;
                }
              } catch (error) {
                console.error(`Error fetching likes for post ${post._id}:`, error);
              }
              
              return post;
            }));
            
            setPosts(postsWithLikes);
          }
        } catch (error) {
          console.error('Error fetching user posts:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchUserPosts();
    }
  }, [user]);

  // Handle post deletion
  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post._id !== postId));
    setPostCount(prevCount => prevCount - 1);
  };
  
  // Handle like updates
  const handleLikeUpdate = (postId: string, likeCount: number, isLiked: boolean) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          likes: likeCount,
          userLiked: isLiked
        };
      }
      return post;
    }));
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        {/* User Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-indigo-600 h-24 flex items-end"></div>
          <div className="px-6 py-4 relative">
            <div className="absolute -top-10 left-6">
              <div className="h-20 w-20 bg-indigo-100 rounded-full border-4 border-white flex items-center justify-center">
                <span className="text-3xl font-bold text-indigo-800">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              
              <div className="mt-4 flex space-x-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">{postCount}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">posts</span>
                </div>
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                  Go to Dashboard
                </Link>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {/* User Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Posts</h3>
          
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={user}
                  onDelete={handleDeletePost}
                  onLikeUpdate={handleLikeUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="text-gray-500 dark:text-gray-400">You haven't created any posts yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}