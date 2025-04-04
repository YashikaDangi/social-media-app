'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { 
  Home, 
  User, 
  Settings, 
  LogOut 
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { Post } from '@/models/Post';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse w-16 h-16 mx-auto bg-indigo-500 rounded-full mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              MyApp
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-2"
              >
                <Home className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link 
                href="/profile" 
                className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-2"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 flex items-center space-x-2"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content Column */}
          <div className="col-span-8 space-y-6">
            {/* Create Post Section */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create a Post
              </h3>
              <CreatePost onPostCreated={handleNewPost} />
            </div> */}

            {/* All Posts Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Recent Posts
              </h3>
              
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
                  <p className="text-gray-500 dark:text-gray-400">
                   <LoadingSpinner/>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          {/* <div className="col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Welcome, {user.name}!
              </h3>
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
}