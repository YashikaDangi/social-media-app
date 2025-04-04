'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import PostCard from '@/components/PostCard';
import { Post } from '@/models/Post';
import Link from 'next/link';
import CreatePost from './CreatePost';
import { 
  Home, 
  User, 
  LogOut, 
  PlusCircle,
  Grid,
  List
} from 'lucide-react';

export default function UserProfile() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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
  
  // Handle post creation
  const handleNewPost = (post: Post) => {
    setPosts([post, ...posts]);
  };

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
          {/* Sidebar Profile Card */}
          <div className="col-span-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32"></div>
              <div className="px-6 py-4 relative">
                <div className="absolute -top-10 left-6">
                  <div className="h-20 w-20 bg-white dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-md">
                    <span className="text-3xl font-bold text-indigo-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-12">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {user.email}
                  </p>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-4">
                      <div className="text-center">
                        <span className="block text-lg font-bold text-gray-900 dark:text-white">
                          {postCount}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Posts
                        </span>
                      </div>
                    </div>
                    <Link 
                      href="/dashboard" 
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* Create Post Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create a Post
                </h3>
                
              </div>
              <CreatePost onPostCreated={handleNewPost} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-8 space-y-6">
            

            {/* Posts Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Your Posts
              </h3>
              <div className="flex items-center space-x-2 ">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {posts.length > 0 ? (
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}`}>
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
                  <p className="text-gray-500 dark:text-gray-400">
                    You haven't created any posts yet.
                  </p>
                  <button 
                    className="mt-4 flex items-center justify-center mx-auto text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create your first post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}