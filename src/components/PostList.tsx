'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
  _id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export default function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      const response = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check for non-JSON response
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response:', await response.text());
        throw new Error('Received invalid response from server');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
      }
      
      setPosts(data.posts || []);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [router]);

  if (loading) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
        <button 
          onClick={fetchPosts}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">No posts found. Create your first post!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      {posts.map((post) => (
        <div key={post._id} className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{post.title}</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{post.content}</p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Posted on {new Date(post.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
      <button 
        onClick={fetchPosts}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Refresh Posts
      </button>
    </div>
  );
}