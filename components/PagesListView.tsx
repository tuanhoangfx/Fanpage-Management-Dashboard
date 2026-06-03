import React, { useState, useMemo, useEffect } from 'react';
import type { Page } from '../types';

interface PagesListViewProps {
  pages: Page[];
  selectedPageIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

type SortKey = 'name' | 'followers_count';
type SortDirection = 'asc' | 'desc';

const PagesListView: React.FC<PagesListViewProps> = ({ pages, selectedPageIds, onSelectionChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('followers_count');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const filteredAndSortedPages = useMemo(() => {
        return [...pages]
            .filter(page => page.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const valA = a[sortKey] || 0;
                const valB = b[sortKey] || 0;

                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
    }, [pages, searchTerm, sortKey, sortDirection]);
    
    const isAllSelected = useMemo(() => 
        filteredAndSortedPages.length > 0 && selectedPageIds.length === filteredAndSortedPages.length,
        [selectedPageIds, filteredAndSortedPages]
    );

    const handleSelectAll = () => {
        if (isAllSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(filteredAndSortedPages.map(p => p.id));
        }
    };
    
    const handleSingleSelect = (pageId: string) => {
        if (selectedPageIds.includes(pageId)) {
            onSelectionChange(selectedPageIds.filter(id => id !== pageId));
        } else {
            onSelectionChange([...selectedPageIds, pageId]);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const SortableHeader: React.FC<{ sortKeyName: SortKey, children: React.ReactNode }> = ({ sortKeyName, children }) => {
        const isActive = sortKey === sortKeyName;
        return (
            <th 
                scope="col" 
                className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => handleSort(sortKeyName)}
            >
                <div className="flex items-center">
                    {children}
                    {isActive && <span className="ml-1">{sortDirection === 'desc' ? '▼' : '▲'}</span>}
                </div>
            </th>
        );
    };

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700">
                <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
            </div>
            <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800 sticky top-0">
                        <tr>
                            <th scope="col" className="p-4">
                                <input type="checkbox" className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500" 
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                />
                            </th>
                            <SortableHeader sortKeyName="name">Page Name</SortableHeader>
                            <SortableHeader sortKeyName="followers_count">Followers</SortableHeader>
                        </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {filteredAndSortedPages.map((page) => (
                            <tr 
                                key={page.id} 
                                className={`transition-colors ${selectedPageIds.includes(page.id) ? 'bg-blue-900/20' : 'hover:bg-slate-700/50'}`}
                            >
                                <td className="p-4">
                                    <input type="checkbox" className="h-4 w-4 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500" 
                                    checked={selectedPageIds.includes(page.id)}
                                    onChange={() => handleSingleSelect(page.id)}
                                    />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img className="h-8 w-8 rounded-full" src={page.picture.data.url} alt="" />
                                        <div className="ml-3 text-sm font-medium text-slate-200">{page.name}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{page.followers_count.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="p-2 border-t border-slate-700 text-xs text-slate-400 text-right">
                {selectedPageIds.length} of {filteredAndSortedPages.length} selected
            </div>
        </div>
    );
};

export default PagesListView;