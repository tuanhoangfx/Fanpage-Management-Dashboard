import React, { useState } from 'react';
import type { Page } from '../types';
import { postWithLink, postReaction, postComment, ReactionType } from '../services/facebookService';
import PagesListView from './PagesListView';

interface EngagementBoosterProps {
  pages: Page[];
}

interface BoostResult {
  pageName: string;
  status: 'success' | 'error';
  message: string;
  link?: string;
}

type Action = 'share' | 'react' | 'comment';

const REACTION_TYPES: { type: ReactionType, icon: string }[] = [
    { type: 'LIKE', icon: '👍' },
    { type: 'LOVE', icon: '❤️' },
    { type: 'CARE', icon: '🥰' },
    { type: 'HAHA', icon: '😂' },
    { type: 'WOW', icon: '😮' },
    { type: 'SAD', icon: '😢' },
    { type: 'ANGRY', icon: '😠' },
];

const EngagementBooster: React.FC<EngagementBoosterProps> = ({ pages }) => {
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [sourcePostId, setSourcePostId] = useState('');
  const [message, setMessage] = useState(''); // Used for Share and Comment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<BoostResult[]>([]);
  
  const [action, setAction] = useState<Action>('share');
  const [reactionType, setReactionType] = useState<ReactionType>('LIKE');
  
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  const handleSubmit = async () => {
    if (selectedPageIds.length === 0 || !sourcePostId.trim()) {
        alert("Please select at least one page and provide a source Post ID.");
        return;
    }
    
    let scheduledTimestamp: number | undefined = undefined;
    if (isScheduled && scheduleTime) {
        if (action === 'react' || action === 'comment') {
            alert('Scheduling is only available for sharing posts.');
            return;
        }
        const date = new Date(scheduleTime);
        if (date.getTime() <= Date.now()) {
            alert("Scheduled time must be in the future.");
            return;
        }
        scheduledTimestamp = Math.floor(date.getTime() / 1000);
    }

    setIsSubmitting(true);
    setResults([]);

    const boostPromises = selectedPageIds.map(async (pageId) => {
        const page = pages.find(p => p.id === pageId);
        if (!page || !page.access_token) {
            return { pageName: page?.name || pageId, status: 'error' as const, message: 'Page access token not found.' };
        }

        try {
            // FIX: Initialize `response` and handle the 'react' case which has a different return type.
            let response: { id?: string } = {};
            let successMessage = '';
            
            switch(action) {
                case 'share':
                    response = await postWithLink(pageId, page.access_token, message, `https://facebook.com/${sourcePostId}`, scheduledTimestamp);
                    successMessage = isScheduled ? 'Share scheduled successfully!' : 'Shared successfully!';
                    break;
                case 'react':
                    await postReaction(sourcePostId, page.access_token, reactionType);
                    successMessage = `Reacted with ${reactionType} successfully!`;
                    break;
                case 'comment':
                     if (!message.trim()) throw new Error("Comment message cannot be empty.");
                    response = await postComment(sourcePostId, page.access_token, message);
                    successMessage = 'Commented successfully!';
                    break;
                default:
                    throw new Error('Invalid action.');
            }
            
            const postId = response.id;
            const permalink = `https://facebook.com/${postId || sourcePostId}`;
            
            return { pageName: page.name, status: 'success' as const, message: successMessage, link: permalink };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            return { pageName: page.name, status: 'error' as const, message: errorMessage };
        }
    });
    
    const settledResults = await Promise.all(boostPromises);
    setResults(settledResults);
    setIsSubmitting(false);
  };

  const ActionButton: React.FC<{ type: Action, children: React.ReactNode }> = ({ type, children }) => (
    <button 
        onClick={() => setAction(type)} 
        className={`py-2 px-4 font-medium text-sm transition-colors rounded-t-md ${action === type ? 'bg-slate-800 text-blue-400' : 'bg-slate-900/50 text-slate-400 hover:text-slate-200'}`}
    >
        {children}
    </button>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-100">Engagement Booster</h2>
      <p className="text-slate-400 -mt-6">Share, react, or comment on an existing post from multiple pages to increase its reach and engagement.</p>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">1. Select Pages to Act From</h3>
        <PagesListView pages={pages} selectedPageIds={selectedPageIds} onSelectionChange={setSelectedPageIds} />
      </div>
      
      <div>
        <div className="flex -mb-px">
            <ActionButton type="share">Share</ActionButton>
            <ActionButton type="react">React</ActionButton>
            <ActionButton type="comment">Comment</ActionButton>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-b-lg rounded-r-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">2. Configure Action</h3>
            <div>
                <label htmlFor="sourceId" className="block text-sm font-medium text-slate-300 mb-2">Source Post ID</label>
                <input type="text" id="sourceId" value={sourcePostId} onChange={(e) => setSourcePostId(e.target.value)} placeholder="e.g., 123456789_987654321"
                    className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm" />
            </div>

            {action === 'react' && (
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Reaction Type</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-900/50 rounded-lg">
                        {REACTION_TYPES.map(r => (
                            <button key={r.type} onClick={() => setReactionType(r.type)} className={`px-3 py-2 text-2xl rounded-md transition-all duration-200 ${reactionType === r.type ? 'bg-blue-600 scale-110' : 'bg-slate-700 hover:bg-slate-600'}`} title={r.type}>
                                {r.icon}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(action === 'share' || action === 'comment') && (
                <div>
                    <label htmlFor="shareMessage" className="block text-sm font-medium text-slate-300 mb-2">
                        {action === 'share' ? 'Custom Message (Optional)' : 'Comment'}
                    </label>
                    <textarea id="shareMessage" value={message} onChange={(e) => setMessage(e.target.value)} 
                        placeholder={action === 'share' ? 'Add an optional message to your shared post...' : 'Write a comment...'}
                        className="w-full h-24 bg-slate-900 border border-slate-600 rounded-md p-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                </div>
            )}
            
            {action === 'share' && (
                 <div className="pt-2">
                    <div className="flex items-center gap-4">
                        <input type="checkbox" id="schedule" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500" />
                        <label htmlFor="schedule" className="text-sm font-medium text-slate-300">Schedule Share</label>
                    </div>
                    {isScheduled && (
                        <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} 
                        className="mt-2 w-full md:w-1/2 bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm" />
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || selectedPageIds.length === 0 || !sourcePostId.trim()} 
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95 capitalize">
            {isSubmitting && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>}
            {isSubmitting ? `${action}...` : `${action} on ${selectedPageIds.length} Page(s)`}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-200 p-4 border-b border-slate-700">Action Results</h3>
          <table className="min-w-full divide-y divide-slate-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Page</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {results.map((result, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{result.pageName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {result.status === 'success' ? 
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">Success</span> : 
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-200">Error</span>
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {result.status === 'success' && result.link ? 
                        <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View Post/Comment</a> : 
                        <span title={result.message} className="truncate block max-w-xs">{result.message}</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EngagementBooster;