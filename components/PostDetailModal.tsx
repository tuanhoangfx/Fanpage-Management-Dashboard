import React, { useState } from 'react';
import type { Page, Post } from '../types';

interface PostDetailModalProps {
  post: Post;
  page: Page;
  onClose: () => void;
}

const getInsightValue = (post: Post, name: string): number => {
    const insight = post.insights?.data.find(i => i.name === name);
    if (!insight || !insight.values || insight.values.length === 0) return 0;

    const value = insight.values[0].value;
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).reduce<number>((sum, current) => {
        if (typeof current === 'number') return sum + current;
        return sum;
      }, 0);
    }
    return 0;
};


const ReactionBreakdown: React.FC<{ post: Post }> = ({ post }) => {
    const reactionInsight = post.insights?.data.find(i => i.name === 'post_reactions_by_type_total');
    if (!reactionInsight || !reactionInsight.values[0]) return null;

    const reactions = reactionInsight.values[0].value;
    if (typeof reactions !== 'object' || reactions === null) return null;

    // FIX: Add a `typeof` check to narrow `value` from `unknown` to `number` before comparison.
    const reactionTypes = Object.entries(reactions).filter(([, value]) => typeof value === 'number' && value > 0);
    if (reactionTypes.length === 0) return null;

    const reactionIcons: { [key: string]: string } = {
        like: '👍', love: '❤️', wow: '😮',
        haha: '😂', sad: '😢', angry: '😠',
        care: '🥰'
    };

    return (
        <div className="flex flex-wrap gap-3 items-center mt-2 bg-slate-900/50 p-3 rounded-lg">
            <span className="text-sm font-semibold text-slate-300">Reactions:</span>
            {reactionTypes.map(([type, count]) => (
                <div key={type} className="flex items-center gap-1 bg-slate-700 px-2 py-1 rounded-full text-xs" title={`${(count as number).toLocaleString()} ${type}`}>
                    <span className="text-base">{reactionIcons[type] || '❓'}</span>
                    <span className="font-medium text-slate-200">{(count as number).toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};


const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, page, onClose }) => {
    const [copied, setCopied] = useState(false);

    const images = post.attachments?.data
      ?.flatMap(att => att.type === 'album' ? att.subattachments?.data || [] : [att])
      ?.map(att => att?.media?.image.src)
      .filter((src): src is string => !!src) || [];

    const video = post.attachments?.data?.find(att => att.type.startsWith('video'))?.media?.source;
    const impressions = getInsightValue(post, 'post_impressions_unique');
    const clicks = getInsightValue(post, 'post_clicks_by_type');
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(post.permalink_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-slate-700 flex flex-col max-h-[90vh] animate-fade-in-scale-up" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
                <img src={page.picture.data.url} alt={page.name} className="w-10 h-10 rounded-full" />
                <div>
                    <h2 className="text-lg font-semibold text-slate-100">{page.name}</h2>
                    <p className="text-xs text-slate-400">
                        {new Date(post.created_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                </div>
            </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
            <p className="text-slate-300 whitespace-pre-wrap">{post.message || <span className="italic text-slate-500">No text content for this post.</span>}</p>
            
            {video && (
                <video controls className="w-full rounded-md bg-black max-h-96">
                    <source src={video} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}

            {images.length > 0 && !video && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {images.map((src, index) => (
                        <a key={index} href={src} target="_blank" rel="noopener noreferrer">
                            <img src={src} alt={`Attachment ${index + 1}`} className="w-full h-48 object-cover rounded-md bg-slate-700 hover:opacity-80 transition-opacity" />
                        </a>
                    ))}
                </div>
            )}

            <ReactionBreakdown post={post} />

            <div className="flex flex-wrap gap-4 items-center bg-slate-900/50 p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-green-400" title="Unique Impressions">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span className="font-semibold">{impressions.toLocaleString()}</span>
                    <span className="text-slate-400">Impressions</span>
                </div>
                 <div className="flex items-center gap-2 text-blue-400" title="Clicks">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 9-2 2 4 4 4-4-2-2"/><path d="M5 15h14"/><path d="M12 4v7"/></svg>
                    <span className="font-semibold">{clicks.toLocaleString()}</span>
                    <span className="text-slate-400">Clicks</span>
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3 flex-shrink-0">
            <a href={post.permalink_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-all duration-200 text-sm font-semibold active:scale-95">
                View on Facebook
            </a>
            <button onClick={handleCopyLink} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-all duration-200 text-sm font-semibold active:scale-95 w-28">
                {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-all duration-200 text-sm font-semibold active:scale-95">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
