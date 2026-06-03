import React, { useState } from 'react';
import type { Page } from '../types';
import { assignRoleToPage, PageRole } from '../services/facebookService';
import PagesListView from './PagesListView';

interface RoleManagerProps {
  pages: Page[];
}

interface AssignResult {
  pageName: string;
  status: 'success' | 'error';
  message: string;
}

const ROLES: PageRole[] = ['ADMIN', 'EDITOR', 'MODERATOR', 'ADVERTISER', 'ANALYST'];

const RoleManager: React.FC<RoleManagerProps> = ({ pages }) => {
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<PageRole>('EDITOR');
  const [isAssigning, setIsAssigning] = useState(false);
  const [results, setResults] = useState<AssignResult[]>([]);

  const handleAssignRoles = async () => {
    if (selectedPageIds.length === 0 || !userId.trim()) {
        alert("Please select at least one page and enter a User ID.");
        return;
    }
    
    setIsAssigning(true);
    setResults([]);

    const assignPromises = selectedPageIds.map(async (pageId) => {
        const page = pages.find(p => p.id === pageId);
        if (!page || !page.access_token) {
            return { pageName: page?.name || pageId, status: 'error' as const, message: 'Page access token not found.' };
        }

        try {
            await assignRoleToPage(pageId, page.access_token, userId, role);
            return { pageName: page.name, status: 'success' as const, message: `Successfully assigned ${role} role.` };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            return { pageName: page.name, status: 'error' as const, message: errorMessage };
        }
    });
    
    const settledResults = await Promise.all(assignPromises);
    setResults(settledResults);
    setIsAssigning(false);
  };
  
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-100">Bulk Role Manager</h2>

      <div className="bg-orange-900/50 border-l-4 border-orange-500 text-orange-200 p-4 rounded-md" role="alert">
        <p className="font-bold">Permission Required</p>
        <p className="text-sm">To use this feature, your access token must have the `pages_manage_access` permission, and you must be an ADMIN of the pages you are managing.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">1. Select Pages to Manage</h3>
        <PagesListView pages={pages} selectedPageIds={selectedPageIds} onSelectionChange={setSelectedPageIds} />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">2. Assign Role</h3>
        <div>
            <label htmlFor="userId" className="block text-sm font-medium text-slate-300 mb-2">Facebook User ID</label>
            <input type="text" id="userId" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Enter the numeric ID of the user"
                className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm" />
            <p className="text-xs text-slate-500 mt-1">You can find a user's ID by checking the URL of their profile or using an online tool.</p>
        </div>
        <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">Role to Assign</label>
            <select id="role" value={role} onChange={e => setRole(e.target.value as PageRole)}
                className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
            onClick={handleAssignRoles} 
            disabled={isAssigning || selectedPageIds.length === 0 || !userId.trim()} 
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all flex items-center gap-2 active:scale-95">
            {isAssigning && <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>}
            {isAssigning ? 'Assigning...' : `Assign Role to ${selectedPageIds.length} Page(s)`}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-slate-200 p-4 border-b border-slate-700">Assignment Results</h3>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400" title={result.message}>
                    <span className="truncate block max-w-xs">{result.message}</span>
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

export default RoleManager;