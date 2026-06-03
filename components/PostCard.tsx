import React, { useState } from 'react';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onViewPost: (post: Post) => void;
  isSelected: boolean;
  onSelectionChange: (postId: string, isSelected: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onEditPost, onDeletePost, onViewPost, isSelected, onSelectionChange }) => {
  const [copied, setCopied] = useState(false);

  const getInsightValue = (name: string): number => {
    const insight = post.insights?.data.find(i => i.name === name);
    if (!insight || !insight.values || insight.values.length === 0) return 0;

    const value = insight.values[0].value;
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      // For reactions, sum up all types
      // FIX: Explicitly set the generic type for `reduce` to `number` to guide type inference.
      // This resolves errors where the accumulator and return type were inferred as `unknown`.
      return Object.values(value).reduce<number>((sum, current) => {
        if (typeof current === 'number') {
          return sum + current;
        }
        return sum;
      }, 0);
    }
    return 0;
  };

  const reactions = getInsightValue('post_reactions_by_type_total');
  const impressions = getInsightValue('post_impressions_unique');
  const clicks = getInsightValue('post_clicks_by_type');

  const formattedDate = new Date(post.created_time).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card click
    navigator.clipboard.writeText(post.permalink_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const firstImage = post.attachments?.data?.find(att => att.type === 'photo' || att.type === 'album' || att.type.startsWith('video'))?.media?.image.src;

  return (
    <div className={`bg-slate-800 rounded-lg border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 relative ${isSelected ? 'border-blue-500 shadow-lg' : 'border-slate-700 hover:border-slate-600'}`}>
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectionChange(post.id, e.target.checked)}
          className="h-5 w-5 bg-slate-900/50 border-slate-500 text-blue-500 rounded focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800"
          aria-label={`Select post ${post.id}`}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {firstImage && (
        <img src={firstImage} alt="Post attachment" className="w-full h-48 object-cover cursor-pointer" onClick={() => onViewPost(post)} />
      )}
      <div className="p-5 flex-grow flex flex-col">
        <p className="text-slate-300 mb-4 text-sm flex-grow cursor-pointer" onClick={() => onViewPost(post)}>
          {post.message ? post.message : <span className="italic text-slate-500">No text content for this post.</span>}
        </p>
        <div className="mt-auto">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
            <span>{formattedDate}</span>
            <button onClick={handleCopyLink} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors" title="Copy post link">
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span className="text-green-500 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center text-sm text-slate-200 border-t border-slate-700 pt-4">
            <div className="flex items-center gap-2" title="Reactions">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z"/></svg>
              <span>{reactions.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2" title="Unique Impressions">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>{impressions.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2" title="Clicks">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="m9 9-2 2 4 4 4-4-2-2"/><path d="M5 15h14"/><path d="M12 4v7"/></svg>
              <span>{clicks.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
             <button onClick={() => onEditPost(post)} className="block text-center w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-2 rounded text-xs transition-colors">Edit</button>
             <button onClick={() => onDeletePost(post.id)} className="block text-center w-full bg-red-800 hover:bg-red-900 text-white font-bold py-2 px-2 rounded text-xs transition-colors">Delete</button>
             <button onClick={() => onViewPost(post)} className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded text-xs transition-colors">
                Details
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
