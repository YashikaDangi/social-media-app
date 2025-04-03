'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import CreatePost from '@/components/CreatePost';
import PostsList from '@/components/PostList';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [refreshPosts, setRefreshPosts] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handlePostCreated = () => {
    // Increment to trigger a re-fetch in the PostsList component
    setRefreshPosts(prev => prev + 1);
  };

  if (loading) {
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
    <div className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Profile
            </button>
            
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'posts'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Posts
            </button>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Welcome, {user.name}!</h3>
              <p className="text-gray-500 dark:text-gray-400">Email: {user.email}</p>
              <p className="text-gray-500 dark:text-gray-400">Account created: {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
        
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-8">
            <CreatePost onPostCreated={handlePostCreated} />
            
            <div className="border-t pt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Posts</h3>
              <PostsList key={refreshPosts} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}