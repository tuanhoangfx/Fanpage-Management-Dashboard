import React, { useState } from 'react';
import type { Page } from '../types';
import { postSingleImage, postSingleVideo, postMultipleImages, postTextOnly, fetchImageAsFile } from '../services/facebookService';
import PagesListView from './PagesListView';

interface UploaderProps {
  pages: Page[];
}

interface UploadResult {
  pageName: string;
  status: 'success' | 'error';
  message: string;
  link?: string;
}

const Uploader: React.FC<UploaderProps> = ({ pages }) => {
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string|null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };
  
  const handleAddFromUrl = async () => {
    if (!imageUrl) return;
    setIsFetchingUrl(true);
    setUrlError(null);
    try {
        const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1) || 'pasted-image.jpg';
        const file = await fetchImageAsFile(imageUrl, fileName);
        setFiles(prev => [...prev, file]);
        setImageUrl('');
    } catch (error) {
        setUrlError(error instanceof Error ? error.message : 'Failed to fetch image.');
    } finally {
        setIsFetchingUrl(false);
    }
  };


  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    if (selectedPageIds.length === 0 || (!message.trim() && files.length === 0)) {
        alert("Please select at least one page and provide content (message or files).");
        return;
    }
    
    let scheduledTimestamp: number | undefined = undefined;
    if (isScheduled && scheduleTime) {
        const date = new Date(scheduleTime);
        if (date.getTime() <= Date.now()) {
            alert("Scheduled time must be in the future.");
            return;
        }
        scheduledTimestamp = Math.floor(date.getTime() / 1000);
    }

    setIsUploading(true);
    setResults([]);

    const uploadPromises = selectedPageIds.map(async (pageId) => {
        const page = pages.find(p => p.id === pageId);
        if (!page || !page.access_token) {
            return { pageName: page?.name || pageId, status: 'error' as const, message: 'Page access token not found.' };
        }

        try {
            let response: { id?: string; post_id?: string; };

            if (files.length === 0) {
                response = await postTextOnly(pageId, page.access_token, message, scheduledTimestamp);
            } else if (files.length === 1) {
                const file = files[0];
                if (file.type.startsWith('video/')) {
                    response = await postSingleVideo(pageId, page.access_token, message, file, scheduledTimestamp);
                } else {
                    response = await postSingleImage(pageId, page.access_token, message, file, scheduledTimestamp);
                }
            } else {
                const imageFiles = files.filter(f => f.type.startsWith('image/'));
                 if (imageFiles.length !== files.length) {
                    throw new Error("Multi-file posts can only contain images. Please upload multiple images, or upload a single video separately.");
                }
                response = await postMultipleImages(pageId, page.access_token, message, imageFiles, scheduledTimestamp);
            }
            
            const postId = response.id || response.post_id;
            const permalink = `https://facebook.com/${postId || `${pageId}_${response.id}`}`;
            
            return { pageName: page.name, status: 'success' as const, message: isScheduled ? 'Scheduled successfully!' : 'Posted successfully!', link: permalink };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            return { pageName: page.name, status: 'error' as const, message: errorMessage };
        }
    });
    
    const settledResults = await Promise.all(uploadPromises);
    setResults(settledResults);
    setIsUploading(false);
    
    setMessage('');
    setFiles([]);
    setIsScheduled(false);
    setScheduleTime('');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-100">Create a New Post</h2>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">1. Select Pages to Post to</h3>
        <PagesListView pages={pages} selectedPageIds={selectedPageIds} onSelectionChange={setSelectedPageIds} />
      </div>
      
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">2. Compose Your Post</h3>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's on your mind?"
            className="w-full h-32 bg-slate-900 border border-slate-600 rounded-md p-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
        <div className="flex items-center gap-4">
            <input type="checkbox" id="schedule" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500" />
            <label htmlFor="schedule" className="text-sm font-medium text-slate-300">Schedule Post</label>
        </div>
        {isScheduled && (
            <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} 
            className="w-full md:w-1/2 bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm" />
        )}
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">3. Add Attachments (Optional)</h3>
          <div className="border-b border-slate-600">
             <nav className="flex -mb-px space-x-6">
                <button onClick={() => setUploadMode('file')} className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${uploadMode === 'file' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400'}`}>From Computer</button>
                <button onClick={() => setUploadMode('url')} className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${uploadMode === 'url' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-400'}`}>From URL</button>
            </nav>
          </div>
          {uploadMode === 'file' && (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <div className="flex text-sm text-slate-400"><label htmlFor="file-upload" className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-blue-500 px-2"><span>Upload files</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*,video/*"/></label><p className="pl-1">or drag and drop</p></div><p className="text-xs text-slate-500">PNG, JPG, GIF, MP4 up to 1GB</p>
                </div>
            </div>
          )}
          {uploadMode === 'url' && (
            <div className="space-y-2">
                <div className="flex gap-2">
                    <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://.../image.png" className="flex-grow bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    <button onClick={handleAddFromUrl} disabled={!imageUrl || isFetchingUrl} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-sm font-semibold">{isFetchingUrl ? 'Adding...' : 'Add Image'}</button>
                </div>
                {urlError && <p className="text-xs text-red-400">{urlError}</p>}
            </div>
          )}
          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {files.map((file, index) => (<div key={index} className="relative group"><img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded-md"/><button onClick={() => handleRemoveFile(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0 h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button></div>))}
            </div>
          )}
      </div>

      <div className="flex justify-end"><button onClick={handleSubmit} disabled={isUploading || selectedPageIds.length === 0} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95">{isUploading && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>}{isUploading ? 'Posting...' : 'Post to Selected Pages'}</button></div>

      {results.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg"><h3 className="text-lg font-semibold text-slate-200 p-4 border-b border-slate-700">Upload Results</h3><table className="min-w-full divide-y divide-slate-700"><thead><tr><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Page</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th></tr></thead><tbody className="divide-y divide-slate-700">{results.map((result, index) => (<tr key={index}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{result.pageName}</td><td className="px-6 py-4 whitespace-nowrap text-sm">{result.status === 'success' ? (<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">Success</span>) : (<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-200">Error</span>)}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{result.status === 'success' ? <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Post</a> : <span title={result.message} className="truncate block max-w-xs">{result.message}</span>}</td></tr>))}</tbody></table></div>
      )}
    </div>
  );
};

export default Uploader;
