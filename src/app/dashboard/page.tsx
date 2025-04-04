'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { Post } from '@/models/Post';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Fetch all posts with like information
  useEffect(() => {
    if (user) {
      const fetchPosts = async () => {
        try {
          setIsLoading(true);
          const token = localStorage.getItem('token');
          
          // Fetch all posts
          const response = await fetch('/api/posts?limit=20', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
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
          console.error('Error fetching posts:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPosts();
    }
  }, [user]);

  // Handle post creation
  const handleNewPost = (post: Post) => {
    setPosts([post, ...posts]);
  };

  // Handle post deletion
  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post._id !== postId));
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
        {/* Dashboard Header with User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
            <Link href="/profile" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View Profile
            </Link>
          </div>
          
          <div className="flex items-center p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
            <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-xl font-bold text-indigo-800">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-200">Welcome, {user.name}!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-auto py-1 px-3 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Create Post Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create a Post</h3>
          <CreatePost onPostCreated={handleNewPost} />
        </div>
        
        {/* All Posts Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Posts</h3>
          
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No posts available. Be the first to create a post!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}