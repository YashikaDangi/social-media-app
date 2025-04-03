'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';

interface CreatePostFormProps {
  onPostCreated: (post: any) => void;
}

export default function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Check if total selected images exceeds 4
    if (images.length + files.length > 4) {
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
  
  const removeImage = (index: number) => {
    // Release object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setImages(images.filter((_, i) => i !== index));
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      setError('Post cannot be empty');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      const formData = new FormData();
      formData.append('content', content);
      
      // Append images if any
      images.forEach(image => {
        formData.append('images', image);
      });
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        onPostCreated(data.post);
        
        // Reset form
        setContent('');
        
        // Release object URLs to avoid memory leaks
        imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        setImages([]);
        setImagePreviewUrls([]);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create post');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg dark:bg-gray-800">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          {/* User Avatar */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-gray-600">
              {user?.name?.charAt(0) || '?'}
            </span>
          </div>
          
          {/* Post Input */}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || 'there'}?`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
            
            {/* Image Previews */}
            {imagePreviewUrls.length > 0 && (
              <div className={`grid ${imagePreviewUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mt-2`}>
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Image preview ${index + 1}`} 
                      className="w-full h-40 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="mt-2 text-sm text-red-600">
                {error}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="image-upload"
                />
                <label 
                  htmlFor="image-upload"
                  className="flex items-center space-x-2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Add Photos</span>
                </label>
                <span className="text-xs text-gray-500 ml-2">
                  ({images.length}/4)
                </span>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && images.length === 0)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}