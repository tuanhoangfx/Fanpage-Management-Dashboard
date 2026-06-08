import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { Page, TokenProfile, Post } from './types';
import { getPagesData, getTokenInfo, updatePageDetails } from './services/facebookService';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import PageDashboard from './components/PageDashboard';
import AllPagesDashboard from './components/AllPagesDashboard';

const SettingsModal = lazy(() => import('./components/SettingsModal'));
const Uploader = lazy(() => import('./components/Uploader'));
const RoleManager = lazy(() => import('./components/RoleManager'));
const EngagementBooster = lazy(() => import('./components/EngagementBooster'));
const PostDetailModal = lazy(() => import('./components/PostDetailModal'));


interface User {
  name: string;
  id: string;
  picture: {
    data: {
      url: string;
    }
  }
}

const EditPageModal: React.FC<{
  page: Page;
  onClose: () => void;
  onSave: (pageId: string, pageToken: string, details: { name?: string; about?: string; coverFile?: File; pictureFile?: File }) => Promise<void>;
}> = ({ page, onClose, onSave }) => {
  const [name, setName] = useState(page.name);
  const [about, setAbout] = useState(page.about);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(page.cover?.source || null);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(page.picture.data.url);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPictureFile(file);
      setPicturePreview(URL.createObjectURL(file));
    }
  };


  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const details: { name?: string; about?: string; coverFile?: File; pictureFile?: File } = {};
      // Only include fields that have changed
      if (name !== page.name) details.name = name;
      if (about !== page.about) details.about = about;
      if (coverFile) details.coverFile = coverFile;
      if (pictureFile) details.pictureFile = pictureFile;

      if (Object.keys(details).length > 0) {
        await onSave(page.id, page.access_token!, details);
      } else {
        onClose(); // No changes, just close
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 flex flex-col max-h-[90vh] animate-fade-in-scale-up">
        <div className="p-5 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-100">Edit {page.name}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
            {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-md text-sm">{error}</div>}
            
            <div>
                 <label htmlFor="pageName" className="block text-sm font-medium text-slate-300 mb-2">Page Name</label>
                 <input type="text" id="pageName" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm" />
            </div>
            <div>
                 <label htmlFor="pageAbout" className="block text-sm font-medium text-slate-300 mb-2">About / Bio</label>
                 <textarea id="pageAbout" value={about} onChange={(e) => setAbout(e.target.value)} rows={4}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <label htmlFor="pagePicture" className="block text-sm font-medium text-slate-300 mb-2">Profile Picture</label>
                     {picturePreview && <img src={picturePreview} alt="Avatar preview" className="w-48 h-48 object-cover rounded-full mx-auto mb-2 bg-slate-700" />}
                     <input type="file" id="pagePicture" onChange={handlePictureChange} accept="image/png, image/jpeg, image/gif"
                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 transition-colors" />
                </div>
                 <div>
                     <label htmlFor="pageCover" className="block text-sm font-medium text-slate-300 mb-2">Cover Photo</label>
                     {coverPreview && <img src={coverPreview} alt="Cover preview" className="w-full h-48 object-cover rounded-md mb-2 bg-slate-700" />}
                     <input type="file" id="pageCover" onChange={handleCoverChange} accept="image/png, image/jpeg, image/gif"
                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600 transition-colors" />
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-all duration-200 text-sm font-semibold active:scale-95">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-all duration-200 text-sm font-semibold disabled:bg-slate-600 disabled:cursor-wait w-28 active:scale-95">
                {isSaving ? 'Saving...' : 'Save'}
            </button>
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [accessTokens, setAccessTokens] = useState<string[]>(() => {
    const savedTokens = localStorage.getItem('fb_access_tokens');
    // Add default token for first-time use
    return savedTokens ? JSON.parse(savedTokens) : [];
  });
  const [tokenProfiles, setTokenProfiles] = useState<TokenProfile[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<string>(() => localStorage.getItem('fb_refresh_interval') || '0');

  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [viewingPost, setViewingPost] = useState<{ post: Post, page: Page } | null>(null);

  useEffect(() => {
    const fetchIp = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            setIpAddress(data.ip);
        } catch (e) {
            console.error("Failed to fetch IP address:", e);
            setIpAddress('N/A');
        }
    };
    fetchIp();
  }, []);

  const fetchData = useCallback(async (tokens: string[], isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);

    const profiles: TokenProfile[] = tokens.map(token => ({ token, status: 'loading', pageCount: 0 }));
    if (!isRefresh) setTokenProfiles(profiles);

    try {
        const pageDataPromises = tokens.map(token => getPagesData(token));
        const allPagesArrays = await Promise.all(pageDataPromises);
        const flattenedPages = allPagesArrays.flat();
        setPages(flattenedPages);

        const infoPromises = tokens.map(token => getTokenInfo(token).catch(e => e));
        const infoResults = await Promise.all(infoPromises);

        const updatedProfiles = tokens.map((token, index) => {
            const result = infoResults[index];
            if (result instanceof Error) {
                return { token, status: 'error', errorMessage: result.message, pageCount: 0 };
            }
            return { token, status: 'success', user: result.user, pageCount: result.pageCount };
        });
        setTokenProfiles(updatedProfiles);
        
        if (!isRefresh && flattenedPages.length > 0) {
            setSelectedPageId('all');
        } else if (flattenedPages.length === 0 && tokens.length === 0) {
            setIsSettingsOpen(true);
        }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(`Failed to fetch data. ${errorMessage}`);
      setPages([]);
      setTokenProfiles(tokens.map(token => ({ token, status: 'error', errorMessage: 'Batch fetch failed', pageCount: 0 })));
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
      setLastRefreshed(new Date());
    }
  }, []);

  useEffect(() => {
    fetchData(accessTokens);
  }, [accessTokens, fetchData]);
  
  useEffect(() => {
    const intervalMs = parseInt(refreshInterval, 10);
    if (!intervalMs || accessTokens.length === 0) {
        return;
    }

    const intervalId = setInterval(() => {
        fetchData(accessTokens, true);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [refreshInterval, accessTokens, fetchData]);

  const handleSaveSettings = (settings: { tokens: string[]; interval: string }) => {
    localStorage.setItem('fb_access_tokens', JSON.stringify(settings.tokens));
    localStorage.setItem('fb_refresh_interval', settings.interval);
    setRefreshInterval(settings.interval);
    setAccessTokens(settings.tokens);
    setIsSettingsOpen(false);
  };

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
  };

  const handleSavePageDetails = async (pageId: string, pageToken: string, details: { name?: string; about?: string; coverFile?: File; pictureFile?: File }) => {
    await updatePageDetails(pageId, pageToken, details);
    setEditingPage(null);
    await fetchData(accessTokens, true); // Refresh data after saving
  };
  
  const selectedPage = pages.find(p => p.id === selectedPageId);
  const validUsers = useMemo(() => 
    tokenProfiles.filter(p => p.status === 'success' && p.user).map(p => p.user as User), 
    [tokenProfiles]
  );


  const renderContent = () => {
    if (loading) {
        return <LoadingSpinner />;
    }
    if (error) {
        return <ErrorMessage message={error} />;
    }
    if (accessTokens.length === 0) {
         return (
            <div className="text-center py-10 bg-slate-800 rounded-lg">
                <p className="text-slate-400">Please add an Access Token in Settings to begin.</p>
            </div>
         );
    }

    if (selectedPageId === 'uploader') {
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Uploader pages={pages} />
          </Suspense>
        );
    }

    if (selectedPageId === 'role_manager') {
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <RoleManager pages={pages} />
          </Suspense>
        );
    }
    
    if (selectedPageId === 'engagement_booster') {
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <EngagementBooster pages={pages} />
          </Suspense>
        );
    }

    if (selectedPageId === 'all') {
        return <AllPagesDashboard pages={pages} onSelectPage={handleSelectPage} onEditPage={(page) => setEditingPage(page)} />;
    }

    if (selectedPage) {
        return <PageDashboard 
            page={selectedPage} 
            allPages={pages}
            onSelectPage={handleSelectPage}
            onEditPage={(page) => setEditingPage(page)} 
            onDataRefresh={() => fetchData(accessTokens, true)}
            onViewPost={(post) => setViewingPost({post, page: selectedPage})}
        />;
    }

    if (pages.length === 0 && !loading) {
        return (
            <div className="text-center py-10 bg-slate-800 rounded-lg">
                <p className="text-slate-400">No managed pages found with the provided tokens. Please check your token permissions.</p>
            </div>
         );
    }
    
    return null;
  };

  return (
    <div className="flex h-full text-slate-200 bg-slate-900">
      <Sidebar 
        selectedPageId={selectedPageId}
        onSelectPage={handleSelectPage}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            validUsers={validUsers}
            pagesCount={pages.length}
            ipAddress={ipAddress}
            onRefresh={() => accessTokens.length > 0 && fetchData(accessTokens, true)}
            lastRefreshed={lastRefreshed}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-900">
            <div className="animate-fade-in">
                {renderContent()}
            </div>
        </main>
      </div>
      <Suspense fallback={null}>
        {isSettingsOpen && (
          <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
            initialTokens={accessTokens}
          />
        )}
        {editingPage && (
          <EditPageModal 
              page={editingPage}
              onClose={() => setEditingPage(null)}
              onSave={handleSavePageDetails}
          />
        )}
        {viewingPost && (
          <PostDetailModal
              post={viewingPost.post}
              page={viewingPost.page}
              onClose={() => setViewingPost(null)}
          />
        )}
      </Suspense>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
        
        @keyframes fade-in-scale-up {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale-up {
          animation: fade-in-scale-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
