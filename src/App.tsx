/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  Layers, 
  X, 
  ExternalLink, 
  Search, 
  Trash2, 
  ChevronRight,
  Pin,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

interface Tab {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  pinned: boolean;
  windowId: number;
  groupId?: number;
}

interface TabGroup {
  domain: string;
  tabs: Tab[];
  isOpen: boolean;
}

// --- Mock Data ---

const MOCK_TABS: Tab[] = [
  { id: 1, url: 'https://google.com/search?q=react', title: 'React Search - Google', favIconUrl: 'https://www.google.com/favicon.ico', pinned: false, windowId: 1 },
  { id: 2, url: 'https://google.com/maps', title: 'Google Maps', favIconUrl: 'https://www.google.com/favicon.ico', pinned: true, windowId: 1 },
  { id: 3, url: 'https://github.com/facebook/react', title: 'GitHub - facebook/react', favIconUrl: 'https://github.com/favicon.ico', pinned: false, windowId: 1 },
  { id: 4, url: 'https://github.com/vitejs/vite', title: 'Vite | Next Generation Frontend Tooling', favIconUrl: 'https://vitejs.dev/logo.svg', pinned: false, windowId: 1 },
  { id: 5, url: 'https://github.com/lucide-icons/lucide', title: 'GitHub - lucide-icons/lucide', favIconUrl: 'https://github.com/favicon.ico', pinned: false, windowId: 1 },
  { id: 6, url: 'https://stackoverflow.com/questions/1', title: 'How to use React?', favIconUrl: 'https://stackoverflow.com/favicon.ico', pinned: false, windowId: 1 },
  { id: 7, url: 'https://stackoverflow.com/questions/2', title: 'Chrome Extension APIs', favIconUrl: 'https://stackoverflow.com/favicon.ico', pinned: false, windowId: 1 },
];

// --- Utilities ---

const getDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return 'Other';
  }
};

// --- Application ---

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExtension, setIsExtension] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize tabs and detect environment
  useEffect(() => {
    const fetchTabs = async () => {
      // @ts-ignore - chrome might be undefined in web preview
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        setIsExtension(true);
        // @ts-ignore
        chrome.tabs.query({}, (result: Tab[]) => {
          setTabs(result);
          setLoading(false);
        });
      } else {
        // Mock data for development/preview
        setTimeout(() => {
          setTabs(MOCK_TABS);
          setLoading(false);
        }, 800);
      }
    };

    fetchTabs();
  }, []);

  // Filter tabs by search query and pinned status
  const filteredTabs = useMemo(() => {
    return tabs.filter(tab => 
      (tab.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       tab.url.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tabs, searchQuery]);

  // Group non-pinned tabs by domain
  const tabGroups = useMemo(() => {
    const groups: Record<string, Tab[]> = {};
    
    filteredTabs.forEach(tab => {
      if (tab.pinned) return; 
      
      const domain = getDomain(tab.url);
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(tab);
    });

    return Object.entries(groups)
      .map(([domain, tabs]) => ({ domain, tabs }))
      .sort((a, b) => b.tabs.length - a.tabs.length); 
  }, [filteredTabs]);

  const pinnedTabs = useMemo(() => tabs.filter(t => t.pinned), [tabs]);

  // Actions
  const closeTab = (id: number) => {
    // @ts-ignore
    if (isExtension && chrome.tabs) {
      // @ts-ignore
      chrome.tabs.remove(id);
    }
    setTabs(prev => prev.filter(t => t.id !== id));
  };

  const groupTabsByDomain = async (domain: string, tabIds: number[]) => {
    // @ts-ignore
    if (isExtension && chrome.tabs.group) {
      // @ts-ignore
      chrome.tabs.group({ tabIds }, (groupId) => {
        // @ts-ignore
        chrome.tabGroups.update(groupId, { title: domain });
      });
    } else {
      console.log(`Mocking group creation for ${domain} with ${tabIds.length} tabs`);
      alert(`Extension Action: Grouping ${tabIds.length} tabs for ${domain}`);
    }
  };

  const groupAll = () => {
    tabGroups.forEach(group => {
      if (group.tabs.length > 1) {
        groupTabsByDomain(group.domain, group.tabs.map(t => t.id));
      }
    });
  };

  return (
    <div className="min-h-[500px] w-[400px] bg-slate-50 text-slate-800 font-sans selection:bg-blue-500/10 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">TabVault<span className="text-blue-600">.</span></h1>
        </div>
        {!loading && (
          <button 
            onClick={groupAll}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium text-xs transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-1.5"
          >
            <Zap className="w-3 h-3" />
            Group All
          </button>
        )}
      </header>

      {/* Stats Summary Widget Style */}
      <div className="px-4 pt-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live Summary</h2>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xl font-bold text-slate-800 leading-none">{tabs.length}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Total Open</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600 leading-none">{tabGroups.length}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Potential Groups</p>
            </div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 w-[60%] h-full"></div>
            <div className="bg-amber-400 w-[15%] h-full"></div>
            <div className="bg-slate-300 w-[25%] h-full"></div>
          </div>
        </div>
      </div>

      {/* Search Input Sleek Style */}
      <div className="px-4 py-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search active workspace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-blue-500/50 shadow-sm transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pinned Info Badge Style */}
            {pinnedTabs.length > 0 && searchQuery === '' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100/50 rounded-full text-[10px] font-bold text-amber-700 w-fit mx-auto shadow-sm shadow-amber-100/20">
                <Pin className="h-3 w-3" />
                {pinnedTabs.length} Pinned Tabs Excluded
              </div>
            )}

            {/* Grouped Tabs Cards */}
            {tabGroups.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {tabGroups.map((group, index) => (
                    <motion.div 
                      key={group.domain}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group/card"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-800 text-sm shadow-sm uppercase">
                            {group.domain.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm tracking-tight">{group.domain}</h3>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 group-hover/card:text-blue-500 transition-colors">
                              <span className="w-1 h-1 bg-slate-300 rounded-full group-hover/card:bg-blue-500"></span>
                              {group.tabs.length} tabs ready for vault
                            </p>
                          </div>
                        </div>
                        <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-mono font-bold text-slate-600 border border-slate-200">
                          {group.tabs.length} OPEN
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {group.tabs.slice(0, 3).map(tab => (
                          <div key={tab.id} className="flex items-center gap-2.5 p-1.5 rounded-lg border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group/tab relative">
                             <img 
                              src={tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${group.domain}`} 
                              alt="" 
                              className="w-3.5 h-3.5 rounded-sm grayscale group-hover/tab:grayscale-0 transition-all"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[11px] font-medium text-slate-600 truncate flex-1 leading-tight group-hover/tab:text-slate-900">{tab.title}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                              className="opacity-0 group-hover/tab:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => groupTabsByDomain(group.domain, group.tabs.map(t => t.id))}
                        className="w-full py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 text-[10px] font-bold rounded-lg border border-slate-200 hover:border-blue-200 transition-all uppercase tracking-wider"
                      >
                        Vault Domain
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-3">
                  <LayoutGrid className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">No active domains found</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Info Sleek Style */}
      <footer className="h-12 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200 animate-pulse"></span>
          Grouping Engine Ready
        </div>
        <div className="text-slate-300">v1.0.0</div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}} />
    </div>
  );
}

