import React from 'react';

interface SidebarProps {
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedPageId, onSelectPage, onOpenSettings }) => {
  return (
    <aside className="w-64 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col hidden md:flex">
      {/* Header */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-slate-700">
         <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            <h1 className="text-lg font-bold text-slate-100">
              Fanpage Dashboard
            </h1>
         </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <button
            onClick={() => onSelectPage('all')}
            className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-all duration-200 text-sm font-semibold ${
              selectedPageId === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 hover:translate-x-1'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            <span>Overall Dashboard</span>
        </button>

        <button
            onClick={() => onSelectPage('uploader')}
            className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-all duration-200 text-sm font-semibold ${
              selectedPageId === 'uploader'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 hover:translate-x-1'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            <span>Uploader</span>
        </button>
        
        <button
            onClick={() => onSelectPage('role_manager')}
            className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-all duration-200 text-sm font-semibold ${
              selectedPageId === 'role_manager'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 hover:translate-x-1'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Role Manager</span>
        </button>

        <button
            onClick={() => onSelectPage('engagement_booster')}
            className={`w-full text-left flex items-center gap-3 p-2 rounded-md transition-all duration-200 text-sm font-semibold ${
              selectedPageId === 'engagement_booster'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 hover:translate-x-1'
            }`}
          >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
            <span>Engagement Booster</span>
        </button>
      </nav>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-slate-700">
          <button 
            onClick={onOpenSettings}
            className="w-full text-left flex items-center gap-3 p-2 rounded-md transition-all duration-200 text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
             <span>Settings</span>
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;
