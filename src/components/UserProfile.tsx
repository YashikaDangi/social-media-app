'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { Post } from '@/models/Post';
import Link from 'next/link';
import CreatePost from './CreatePost';
import { 
  Home,
  PlusCircle,
  Grid,
  Heart,
  Image as ImageIcon,
  Camera
} from 'lucide-react';

// Type for post creation response
interface PostCreationResponse {
  post?: Post;
  _id?: string;
}

export default function UserProfile() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postCount, setPostCount] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);

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
  const handleNewPost = (postResponse: PostCreationResponse) => {
    // Extract the post from the response
    const newPost = postResponse.post || postResponse;
    
    // Make sure the post has an _id before adding it to the array
    if (newPost && newPost._id) {
      setPosts([newPost as Post, ...posts]);
      setPostCount(prevCount => prevCount + 1);
    } else {
      console.error('Received invalid post data:', postResponse);
    }
  };

  if (loading || isLoading) {
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
      {/* Simplified Instagram-style header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/dashboard" className="font-serif text-xl font-bold italic">
                Socialify
              </Link>
            </div>
            
            {/* Navigation icons - only essential ones */}
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
              
              {/* User avatar with logout */}
              <div className="relative">
                <button
                  className="h-8 w-8 rounded-full ring-2 ring-gray-200 overflow-hidden focus:outline-none"
                  onClick={() => logout()}
                  title="Logout"
                >
                  <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Instagram profile section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {/* Profile header - simplified */}
          <div className="flex flex-col md:flex-row items-start md:items-center">
            {/* Profile picture */}
            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-10">
              <div className="h-20 w-20 md:h-36 md:w-36 rounded-full ring-2 ring-gray-200 p-0.5 bg-white">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            
            {/* Profile info - simplified */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center mb-4">
                <h1 className="text-xl font-light mr-6">{user.name}</h1>
                <button 
                  onClick={() => setShowCreatePost(!showCreatePost)}
                  className="mt-3 md:mt-0 bg-blue-500 text-white text-sm font-medium py-1.5 px-4 rounded focus:outline-none hover:bg-blue-600 flex items-center"
                >
                  <Camera className="h-4 w-4 mr-1.5" />
                  Create Post
                </button>
              </div>
              
              {/* Stats - only posts count */}
              <div className="flex space-x-8 mb-4">
                <div className="text-sm">
                  <span className="font-semibold">{postCount}</span> posts
                </div>
              </div>
              
              {/* Bio - Email only */}
              <div className="text-sm">
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Single Tab - Posts only */}
        <div className="border-t border-gray-200">
          <div className="flex justify-center">
            <div className="py-3 px-4 flex items-center text-xs font-semibold uppercase tracking-wider border-t border-t-black text-black">
              <Grid className="h-3 w-3 mr-1.5" />
              Posts
            </div>
          </div>
        </div>
        
        {/* Posts Grid - simplified */}
        <div className="mt-4">
          {posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-6">
              {posts.map(post => (
                <div key={post._id} className="aspect-square relative group">
                  <Link href={`/posts/${post._id}`}>
                    <div className="w-full h-full bg-gray-100 overflow-hidden relative">
                      {post.imageUrl && (
                        <Image
                          src={post.imageUrl}
                          alt={post.caption || 'Post image'}
                          fill
                          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-4 text-white">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1.5" fill="white" />
                          <span className="text-sm font-semibold">{post.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto h-16 w-16 mb-4 rounded-full border-2 border-black flex items-center justify-center">
                <ImageIcon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-light mb-2">Share Photos</h3>
              <p className="text-sm text-gray-500 mb-6">
                When you share photos, they will appear on your profile.
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
    </div>
  );
}