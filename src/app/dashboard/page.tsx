'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { 
  Home,
  PlusCircle,
  Image
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { Post } from '@/models/Post';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);

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
    setShowCreatePost(false);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse w-16 h-16 mx-auto bg-gray-200 rounded-full mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Instagram-style header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="font-serif text-xl font-bold italic">
                Socialify
              </Link>
            </div>
            
            {/* Navigation icons */}
            <nav className="flex items-center space-x-5">
              <Link href="/dashboard" className="text-gray-800 hover:text-black">
                <Home className="h-6 w-6" />
              </Link>
              <button 
                onClick={() => setShowCreatePost(!showCreatePost)} 
                className="text-gray-800 hover:text-black"
              >
                <PlusCircle className="h-6 w-6" />
              </button>
              
              {/* User avatar with profile link */}
              <Link href="/profile" className="relative">
                <div className="h-8 w-8 rounded-full ring-2 ring-gray-200 overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col max-w-lg mx-auto">
          
          
          {/* Feed */}
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeleton
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 mb-4 animate-pulse">
                  <div className="p-4 flex items-center space-x-3 border-b border-gray-100">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="aspect-square bg-gray-100"></div>
                  <div className="p-4 space-y-3">
                    <div className="flex space-x-3">
                      <div className="h-6 w-6 rounded-full bg-gray-200"></div>
                      <div className="h-6 w-6 rounded-full bg-gray-200"></div>
                    </div>
                    <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : posts.length > 0 ? (
              posts.map(post => (
                user && (
                  <PostCard
                    key={post._id || `post-${Math.random()}`}
                    post={post}
                    currentUser={user}
                    onDelete={handleDeletePost}
                    onLikeUpdate={handleLikeUpdate}
                  />
                )
              ))
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <div className="mx-auto h-16 w-16 mb-4 rounded-full border-2 border-black flex items-center justify-center">
                  <Image className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-light mb-2">No Posts Yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  When people you follow share posts, you'll see them here.
                </p>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="text-sm font-semibold text-blue-500"
                >
                  Share your first photo
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Create post modal - shows/hides based on state */}
        {showCreatePost && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowCreatePost(false)}></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="border-b border-gray-200 py-3 px-4 flex justify-between items-center">
                  <h3 className="font-semibold">Create new post</h3>
                  <button 
                    onClick={() => setShowCreatePost(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6">
                  <CreatePost 
                    onPostCreated={(post) => {
                      handleNewPost(post);
                      setShowCreatePost(false);
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-3">
          <Link href="/dashboard" className="text-black">
            <Home className="h-6 w-6 mx-auto" />
          </Link>
          <button 
            onClick={() => setShowCreatePost(true)}
            className="text-black" 
          >
            <PlusCircle className="h-6 w-6 mx-auto" />
          </button>
          <Link href="/profile" className="text-black">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto flex items-center justify-center">
              <span className="text-white text-xs">{user.name.charAt(0)}</span>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  );
}