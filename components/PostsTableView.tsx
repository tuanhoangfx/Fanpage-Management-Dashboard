import React, { useState, useMemo } from 'react';
import type { Post } from '../types';

interface PostsTableViewProps {
  posts: Post[];
  onEditPost: (post: Post) => void;
  onDeletePost: (postId: string) => void;
  onViewPost: (post: Post) => void;
  selectedPostIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

type SortKey = 'created_time' | 'reactions' | 'impressions' | 'clicks';
type SortDirection = 'asc' | 'desc';

const getInsightValue = (post: Post, name: string): number => {
    const insight = post.insights?.data.find(i => i.name === name);
    if (!insight || !insight.values || insight.values.length === 0) return 0;
    const value = insight.values[0].value;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).reduce<number>((sum, current) => {
        if (typeof current === 'number') return sum + current;
        return sum;
      }, 0);
    }
    return 0;
};

const PostsTableView: React.FC<PostsTableViewProps> = ({ posts, onEditPost, onDeletePost, onViewPost, selectedPostIds, onSelectionChange }) => {
    const [sortKey, setSortKey] = useState<SortKey>('created_time');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

    const processedPosts = useMemo(() => {
        return posts.map(post => ({
            ...post,
            reactions: getInsightValue(post, 'post_reactions_by_type_total'),
            impressions: getInsightValue(post, 'post_impressions_unique'),
            clicks: getInsightValue(post, 'post_clicks_by_type'),
        }));
    }, [posts]);
    
    const sortedPosts = useMemo(() => {
        return [...processedPosts].sort((a, b) => {
            const valA = sortKey === 'created_time' ? new Date(a.created_time).getTime() : a[sortKey];
            const valB = sortKey === 'created_time' ? new Date(b.created_time).getTime() : b[sortKey];

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [processedPosts, sortKey, sortDirection]);
    
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange(sortedPosts.map(p => p.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectOne = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        if (e.target.checked) {
            onSelectionChange([...selectedPostIds, id]);
        } else {
            onSelectionChange(selectedPostIds.filter(postId => postId !== id));
        }
    };

    const handleCopyLink = (e: React.MouseEvent, post: Post) => {
        e.stopPropagation();
        navigator.clipboard.writeText(post.permalink_url);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 2000);
    };

    const isAllSelected = useMemo(() => 
        sortedPosts.length > 0 && selectedPostIds.length === sortedPosts.length,
        [selectedPostIds, sortedPosts]
    );

    const SortableHeader: React.FC<{ sortKeyName: SortKey, children: React.ReactNode, className?: string }> = ({ sortKeyName, children, className }) => {
        const isActive = sortKey === sortKeyName;
        return (
            <th 
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors ${className}`}
                onClick={() => handleSort(sortKeyName)}
            >
                <div className="flex items-center">
                    {children}
                    {isActive && <span className="ml-2">{sortDirection === 'desc' ? '▼' : '▲'}</span>}
                </div>
            </th>
        );
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
                    <tr>
                        <th scope="col" className="p-4">
                            <input 
                                type="checkbox" 
                                className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                aria-label="Select all posts"
                            />
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Post</th>
                        <SortableHeader sortKeyName="created_time">Date</SortableHeader>
                        <SortableHeader sortKeyName="reactions">Reactions</SortableHeader>
                        <SortableHeader sortKeyName="impressions">Impressions</SortableHeader>
                        <SortableHeader sortKeyName="clicks">Clicks</SortableHeader>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                    {sortedPosts.map((post) => {
                        const firstImage = post.attachments?.data?.find(att => att.type === 'photo' || att.type === 'album' || att.type.startsWith('video'))?.media?.image.src;
                        return (
                            <tr key={post.id} className={`transition-colors ${selectedPostIds.includes(post.id) ? 'bg-blue-900/20' : 'hover:bg-slate-700/50'}`}>
                                <td className="p-4">
                                     <input 
                                        type="checkbox" 
                                        className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500"
                                        checked={selectedPostIds.includes(post.id)}
                                        onChange={(e) => handleSelectOne(e, post.id)}
                                        aria-label={`Select post ${post.id}`}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewPost(post)}>
                                    <div className="flex items-center gap-4">
                                        {firstImage && <img src={firstImage} alt="" className="w-12 h-12 object-cover rounded-md flex-shrink-0" />}
                                        <p className="text-sm text-slate-300 max-w-sm truncate">{post.message || <span className="italic text-slate-500">No text content</span>}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(post.created_time).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{post.reactions.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{post.impressions.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{post.clicks.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                     <button onClick={() => onViewPost(post)} className="text-blue-400 hover:text-blue-300 font-semibold">Details</button>
                                     <button onClick={() => onEditPost(post)} className="text-yellow-400 hover:text-yellow-300 font-semibold">Edit</button>
                                     <button onClick={(e) => handleCopyLink(e, post)} className="text-purple-400 hover:text-purple-300 font-semibold" disabled={copiedPostId === post.id}>
                                        {copiedPostId === post.id ? 'Copied!' : 'Copy Link'}
                                     </button>
                                     <button onClick={() => onDeletePost(post.id)} className="text-red-500 hover:text-red-400 font-semibold">Delete</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PostsTableView;
