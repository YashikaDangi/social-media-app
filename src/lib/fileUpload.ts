import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Define allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function saveImageFromRequest(request: NextRequest): Promise<string[]> {
  const formData = await request.formData();
  const files = formData.getAll('images') as File[];
  const uploadedPaths: string[] = [];
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  for (const file of files) {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds the limit of 5MB`);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename
    const filename = `${uuidv4()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = path.join(uploadsDir, filename);
    
    // Save file
    fs.writeFileSync(filePath, buffer);
    
    // Store the relative path for database
    uploadedPaths.push(`/uploads/${filename}`);
  }
  
  return uploadedPaths;
}

export function getContentAndImagePathsFromFormData(formData: FormData): { content: string; imagePaths: string[] } {
  const content = formData.get('content') as string;
  const imagePaths = formData.getAll('imagePaths') as string[];
  
  return { content, imagePaths };
}