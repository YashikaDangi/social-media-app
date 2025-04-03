'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

export default function EditPost({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id } = params;
  
  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/posts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
          setContent(data.post.content);
          setExistingImages(data.post.images || []);
        } else {
          setError('Failed to fetch post');
        }
      } catch (error) {
        setError('Error fetching post data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchPost();
    }
  }, [id, user]);
  
  // Check if user is the post owner
  useEffect(() => {
    if (post && user && post.userId !== user._id) {
      router.push('/feed');
    }
  }, [post, user, router]);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Check if total selected images exceeds 4
    if (existingImages.length - imagesToRemove.length + images.length + files.length > 4) {
      setError('You can upload a maximum of 4 images');
      return;
    }
    
    // Track new files and previews
    const newImages: File[] = [];
    const newPreviewUrls: string[] = [];
    
    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      
      // Validate file size (5 MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Images must be less than 5 MB in size');
        return;
      }
      
      newImages.push(file);
      newPreviewUrls.push(URL.createObjectURL(file));
    });
    
    setImages([...images, ...newImages]);
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    setError('');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const removeNewImage = (index: number) => {
    // Release object URL
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setImages(images.filter((_, i) => i !== index));
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index));
  };
  
  const toggleExistingImage = (imagePath: string) => {
    if (imagesToRemove.includes(imagePath)) {
      // Remove from the "to remove" list
      setImagesToRemove(imagesToRemove.filter(path => path !== imagePath));
    } else {
      // Add to the "to remove" list
      setImagesToRemove([...imagesToRemove, imagePath]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && existingImages.length - imagesToRemove.length + images.length === 0) {
      setError('Post cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const formData = new FormData();
      formData.append('content', content);
      
      // Append new images if any
      images.forEach(image => {
        formData.append('images', image);
      });
      
      // Append images to remove
      imagesToRemove.forEach(path => {
        formData.append('removeImages', path);
      });
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        // Navigate back to feed
        router.push('/feed');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update post');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (!user || !post) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-md dark:bg-gray-800 mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Post</h1>
            <Link 
              href="/feed"
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Cancel
            </Link>
          </div>
          
          {/* Edit Form */}
          <div className="p-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  placeholder="What's on your mind?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={5}
                />
                
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Images</h3>
                    <div className={`grid ${existingImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                      {existingImages.map((imagePath, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={imagePath} 
                            alt={`Image ${index + 1}`} 
                            className={`w-full h-40 object-cover rounded-md ${
                              imagesToRemove.includes(imagePath) ? 'opacity-30' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => toggleExistingImage(imagePath)}
                            className={`absolute top-2 right-2 p-1 ${
                              imagesToRemove.includes(imagePath) 
                                ? 'bg-green-500' 
                                : 'bg-red-500'
                            } rounded-full text-white`}
                          >
                            {imagesToRemove.includes(imagePath) ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* New Images */}
                {imagePreviewUrls.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">New Images</h3>
                    <div className={`grid ${imagePreviewUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`New image ${index + 1}`} 
                            className="w-full h-40 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Error Message */}
                {error && (
                  <div className="text-sm text-red-600">
                    {error}
                  </div>
                )}
                
                {/* Image Upload Button */}
                <div className="flex items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <label 
                    htmlFor="edit-image-upload"
                    className="flex items-center space-x-2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Add Photos</span>
                  </label>
                  <span className="text-xs text-gray-500 ml-2">
                    ({existingImages.length - imagesToRemove.length + images.length}/4)
                  </span>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || (!content.trim() && existingImages.length - imagesToRemove.length + images.length === 0)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}