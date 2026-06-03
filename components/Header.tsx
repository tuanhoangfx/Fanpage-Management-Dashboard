import React, { useState, useEffect } from 'react';

interface User {
  name: string;
  id: string;
  picture: {
    data: {
      url: string;
    }
  }
}

interface HeaderProps {
    validUsers: User[];
    pagesCount: number;
    ipAddress: string | null;
    onRefresh: () => void;
    lastRefreshed: Date | null;
}

const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'never';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


const Header: React.FC<HeaderProps> = ({ validUsers, pagesCount, ipAddress, onRefresh, lastRefreshed }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => setIsRefreshing(false), 500);
    }

    const formattedTime = currentTime.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(',', '');
    
    const firstUser = validUsers.length > 0 ? validUsers[0] : null;

    return (
        <header className="flex-shrink-0 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
                {firstUser ? (
                     <div className="flex items-center gap-3">
                        <div className="flex -space-x-4">
                            {validUsers.slice(0, 3).map(user => (
                                <img key={user.id} src={user.picture.data.url} alt={user.name} title={user.name} className="w-9 h-9 rounded-full border-2 border-slate-600"/>
                            ))}
                        </div>
                        <div>
                           <p className="text-sm font-semibold text-slate-100 leading-tight">
                                {validUsers.length > 1 ? `${validUsers.length} Users Connected` : firstUser.name}
                           </p>
                            <p className="text-xs text-slate-400 leading-tight">Monitoring a total of {pagesCount} pages.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-700 animate-pulse"></div>
                        <div>
                            <div className="h-4 w-28 bg-slate-700 rounded animate-pulse mb-1"></div>
                            <div className="h-3 w-36 bg-slate-700 rounded animate-pulse"></div>
                        </div>
                    </div>
                )}
                 <div className="hidden sm:flex items-center gap-4 border-l border-slate-700 pl-4 h-10">
                    <div title="Tracked Pages" className="flex items-center gap-2 text-sm text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 12H16c-.7 2-2 3-4 3s-3.3-1-4-3H2.5"/><path d="M5.5 5.1 2 12v6c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1Z"/></svg>
                        <span className="font-medium">Tracked Pages: <span className="font-semibold text-slate-100">{pagesCount}</span></span>
                    </div>
                     <div title="Access Token Status" className={`flex items-center gap-2 text-sm ${validUsers.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                        <span className="font-medium">Active Tokens: <span className="font-semibold text-slate-100">{validUsers.length}</span></span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
                     <div title="Your IP Address" className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                        <span>{ipAddress || '...'}</span>
                    </div>
                     <div title="Current Time" className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>{formattedTime}</span>
                    </div>
                    <div title="Last data refresh" className="flex items-center gap-2 text-slate-400 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9V3"/></svg>
                        <span>{formatTimeAgo(lastRefreshed)}</span>
                    </div>
                </div>
                <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center justify-center h-8 w-8 bg-slate-700/50 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Refresh data"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? 'animate-spin' : ''}><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
            </div>
        </header>
    );
};

export default Header;