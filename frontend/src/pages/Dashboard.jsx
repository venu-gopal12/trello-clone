import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Plus, Layout } from 'lucide-react';

const Dashboard = () => {
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  useEffect(() => {
    // If global context is loading, keep local loading true
    if (orgLoading) return;

    if (currentOrganization) {
        fetchBoards(currentOrganization.id);
    } else {
        setBoards([]);
        setLoading(false);
    }
  }, [currentOrganization, orgLoading]);

  const fetchBoards = async (orgId) => {
    try {
      setLoading(true);
      const { data } = await api.get('/boards', { params: { organization_id: orgId } });
      setBoards(data);
    } catch (error) {
      console.error('Failed to fetch boards', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const payload = { 
          title: newBoardTitle,
          organization_id: currentOrganization?.id
      };
      
      const { data } = await api.post('/boards', payload);
      setBoards([data, ...boards]);
      setNewBoardTitle('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create board', error);
    }
  };

  if (!currentOrganization && !orgLoading) {
      return (
          <div className="flex h-full flex-col items-center justify-center p-8 bg-slate-50">
              <div className="max-w-md text-center space-y-4">
                  <div className="mx-auto h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200">
                      <Layout className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome to Trello Clone</h2>
                  <p className="text-slate-500 leading-relaxed">
                      Collaborate, manage projects, and reach new productivity peaks.
                      Select or create an organization workspace to get started.
                  </p>
              </div>
          </div>
      );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Boards</h2>
            <p className="text-sm text-slate-500 mt-1">Manage your projects and tasks</p>
          </div>
          {/* Optional actions */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
           Array.from({ length: 4 }).map((_, i) => (
               <Skeleton key={i} className="h-32 w-full rounded-xl bg-slate-200" />
           ))
        ) : (
           <>
              {/* Create New Board Card */}
              {!isCreating ? (
                <div 
                    onClick={() => setIsCreating(true)}
                    className="h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-indigo-500 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group"
                >
                    <div className="h-10 w-10 rounded-full bg-slate-200 group-hover:bg-indigo-50 flex items-center justify-center mb-2 transition-colors">
                        <Plus className="h-5 w-5 text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600">Create new board</span>
                </div>
              ) : (
                <div className="h-auto min-h-32 p-4 rounded-xl bg-white border border-indigo-200 shadow-lg ring-2 ring-indigo-500/20">
                     <form onSubmit={handleCreateBoard} className="flex flex-col h-full justify-between">
                        <div>
                             <label className="text-xs font-semibold text-indigo-600 uppercase mb-1 block">Board Title</label>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="e.g. Q4 Roadmap" 
                                value={newBoardTitle}
                                onChange={(e) => setNewBoardTitle(e.target.value)}
                                className="w-full px-0 py-1 text-sm bg-transparent border-b-2 border-indigo-100 focus:border-indigo-500 outline-none text-slate-900 placeholder:text-slate-400 font-medium transition-colors"
                                onBlur={() => !newBoardTitle && setIsCreating(false)} 
                            />
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                            <Button size="sm" type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">Create</Button>
                            <Button size="sm" variant="ghost" type="button" onClick={() => setIsCreating(false)} className="h-8 text-xs text-slate-500">Cancel</Button>
                        </div>
                     </form>
                </div>
              )}

              {/* Board List */}
              {boards.map(board => (
                <Link 
                    key={board.id} 
                    to={`/board/${board.id}`} 
                    className="group relative h-32 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ring-1 ring-slate-900/5"
                    style={{
                        backgroundColor: board.background_color || '#0079bf',
                        backgroundImage: board.background_image 
                            ? (board.background_image.includes('gradient') ? board.background_image : `url(${board.background_image})`)
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="relative h-full p-4 flex flex-col justify-end">
                        <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm group-hover:translate-x-1 transition-transform">{board.title}</h3>
                    </div>
                </Link>
              ))}
           </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
