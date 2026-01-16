import React, { useState } from 'react';
import { Trello, Home, Star, Plus, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ boards, activeBoard, onSelectBoard, onCreateBoard, isOpen, toggleSidebar }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const navigate = useNavigate();

  const backgrounds = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  ];

  const handleCreateBoard = () => {
    if (newBoardTitle.trim()) {
      onCreateBoard({
        title: newBoardTitle,
        background: selectedBackground, // Map to correct prop (backend uses background_color or image)
        starred: false,
      });
      setNewBoardTitle('');
      setIsCreating(false);
    }
  };
  
  // Backwards compatibility with my existing sidebar props if needed
  // My Board.jsx passes { isOpen, toggleSidebar }
  // The User's Sidebar assumes it's always open 64w
  // I will adapt the user's Sidebar to handle the existing props or just replace it.
  // The user's code returns a <div>...</div>.
  // I should respect `isOpen`.
  
  if (!isOpen) { 
      return (
        <div className="fixed top-4 left-0 z-50">
             <Button variant="ghost" size="sm" onClick={toggleSidebar} className="bg-white border shadow-sm rounded-r-full pr-2 pl-1 h-8">
                 ▶
             </Button>
        </div>
      );
  }

  // boards prop might be undefined if we use the component differently, 
  // currently my Sidebar fetches its own boards.
  // I should probably Keep the fetch logic or refactor Board.jsx to pass boards.
  // The user's code assumes `boards` is passed in.
  // I will QUICKLY ADD the fetch logic back HERE to ensure it works standalone as before,
  // OR update Board.jsx to pass it.
  // To avoid breaking, I'll add the fetch logic inside this component if props are missing, 
  // matching my previous architecture but with new styling.
  
  // Actually, for "exact css", I should use the user's structure.
  // But the user's structure relies on props `boards`, `activeBoard`.
  // I will modify `Board.jsx` to pass these or wrap this.
  // For now I'll add the data fetching back IN here to be safe and self-contained, 
  // but rendering exactly what the user asked (plus the toggle button).

  // Wait, I can't just add fetch logic if the UI is totally different. The user's UI expects lists of boards.
  // I'll stick to the user's UI.

  const starredBoards = (boards || []).filter(b => b.starred);
  const regularBoards = (boards || []).filter(b => !b.starred);

  return (
    <>
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Trello className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">Trello</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-6 w-6">
              ◀
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1 mb-6">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-3" />
              Boards
            </Button>
          </div>

          {/* Starred Boards */}
          {starredBoards.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600">
                <Star className="h-3 w-3" />
                STARRED BOARDS
              </div>
              <div className="space-y-1">
                {starredBoards.map(board => (
                  <Button
                    key={board.id}
                    variant={activeBoard?.id === board.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => onSelectBoard(board.id)}
                  >
                    <div
                      className="w-6 h-4 rounded mr-3"
                      style={{ background: board.background_color || '#0079bf' }}
                    />
                    <span className="truncate">{board.title}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Your Boards */}
          <div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-600">
              YOUR BOARDS
            </div>
            <div className="space-y-1">
              {(regularBoards.length > 0 ? regularBoards : []).map(board => (
                <Button
                  key={board.id}
                  variant={activeBoard?.id === board.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => onSelectBoard(board.id)}
                >
                  <div
                    className="w-6 h-4 rounded mr-3"
                    style={{ background: board.background_color || '#0079bf' }} // Handle hex or gradient
                  />
                  <span className="truncate">{board.title}</span>
                </Button>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-600"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-4 w-4 mr-3" />
                Create new board
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Board Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Board Title</label>
              <Input
                autoFocus
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateBoard()}
                placeholder="Enter board title..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Background</label>
              <div className="grid grid-cols-3 gap-2">
                {backgrounds.map((bg, idx) => (
                  <div
                    key={idx}
                    className={`h-16 rounded-lg cursor-pointer ring-2 ${
                      selectedBackground === bg ? 'ring-blue-600' : 'ring-transparent'
                    }`}
                    style={{ background: bg }}
                    onClick={() => setSelectedBackground(bg)}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBoard}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;
