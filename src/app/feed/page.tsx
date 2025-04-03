'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import CreatePostForm from '@/components/CreatePostForm';
import { Post } from '@/models/Post';

export default function Feed() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Fix: Properly type the posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  // Fetch posts
  const fetchPosts = async (pageNum = 1) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/posts?page=${pageNum}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(pageNum === 1 ? data.posts : [...posts, ...data.posts]);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load more posts
  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };
  
  // Handle new post creation
  const handleNewPost = (post: Post) => {
    setPosts([post, ...posts]);
  };
  
  // Handle post deletion
  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(post => post._id !== postId));
  };
  
  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-md dark:bg-gray-800 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Feed</h1>
          </div>
          
          {/* Create Post Form */}
          <div className="p-4">
            <CreatePostForm onPostCreated={handleNewPost} />
          </div>
        </div>
        
        {/* Posts List */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <PostCard 
                  key={post._id?.toString()} 
                  post={post} 
                  currentUser={user}
                  onDelete={handleDeletePost}
                />
              ))}
              
              {/* Load More Button */}
              {page < totalPages && (
                <div className="flex justify-center my-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md dark:bg-gray-800 p-8 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                No posts yet. Be the first to post something!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}