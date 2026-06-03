import React, { useMemo } from 'react';
import type { Page, Post } from '../types';
import MetricCard from './MetricCard';

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

const AnalyticsOverview: React.FC<{ pages: Page[] }> = ({ pages }) => {
    const totals = useMemo(() => {
        let totalFollowers = 0;
        let totalPosts = 0;
        let totalReactions = 0;
        let totalImpressions = 0;
        let totalClicks = 0;

        pages.forEach(page => {
            totalFollowers += page.followers_count || 0;
            totalPosts += page.published_posts?.summary.total_count || 0;
            page.published_posts?.data?.forEach(post => {
                totalReactions += getInsightValue(post, 'post_reactions_by_type_total');
                totalImpressions += getInsightValue(post, 'post_impressions_unique');
                totalClicks += getInsightValue(post, 'post_clicks_by_type');
            });
        });

        const avgEngagementRate = totalImpressions > 0 ? ((totalReactions + totalClicks) / totalImpressions) * 100 : 0;
        
        return { totalFollowers, totalPosts, totalReactions, totalImpressions, totalClicks, avgEngagementRate };
    }, [pages]);

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-100 mb-4">Aggregate Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                 <MetricCard 
                  label="Total Followers" 
                  value={totals.totalFollowers.toLocaleString()}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                />
                <MetricCard 
                  label="Total Posts" 
                  value={totals.totalPosts.toLocaleString()}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>}
                />
                <MetricCard 
                    label="Total Reactions"
                    value={totals.totalReactions.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z"/></svg>}
                />
                <MetricCard 
                    label="Total Impressions"
                    value={totals.totalImpressions.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
                />
                <MetricCard 
                    label="Total Clicks"
                    value={totals.totalClicks.toLocaleString()}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="m9 9-2 2 4 4 4-4-2-2"/><path d="M5 15h14"/><path d="M12 4v7"/></svg>}
                />
                <MetricCard 
                    label="Avg. Engagement"
                    value={`${totals.avgEngagementRate.toFixed(2)}%`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>}
                />
            </div>
        </div>
    );
};

export default AnalyticsOverview;
