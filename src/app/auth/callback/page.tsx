// In app/auth/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log("Callback page mounted, token:", token ? "exists" : "missing");
    
    if (token) {
      try {
        // Save token to localStorage
        localStorage.setItem('token', token);
        console.log("Token saved to localStorage");
        
        // Redirect to dashboard
        console.log("Attempting redirect to dashboard");
        router.push('/dashboard');
      } catch (err) {
        console.error("Error in callback:", err);
        setError("Failed to process authentication");
      }
    } else {
      console.log("No token found, redirecting to login");
      router.push('/auth/login');
    }
  }, [token, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Processing authentication...</h2>
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
        
        {token && (
          <div className="mt-4 text-center">
            <p className="mb-2">If you're not automatically redirected:</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}