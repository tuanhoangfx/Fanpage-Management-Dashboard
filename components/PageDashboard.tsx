import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Page, Post } from '../types';
import { updatePostMessage, deletePost } from '../services/facebookService';
import MetricCard from './MetricCard';
import PostCard from './PostCard';
import PostsTableView from './PostsTableView';


interface PageDashboardProps {
  page: Page;
  allPages: Page[];
  onSelectPage: (pageId: string) => void;
  onEditPage: (page: Page) => void;
  onDataRefresh: () => void;
  onViewPost: (post: Post) => void;
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


const PageSelectorDropdown: React.FC<{
  pages: Page[];
  selectedPage: Page;
  onSelectPage: (pageId: string) => void;
}> = ({ pages, selectedPage, onSelectPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPages = pages.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors w-full text-left">
        <img src={selectedPage.picture.data.url} alt={selectedPage.name} className="w-10 h-10 rounded-full flex-shrink-0" />
        <span className="font-semibold text-slate-100 text-lg flex-grow truncate">{selectedPage.name}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 flex flex-col">
          <div className="p-2 border-b border-slate-700">
            <input 
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm text-slate-200"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredPages.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
              <button
                key={p.id}
                onClick={() => { onSelectPage(p.id); setIsOpen(false); setSearchTerm(''); }}
                className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors"
              >
                <img src={p.picture.data.url} alt={p.name} className="w-8 h-8 rounded-full" />
                <span className="text-slate-200 truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


const EditPostModal: React.FC<{
    post: Post;
    page: Page;
    onClose: () => void;
    onSave: () => void;
}> = ({ post, page, onClose, onSave }) => {
    const [message, setMessage] = useState(post.message || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!page.access_token) {
            setError("Page access token is missing.");
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            await updatePostMessage(post.id, page.access_token, message);
            onSave();
            onClose();
        } catch(err) {
            const msg = err instanceof Error ? err.message : 'Failed to update post.';
            setError(`Failed to update post. Reason: ${msg}. This may be due to missing 'pages_manage_posts' permissions.`);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast">
          <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh] animate-fade-in-scale-up">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-100">Edit Post</h2>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-3xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
                {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md text-sm">{error}</div>}
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500"/>
            </div>
             <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 w-28">{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
    );
};

const ConfirmDeleteModal: React.FC<{
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    isDeleting: boolean;
}> = ({ title, message, onConfirm, onClose, isDeleting }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast">
        <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700 animate-fade-in-scale-up">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
              </div>
              <button onClick={onClose} disabled={isDeleting} className="text-slate-500 hover:text-slate-300 text-3xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-slate-300">{message}</p>
            </div>
            <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
                <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 text-sm font-semibold disabled:opacity-50">Cancel</button>
                <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 w-32 text-sm font-semibold flex items-center justify-center disabled:bg-red-800 disabled:cursor-wait">
                  {isDeleting && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
            </div>
        </div>
    </div>
);


const MetricsGrid: React.FC<{ page: Page; analytics: { totalReactions: number, totalImpressions: number, totalClicks: number, avgEngagementRate: number } }> = ({ page, analytics }) => {
    const oldestPost = useMemo(() => {
        if (!page.published_posts?.data || page.published_posts.data.length === 0) return null;
        
        return page.published_posts.data.reduce((oldest, current) => {
            return new Date(current.created_time) < new Date(oldest.created_time) ? current : oldest;
        });

    }, [page.published_posts?.data]);

    const newestPost = useMemo(() => {
        if (!page.published_posts?.data || page.published_posts.data.length === 0) return null;
        // API returns posts sorted by date descending.
        return page.published_posts.data[0];
    }, [page.published_posts?.data]);

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Followers" 
          value={page.followers_count.toLocaleString()}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <MetricCard 
          label="Total Posts" 
          value={page.published_posts?.summary.total_count.toLocaleString() ?? '0'}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>}
        />
        <MetricCard 
            label="Total Reactions"
            value={analytics.totalReactions.toLocaleString()}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z"/></svg>}
        />
        <MetricCard 
            label="Total Impressions"
            value={analytics.totalImpressions.toLocaleString()}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
        />
        <MetricCard 
            label="Total Clicks"
            value={analytics.totalClicks.toLocaleString()}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="m9 9-2 2 4 4 4-4-2-2"/><path d="M5 15h14"/><path d="M12 4v7"/></svg>}
        />
        <MetricCard 
            label="Avg. Engagement"
            value={`${analytics.avgEngagementRate.toFixed(2)}%`}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>}
        />
        <MetricCard 
          label="Newest Post" 
          value={newestPost ? new Date(newestPost.created_time).toLocaleDateString() : 'N/A'}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="12 22 12 14"></polyline><polyline points="16 18 12 14 8 18"></polyline></svg>}
        />
        <MetricCard 
          label="Oldest Post" 
          value={oldestPost ? new Date(oldestPost.created_time).toLocaleDateString() : 'N/A'}
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="12 14 12 22"></polyline><polyline points="8 18 12 22 16 18"></polyline></svg>}
        />
      </div>
    );
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    const icon = type === 'success' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    );

    return (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white ${bgColor} animate-fade-in-fast`}>
            {icon}
            <div className="ml-3 text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-4 -mr-2 p-1.5 text-white rounded-lg hover:bg-white/20 inline-flex items-center justify-center h-8 w-8" aria-label="Close">&times;</button>
        </div>
    );
};

const PageDashboard: React.FC<PageDashboardProps> = ({ page, allPages, onSelectPage, onEditPage, onDataRefresh, onViewPost }) => {
    const [postViewMode, setPostViewMode] = useState<'card' | 'table'>('table');
    const [postSearch, setPostSearch] = useState('');
    const [postTypeFilter, setPostTypeFilter] = useState('all');
    const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
    
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

    useEffect(() => {
        // Reset selection when filters or page changes
        setSelectedPostIds([]);
    }, [page.id, postSearch, postTypeFilter]);

     useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const analytics = useMemo(() => {
        if (!page.published_posts?.data || page.published_posts.data.length === 0) {
            return { totalReactions: 0, totalImpressions: 0, totalClicks: 0, avgEngagementRate: 0 };
        }
        const posts = page.published_posts.data;
        let totalReactions = 0;
        let totalImpressions = 0;
        let totalClicks = 0;

        posts.forEach(post => {
            totalReactions += getInsightValue(post, 'post_reactions_by_type_total');
            totalImpressions += getInsightValue(post, 'post_impressions_unique');
            totalClicks += getInsightValue(post, 'post_clicks_by_type');
        });

        const avgEngagementRate = totalImpressions > 0 ? ((totalReactions + totalClicks) / totalImpressions) * 100 : 0;
        return { totalReactions, totalImpressions, totalClicks, avgEngagementRate };
    }, [page.published_posts?.data]);

    const filteredPosts = useMemo(() => {
        let posts = page.published_posts?.data || [];
        
        if (postSearch) {
            posts = posts.filter(p => p.message?.toLowerCase().includes(postSearch.toLowerCase()));
        }

        if (postTypeFilter !== 'all') {
            posts = posts.filter(p => {
                const attachmentType = p.attachments?.data[0]?.type;
                if (postTypeFilter === 'text') return !attachmentType;
                if (postTypeFilter === 'photo') return attachmentType === 'photo' || attachmentType === 'album';
                if (postTypeFilter === 'video') return attachmentType === 'video' || attachmentType === 'video_inline' || attachmentType === 'video_autoplay';
                return true;
            });
        }
        
        return posts;

    }, [page.published_posts?.data, postSearch, postTypeFilter]);
    
    const handleConfirmDelete = async () => {
        if (!deletingPostId || !page.access_token) return;

        setIsDeleting(true);
        try {
            await deletePost(deletingPostId, page.access_token);
            showToast('Post deleted successfully.', 'success');
            onDataRefresh();
        } catch (error) {
            console.error("Failed to delete post:", error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            showToast(`Failed to delete post. Reason: ${message}. You may need admin permissions.`, 'error');
        } finally {
            setIsDeleting(false);
            setDeletingPostId(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPostIds.length === 0 || !page.access_token) return;

        setIsDeleting(true);
        let successCount = 0;
        let errorCount = 0;
        
        for (const postId of selectedPostIds) {
            try {
                await deletePost(postId, page.access_token);
                successCount++;
            } catch (error) {
                console.error(`Failed to delete post ${postId}:`, error);
                errorCount++;
            }
        }
        
        if (errorCount > 0) {
            showToast(`Failed to delete ${errorCount} post(s). ${successCount} deleted successfully.`, 'error');
        } else {
            showToast(`${successCount} post(s) deleted successfully.`, 'success');
        }

        setIsDeleting(false);
        setShowBulkDeleteConfirm(false);
        onDataRefresh();
    };

    const handleSelectionChange = (postId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedPostIds(prev => [...prev, postId]);
        } else {
            setSelectedPostIds(prev => prev.filter(id => id !== postId));
        }
    };

    return (
      <div className="space-y-8">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-grow min-w-0">
                 <PageSelectorDropdown pages={allPages} selectedPage={page} onSelectPage={onSelectPage} />
                 <p className="text-slate-400 mt-2 max-w-xl truncate" title={page.about}>{page.about}</p>
            </div>
            <button onClick={() => onEditPage(page)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors text-sm font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Edit Page
            </button>
        </div>
        
        <MetricsGrid page={page} analytics={analytics} />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-2xl font-semibold text-slate-100">Recent Posts</h3>
            <div className="flex items-center gap-2 w-full md:w-auto">
                 <input type="text" placeholder="Search posts..." value={postSearch} onChange={(e) => setPostSearch(e.target.value)} className="w-full md:w-auto bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"/>
                <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1 border border-slate-700">
                    <button onClick={() => setPostViewMode('card')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${postViewMode === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="Card View" title="Card View"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
                    <button onClick={() => setPostViewMode('table')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${postViewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} aria-label="Table View" title="Table View"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></button>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 font-medium">Filter:</span>
            <button onClick={() => setPostTypeFilter('all')} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${postTypeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>All</button>
            <button onClick={() => setPostTypeFilter('text')} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${postTypeFilter === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Text</button>
            <button onClick={() => setPostTypeFilter('photo')} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${postTypeFilter === 'photo' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Photo</button>
            <button onClick={() => setPostTypeFilter('video')} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${postTypeFilter === 'video' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Video</button>
        </div>
        
        {selectedPostIds.length > 0 && (
            <div className="bg-slate-700/50 border border-slate-600 p-3 rounded-lg flex justify-between items-center sticky top-4 z-10 backdrop-blur-sm animate-fade-in-fast">
                <span className="font-semibold text-slate-200">{selectedPostIds.length} post(s) selected</span>
                <div className="flex gap-2">
                    <button onClick={() => setShowBulkDeleteConfirm(true)} className="px-3 py-1.5 bg-red-800 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors">Delete Selected</button>
                </div>
            </div>
        )}

        {filteredPosts.length > 0 ? (
            <div>
            {postViewMode === 'card' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPosts.map((post) => (
                        <PostCard key={post.id} post={post} onEditPost={setEditingPost} onDeletePost={setDeletingPostId} onViewPost={onViewPost} isSelected={selectedPostIds.includes(post.id)} onSelectionChange={handleSelectionChange}/>
                    ))}
                </div>
            ) : (
                <PostsTableView posts={filteredPosts} onEditPost={setEditingPost} onDeletePost={setDeletingPostId} onViewPost={onViewPost} selectedPostIds={selectedPostIds} onSelectionChange={setSelectedPostIds} />
            )}
            </div>
        ) : (
            <div className="text-center py-20 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <h3 className="mt-2 text-lg font-semibold text-slate-300">No Posts Found</h3>
                <p className="mt-1 text-sm text-slate-400">No posts were found that match your current search and filter criteria.</p>
            </div>
        )}

        {editingPost && (
            <EditPostModal post={editingPost} page={page} onClose={() => setEditingPost(null)} onSave={onDataRefresh}/>
        )}
        {deletingPostId && (
            <ConfirmDeleteModal title="Confirm Deletion" message="Are you sure you want to permanently delete this post? This action cannot be undone." onClose={() => setDeletingPostId(null)} onConfirm={handleConfirmDelete} isDeleting={isDeleting} />
        )}
        {showBulkDeleteConfirm && (
             <ConfirmDeleteModal title={`Delete ${selectedPostIds.length} Posts`} message={`Are you sure you want to permanently delete these ${selectedPostIds.length} posts? This action cannot be undone.`} onClose={() => setShowBulkDeleteConfirm(false)} onConfirm={handleBulkDelete} isDeleting={isDeleting} />
        )}
      </div>
    );
}

export default PageDashboard;
