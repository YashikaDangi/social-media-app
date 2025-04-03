import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Social Feed App</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Connect with friends, share your thoughts, and engage with others.
        </p>
        
        <div className="flex flex-col space-y-4">
          <Link href="/auth/login" className="w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Login
          </Link>
          <Link href="/auth/register" className="w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Register
          </Link>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Features:</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
            <li>Post your thoughts and images</li>
            <li>Like and comment on posts</li>
            <li>See who liked a post</li>
            <li>Edit and delete your content</li>
          </ul>
        </div>
      </div>
    </main>
  );
}