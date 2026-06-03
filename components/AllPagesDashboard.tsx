import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Page, Post } from '../types';
import AnalyticsOverview from './AnalyticsOverview';

interface AllPagesDashboardProps {
  pages: Page[];
  onSelectPage: (pageId: string) => void;
  onEditPage: (page: Page) => void;
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

const getPagePostAnalytics = (page: Page) => {
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
};

type SortKey = keyof Page | 'posts_count' | 'newest_post_time' | 'oldest_post_time' | 'totalReactions' | 'totalImpressions' | 'totalClicks' | 'avgEngagementRate';
type SortDirection = 'asc' | 'desc';

const allColumns: { key: string; label: string; sortable: boolean }[] = [
  { key: 'name', label: 'Page Name', sortable: true },
  { key: 'username', label: 'Username', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'followers_count', label: 'Followers', sortable: true },
  { key: 'posts_count', label: 'Total Posts', sortable: true },
  { key: 'totalReactions', label: 'Reactions', sortable: true },
  { key: 'totalImpressions', label: 'Impressions', sortable: true },
  { key: 'totalClicks', label: 'Clicks', sortable: true },
  { key: 'avgEngagementRate', label: 'Engagement', sortable: true },
  { key: 'newest_post_time', label: 'Newest Post', sortable: true },
  { key: 'oldest_post_time', label: 'Oldest Post', sortable: true },
  { key: 'verification_status', label: 'Verified', sortable: true },
  { key: 'website', label: 'Website', sortable: false },
  { key: 'location', label: 'Location', sortable: false },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'emails', label: 'Emails', sortable: false },
  { key: 'id', label: 'Page ID', sortable: true },
];

const columnIcons: { [key: string]: React.ReactNode } = {
  name: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>,
  username: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path><path d="M16 16v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2"></path></svg>,
  category: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-400"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.432 0l6.568-6.568a2.426 2.426 0 0 0 0-3.432l-8.704-8.704Z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
  followers_count: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  posts_count: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>,
  totalReactions: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z"></path></svg>,
  totalImpressions: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  totalClicks: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="m9 9-2 2 4 4 4-4-2-2"></path><path d="M5 15h14"></path><path d="M12 4v7"></path></svg>,
  avgEngagementRate: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>,
  newest_post_time: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="12 16 12 12 8 12"></polyline><path d="m16 2-4 4-4-4"></path></svg>,
  oldest_post_time: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><polyline points="12 16 12 12 8 12"></polyline><path d="m16 22-4-4-4 4"></path></svg>,
  verification_status: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>,
  website: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  location: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  phone: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
  emails: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><rect x="2" y="4" width="20" height="16" rx="2"></rect><polyline points="22,6 12,13 2,6"></polyline></svg>,
  id: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
};


const renderPageCell = (page: Page & { newest_post_time: number, oldest_post_time: number, totalReactions: number, totalImpressions: number, totalClicks: number, avgEngagementRate: number }, columnKey: string) => {
    switch(columnKey) {
        case 'name':
            return (
                <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full" src={page.picture.data.url} alt={page.name} />
                    <div className="ml-4 text-sm font-medium text-slate-200">{page.name}</div>
                </div>
            );
        case 'username':
            return page.username ? `@${page.username}`: 'N/A';
        case 'followers_count':
            return page.followers_count.toLocaleString();
        case 'posts_count':
            return page.published_posts?.summary.total_count.toLocaleString() ?? 'N/A';
        case 'totalReactions':
            return page.totalReactions.toLocaleString();
        case 'totalImpressions':
            return page.totalImpressions.toLocaleString();
        case 'totalClicks':
            return page.totalClicks.toLocaleString();
        case 'avgEngagementRate':
            return `${page.avgEngagementRate.toFixed(2)}%`;
        case 'newest_post_time':
             return page.newest_post_time > 0 ? new Date(page.newest_post_time).toLocaleDateString() : 'N/A';
        case 'oldest_post_time':
             return page.oldest_post_time > 0 ? new Date(page.oldest_post_time).toLocaleDateString() : 'N/A';
        case 'verification_status':
            return <span className={`capitalize ${page.verification_status === 'verified' ? 'text-blue-400' : 'text-slate-500'}`}>{page.verification_status?.replace('_', ' ')}</span>
        case 'website':
            return page.website ? <a href={page.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">{page.website}</a> : 'N/A';
        case 'location':
            const loc = page.location;
            return loc ? `${loc.city || ''}, ${loc.country || ''}`.replace(/^,|,$/g, '').trim() || 'N/A' : 'N/A';
        case 'emails':
            return page.emails?.join(', ') || 'N/A';
        default:
             // Access any other property directly
            const value = (page as any)[columnKey];
            return value || 'N/A';
    }
};

const AllPagesDashboard: React.FC<AllPagesDashboardProps> = ({ pages, onSelectPage, onEditPage }) => {
    const [sortKey, setSortKey] = useState<SortKey>('followers_count');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('fb_visible_columns');
            const defaultColumns = ['name', 'followers_count', 'posts_count', 'totalReactions', 'totalImpressions', 'avgEngagementRate', 'newest_post_time'];
             if (saved) {
                let parsed = JSON.parse(saved);
                // Migration from old key
                if (parsed.includes('last_post_time')) {
                    parsed = parsed.filter((c: string) => c !== 'last_post_time');
                    if (!parsed.includes('newest_post_time')) parsed.push('newest_post_time');
                    if (!parsed.includes('oldest_post_time')) parsed.push('oldest_post_time');
                }
                return parsed;
            }
            return defaultColumns;
        } catch {
            return ['name', 'followers_count', 'posts_count', 'totalReactions', 'totalImpressions', 'avgEngagementRate', 'newest_post_time'];
        }
    });

    useEffect(() => {
        localStorage.setItem('fb_visible_columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsColumnSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const processedPages = useMemo(() => {
        return pages.map(page => {
            const posts = page.published_posts?.data;
            const newest_post_time = posts?.[0]?.created_time ? new Date(posts[0].created_time).getTime() : 0;
            const oldest_post_time = posts && posts.length > 0 ? new Date(posts[posts.length - 1].created_time).getTime() : 0;
            const analytics = getPagePostAnalytics(page);

            return {
                ...page,
                newest_post_time,
                oldest_post_time,
                ...analytics
            };
        });
    }, [pages]);

    const filteredAndSortedPages = useMemo(() => {
        return processedPages
            .filter(page => page.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a: any, b: any) => {
                let valA, valB;
                if (sortKey === 'posts_count') {
                    valA = a.published_posts?.summary?.total_count || 0;
                    valB = b.published_posts?.summary?.total_count || 0;
                } else {
                    valA = a[sortKey] || 0;
                    valB = b[sortKey] || 0;
                }
                
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
    }, [processedPages, sortKey, sortDirection, searchTerm]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const handleColumnToggle = (key: string) => {
        setVisibleColumns(prev => 
            prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
        );
    };
    
    const displayedColumns = allColumns.filter(c => visibleColumns.includes(c.key));

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="relative flex-grow">
                    <input type="text" placeholder="Search pages by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <div className="relative" ref={selectorRef}>
                    <button onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)} className="flex items-center gap-2 h-full px-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                        <span>View Options</span>
                    </button>
                    {isColumnSelectorOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10 p-2 max-h-96 overflow-y-auto">
                            {allColumns.map(col => (
                                <label key={col.key} className="flex items-center gap-3 p-2 text-sm text-slate-200 rounded-md hover:bg-slate-600/50 cursor-pointer">
                                    <input type="checkbox" checked={visibleColumns.includes(col.key)} onChange={() => handleColumnToggle(col.key)} className="h-4 w-4 text-blue-500 bg-slate-600 border-slate-500 rounded focus:ring-blue-500 focus:ring-offset-slate-700" />
                                    {col.label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                        <tr>
                            {displayedColumns.map(col => {
                                const isActive = sortKey === col.key;
                                return (
                                    <th key={col.key} scope="col" onClick={() => col.sortable && handleSort(col.key as SortKey)}
                                        className={`px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-slate-700/50' : ''} transition-colors`}>
                                        <div className="flex items-center gap-2">
                                            {columnIcons[col.key]}
                                            <span>{col.label}</span>
                                            {col.sortable && isActive && <span className="ml-1">{sortDirection === 'desc' ? '▼' : '▲'}</span>}
                                        </div>
                                    </th>
                                );
                            })}
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {filteredAndSortedPages.map((page) => (
                            <tr key={page.id} className="hover:bg-slate-700/50 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-px" onClick={() => onSelectPage(page.id)}>
                                {displayedColumns.map(col => (
                                    <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 max-w-xs truncate">
                                        {renderPageCell(page, col.key)}
                                    </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditPage(page);
                                        }}
                                        className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 hover:text-white transition-colors font-semibold"
                                        aria-label={`Edit ${page.name}`}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AllPagesDashboard;