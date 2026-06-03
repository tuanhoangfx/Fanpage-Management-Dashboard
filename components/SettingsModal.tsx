import React, { useState, useEffect, useCallback } from 'react';
import { getTokenInfo } from '../services/facebookService';
import type { TokenProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { tokens: string[]; interval: string }) => void;
  initialTokens: string[];
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialTokens }) => {
  const [profiles, setProfiles] = useState<TokenProfile[]>([]);
  const [interval, setInterval] = useState(() => localStorage.getItem('fb_refresh_interval') || '0');
  const [newToken, setNewToken] = useState('');

  const handleCheckToken = useCallback(async (tokenToCheck: string) => {
    setProfiles(prev => prev.map(p => p.token === tokenToCheck ? { ...p, status: 'loading' } : p));
    try {
        const { user, pageCount } = await getTokenInfo(tokenToCheck);
        setProfiles(prev => prev.map(p => p.token === tokenToCheck ? { ...p, status: 'success', user, pageCount } : p));
    } catch(err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setProfiles(prev => prev.map(p => p.token === tokenToCheck ? { ...p, status: 'error', errorMessage } : p));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
        const initialProfiles = initialTokens.map(token => ({ token, status: 'unchecked' as const, pageCount: 0 }));
        setProfiles(initialProfiles);
        setInterval(localStorage.getItem('fb_refresh_interval') || '0');
        
        initialProfiles.forEach(profile => {
            if (profile.status === 'unchecked') {
                handleCheckToken(profile.token);
            }
        });
    }
  }, [isOpen, initialTokens, handleCheckToken]);

  const handleAddToken = () => {
    if (newToken && !profiles.some(p => p.token === newToken)) {
        const profile: TokenProfile = { token: newToken, status: 'unchecked', pageCount: 0 };
        setProfiles(prev => [...prev, profile]);
        setNewToken('');
        handleCheckToken(newToken);
    }
  };
  
  const handleRemoveToken = (tokenToRemove: string) => {
    setProfiles(prev => prev.filter(p => p.token !== tokenToRemove));
  };
  
  const handleSave = () => {
    onSave({ tokens: profiles.map(p => p.token), interval });
  };

  if (!isOpen) return null;

  const StatusIndicator: React.FC<{profile: TokenProfile}> = ({ profile }) => {
    switch (profile.status) {
        case 'loading': return <span className="text-sm text-blue-400">Checking...</span>;
        case 'success': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">Valid</span>;
        case 'error': return <span title={profile.errorMessage} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-200 cursor-help">Invalid</span>;
        default: return <span className="text-sm text-slate-400">Unchecked</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-fast">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-slate-700 animate-fade-in-scale-up">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-100">Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-3xl leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-6">
            <div>
                 <label htmlFor="refreshInterval" className="block text-sm font-medium text-slate-300 mb-2">Auto Refresh</label>
                 <select id="refreshInterval" value={interval} onChange={(e) => setInterval(e.target.value)}
                    className="w-full md:w-1/3 bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm">
                    <option value="0">Disabled</option>
                    <option value="60000">Every 1 minute</option>
                    <option value="300000">Every 5 minutes</option>
                    <option value="900000">Every 15 minutes</option>
                </select>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-200">Access Tokens</h3>
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800/70">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Access Token</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Pages</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {profiles.map(p => (
                                <tr key={p.token}>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {p.user ? <div className="flex items-center gap-3">
                                            <img src={p.user.picture.data.url} alt={p.user.name} className="w-8 h-8 rounded-full" />
                                            <span className="text-sm font-medium text-slate-200">{p.user.name}</span>
                                        </div> : <div className="text-sm text-slate-500">N/A</div>}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400 font-mono" title={p.token}>{`${p.token.substring(0, 10)}...${p.token.substring(p.token.length - 4)}`}</td>
                                    <td className="px-4 py-3 whitespace-nowrap"><StatusIndicator profile={p} /></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{p.status === 'success' ? p.pageCount : '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                                        <button onClick={() => handleCheckToken(p.token)} className="text-blue-400 hover:text-blue-300 disabled:opacity-50" disabled={p.status === 'loading'}>Check</button>
                                        <button onClick={() => handleRemoveToken(p.token)} className="text-red-400 hover:text-red-300">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex gap-2 pt-2">
                    <input type="text" value={newToken} onChange={e => setNewToken(e.target.value)} placeholder="Paste new access token here" 
                        className="flex-grow bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm" />
                    <button onClick={handleAddToken} disabled={!newToken}
                        className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors text-sm font-semibold">Add Token</button>
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-all duration-200 text-sm font-semibold active:scale-95">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-all duration-200 text-sm font-semibold active:scale-95">Save Settings</button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default SettingsModal;