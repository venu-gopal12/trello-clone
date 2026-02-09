import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Star, MoreHorizontal, Loader, Plus, Filter, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../services/api';
import List from '../components/List';
import CardModal from '../components/CardModal'; 
import SearchBar from '../components/SearchBar'; 
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';

const Board = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  
  // Search & Filter State
  const [filters, setFilters] = useState({
      keyword: '',
      labels: [], 
      members: [], 
      dueDateFilter: null 
  });

  // Modal State
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedListTitle, setSelectedListTitle] = useState('');

  // Add List State
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // Data Fetching
  const [allMembers, setAllMembers] = useState([]);

  useEffect(() => {
    fetchBoard();
    fetchUsers();
  }, [id]);

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/boards/${id}`);
      data.lists.sort((a, b) => a.position - b.position);
      data.lists.forEach(list => {
        if (list.cards) list.cards.sort((a, b) => a.position - b.position);
      });
      setBoard(data);
    } catch (error) {
      console.error('Failed to fetch board', error);
      toast.error("Failed to load board");
    }
  };
  
  const fetchUsers = async () => {
      try {
          const { data } = await api.get('/users');
          setAllMembers(data);
      } catch (e) {
          console.error("Failed to fetch users", e);
      }
  };

  // --- Filtering Logic ---
  const filterCards = (cards) => {
      if (!cards) return [];
      
      return cards.filter(card => {
          // Keyword
          if (filters.keyword && !card.title.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
          
          // Labels (OR logic)
          if (filters.labels.length > 0) {
              const cardLabelIds = card.labels?.map(l => String(l.id)) || [];
              const filterLabelIds = filters.labels.map(String);
              
              const hasMatch = filterLabelIds.some(id => cardLabelIds.includes(id));
              if (!hasMatch) return false;
          }
          
          // Members (OR logic)
          if (filters.members.length > 0) {
               const cardMemberIds = card.members?.map(m => String(m.id)) || [];
               const filterMemberIds = filters.members.map(String);
               const hasMatch = filterMemberIds.some(id => cardMemberIds.includes(id));
               if (!hasMatch) return false;
          }
          
          // Due Date
          if (filters.dueDateFilter) {
               if (filters.dueDateFilter === 'no-due-date') {
                   // If filter is 'no-due-date', show only cards WITHOUT due date
                   if (card.due_date) return false;
               } else {
                   // For other filters, card MUST have a due date
                   if (!card.due_date) return false;
                   
                   const due = new Date(card.due_date);
                   const now = new Date();
                   // Calculate difference in days (ignoring time mostly, but simple diff is fine)
                   const diffTime = due - now;
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                   if (filters.dueDateFilter === 'overdue' && due >= now) return false; // Hide if not overdue
                   if (filters.dueDateFilter === 'due-soon' && (diffDays < 0 || diffDays > 3)) return false; 
                   if (filters.dueDateFilter === 'due-later' && diffDays <= 3) return false;
               }
          }
          return true;
      });
  };

  const handleBoardDelete = async (boardId) => {
      if (window.confirm('Are you sure you want to delete this board? ALL DATA WILL BE LOST.')) { // Restore confirm as safety
          try {
              console.log('Deleting board:', boardId);
              await api.delete(`/boards/${boardId}`);
              toast.success('Board deleted successfully');
              console.log('Board deleted, navigating...');
              navigate('/');
          } catch (error) { 
              console.error('Failed to delete board', error); 
              toast.error('Failed to delete board');
          }
      }
  };
  
  // --- Drag and Drop ---
  const onDragEnd = async (result) => {
      const { destination, source, draggableId, type } = result;

      if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'list') {
       const newLists = Array.from(board.lists);
       const [movedList] = newLists.splice(source.index, 1);
       newLists.splice(destination.index, 0, movedList);
       setBoard({ ...board, lists: newLists });
       
       const prev = newLists[destination.index - 1];
       const next = newLists[destination.index + 1];
       const posPrev = prev ? prev.position : 0;
       const posNext = next ? next.position : (prev ? prev.position + 131070 : 65535);
       const newPos = (posPrev + posNext) / 2;
       
       try {
           await api.put(`/lists/${draggableId}`, { position: newPos });
       } catch (e) {
           console.error("Move list failed", e);
           toast.error("Failed to save list position");
       }
       return;
    }

    // Moving Card
    const sourceList = board.lists.find(l => l.id.toString() === source.droppableId);
    const destList = board.lists.find(l => l.id.toString() === destination.droppableId);
    if (!sourceList || !destList) return;

    if (sourceList === destList) {
        const newCards = Array.from(sourceList.cards);
        const [movedCard] = newCards.splice(source.index, 1);
        newCards.splice(destination.index, 0, movedCard);
        
        const newLists = board.lists.map(l => l.id === sourceList.id ? { ...l, cards: newCards } : l);
        setBoard({ ...board, lists: newLists });

        const prev = newCards[destination.index - 1];
        const next = newCards[destination.index + 1];
        const posPrev = prev ? prev.position : 0;
        const posNext = next ? next.position : (prev ? prev.position + 10000 : 200000);
        const newPos = (posPrev + posNext) / 2;

        try {
            await api.put(`/cards/${draggableId}`, { position: newPos, list_id: sourceList.id });
        } catch (e) { 
            console.error("Move card failed", e);
            toast.error("Failed to save card position");
        }
    } else {
        const sourceCards = Array.from(sourceList.cards);
        const [movedCard] = sourceCards.splice(source.index, 1);
        const destCards = Array.from(destList.cards);
        destCards.splice(destination.index, 0, movedCard);
        
        const newLists = board.lists.map(l => {
            if (l.id === sourceList.id) return { ...l, cards: sourceCards };
            if (l.id === destList.id) return { ...l, cards: destCards };
            return l;
        });
        setBoard({ ...board, lists: newLists });
        
        const prev = destCards[destination.index - 1];
        const next = destCards[destination.index + 1];
        const posPrev = prev ? prev.position : 0;
        const posNext = next ? next.position : (prev ? prev.position + 10000 : 200000);
        const newPos = (posPrev + posNext) / 2;
        
         try {
            await api.put(`/cards/${draggableId}`, { position: newPos, list_id: destList.id });
        } catch (e) { 
            console.error("Move card failed", e);
            toast.error("Failed to save card position");
        }
    }
  };

  // --- Actions ---
  const handleAddList = async () => {
      if (!newListTitle.trim()) return;
      const titleToUse = newListTitle;
      const tempId = `temp-list-${Date.now()}`;
      
      const tempList = { id: tempId, board_id: parseInt(id), title: titleToUse, position: (board.lists.length + 1) * 65535, cards: [] };

      setNewListTitle('');
      setIsAddingList(false);
      
      setBoard(prev => ({ ...prev, lists: [...prev.lists, tempList] }));

      try {
          const { data: newList } = await api.post('/lists', { board_id: id, title: titleToUse });
          setBoard(prev => ({
              ...prev,
              lists: prev.lists.map(l => l.id === tempId ? { ...newList, cards: [] } : l)
          }));
          toast.success("List created");
      } catch (e) { 
          console.error(e);
          toast.error("Failed to create list");
          setBoard(prev => ({ ...prev, lists: prev.lists.filter(l => l.id !== tempId) }));
      }
  };
  
  const handleListDelete = async (listId) => {
      if (confirm("Delete list?")) {
        const originalLists = board.lists;
        setBoard(prev => ({ ...prev, lists: prev.lists.filter(l => l.id !== listId) }));
        try { 
            await api.delete(`/lists/${listId}`); 
            toast.success("List deleted");
        } 
        catch (e) { 
            console.error(e);
            toast.error("Failed to delete list");
            setBoard(prev => ({ ...prev, lists: originalLists }));
        }
      }
  };

  const handleListUpdate = async (listId, title) => {
      setBoard(prev => ({
          ...prev,
          lists: prev.lists.map(l => l.id === listId ? { ...l, title } : l)
      }));
      try {
          await api.put(`/lists/${listId}`, { title });
      } catch (e) {
          console.error("Failed to update list", e);
          toast.error("Failed to update list title");
      }
  };

  const handleCardAdd = async (listId, title) => {
      const tempId = `temp-${Date.now()}`;
      const tempCard = { id: tempId, list_id: listId, title, position: 65535, labels: [], members: [] };

      setBoard(prev => ({
          ...prev,
          lists: prev.lists.map(list => list.id === listId ? { ...list, cards: [...list.cards, tempCard] } : list)
      }));

      try {
          const { data: newCard } = await api.post('/cards', { list_id: listId, title, position: 65535 });
          setBoard(prev => ({
              ...prev,
              lists: prev.lists.map(list => list.id === listId ? { ...list, cards: list.cards.map(c => c.id === tempId ? newCard : c) } : list)
          }));
          // toast.success("Card created"); // Optional: Creation is fast/visible, maybe no toast needed? User said "toast also", I'll skip simple create to avoid spam, or add it? I'll skip create toast for now as it's very frequent.
      } catch (e) { 
          console.error(e);
          toast.error("Failed to create card");
          setBoard(prev => ({
            ...prev,
            lists: prev.lists.map(list => list.id === listId ? { ...list, cards: list.cards.filter(c => c.id !== tempId) } : list)
        }));
      }
  };
  
  const handleCardDelete = async (cardId) => {
      // Optimistically remove from UI
      const originalLists = board.lists;
      setBoard(prev => ({
          ...prev,
          lists: prev.lists.map(list => ({ ...list, cards: list.cards.filter(c => c.id !== cardId) }))
      }));
      setSelectedCardId(null);

      // If it's a temporary card (not yet saved to DB), don't call API
      if (String(cardId).startsWith('temp-')) {
          console.log("Deleted temporary card locally:", cardId);
          return;
      }

      try { 
          await api.delete(`/cards/${cardId}`); 
          toast.success("Card deleted");
      } 
      catch(e) { 
          console.error("Delete failed", e);
          setBoard(prev => ({ ...prev, lists: originalLists }));
          toast.error("Failed to delete card");
      }
  };

  const handleCardUpdate = async (updatedCard) => {
      setBoard(prev => {
          const newLists = prev.lists.map(list => ({
              ...list,
              cards: list.cards.map(c => c.id === updatedCard.id ? { ...c, ...updatedCard } : c)
          }));
          return { ...prev, lists: newLists };
      });
      try {
          const payload = {
              title: updatedCard.title,
              description: updatedCard.description,
              due_date: updatedCard.dueDate || updatedCard.due_date,
          };
          api.put(`/cards/${updatedCard.id}`, payload);
      } catch(e) { 
          console.error("Card update failed", e);
          toast.error("Failed to update card");
      }
  };
  
  const handleStarToggle = async () => {
    try {
        setBoard(prev => ({ ...prev, is_starred: !prev.is_starred }));
        await api.post(`/boards/${board.id}/star`);
    } catch (e) {
        console.error("Failed to toggle star", e);
        setBoard(prev => ({ ...prev, is_starred: !prev.is_starred }));
        toast.error("Failed to update board");
    }
  };

  if (!board) return <div className="flex h-full items-center justify-center bg-slate-50"><Loader className="animate-spin text-indigo-600 h-8 w-8" /></div>;

  const selectedCard = selectedCardId 
    ? board.lists.flatMap(l => l.cards).find(c => c.id === selectedCardId) 
    : null;

  return (
    <div className="flex flex-col h-full bg-slate-50">
        {/* Board Canvas */}
        <div 
            className="flex-1 flex flex-col relative overflow-hidden"
            style={{ 
                backgroundColor: board.background_color || '#0079bf',
                backgroundImage: board.background_image 
                    ? (board.background_image.includes('gradient') ? board.background_image : `url(${board.background_image})`)
                    : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
             {/* Dark overlay for text readability as requested */}
             <div className="absolute inset-0 bg-black/40" />
             
             {/* Board Navbar (Transparent Glass) */}
             <div className="relative z-40 flex items-center justify-between px-6 py-3 text-white bg-black/20 backdrop-blur-md border-b border-white/10 shadow-sm transition-all">
                 <div className="flex items-center gap-4">
                     <h1 className="text-xl font-bold rounded-md px-3 py-1 hover:bg-white/20 cursor-pointer transition-colors backdrop-blur-sm tracking-tight shadow-sm border border-transparent hover:border-white/20">
                         {board.title}
                     </h1>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleStarToggle}
                        className={cn(
                            "h-9 w-9 hover:bg-white/20 transition-all rounded-md",
                            board.is_starred ? "text-yellow-400 hover:text-yellow-300" : "text-white/80 hover:text-white"
                        )}
                      >
                        <Star className={cn("h-5 w-5", board.is_starred && "fill-current")} />
                      </Button>
                     <div className="h-6 w-[1px] bg-white/20"></div>
                     {/* Team members stack */}
                     <div className="flex -space-x-2 hover:space-x-0 transition-all duration-300">
                         {allMembers.slice(0, 3).map(u => (
                             <div key={u.id} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-transparent hover:border-white/50 hover:z-50 hover:scale-110 flex items-center justify-center text-xs font-bold text-slate-800 shadow-sm transition-all cursor-pointer" title={u.username}>
                                 {u.avatar_url ? <img src={u.avatar_url} className="h-full w-full object-cover rounded-full" /> : u.username?.[0]}
                             </div>
                         ))}
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30 ml-2 border border-white/10 hover:border-white/30 backdrop-blur-sm shadow-sm transition-all">
                             <UserPlus className="h-4 w-4" />
                         </Button>
                     </div>
                 </div>

                 <div className="flex items-center gap-3">
                     <div className="bg-black/20 backdrop-blur-sm rounded-md p-0.5 border border-white/10 shadow-inner">
                        <SearchBar 
                            searchQuery={filters.keyword}
                            onSearchChange={(q) => setFilters({...filters, keyword: q})}
                            filters={filters}
                            onFilterChange={setFilters}
                            labels={board.labels || []}
                            members={allMembers}
                            compact={true} 
                        />
                     </div>
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleBoardDelete(board.id)}
                        className="text-white/70 hover:text-red-200 hover:bg-red-500/20 font-medium px-3 h-9 rounded-md transition-colors"
                     >
                        Delete Board
                     </Button>
                 </div>
             </div>

            {/* Drag Drop Context */}
            <DragDropContext onDragEnd={onDragEnd}>
                 <Droppable droppableId="all-lists" direction="horizontal" type="list">
                    {(provided) => (
                        <div 
                             className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-6 items-start z-10"
                             ref={provided.innerRef}
                             {...provided.droppableProps}
                        >
                            {board.lists.map((list, index) => (
                                <List 
                                    key={list.id}
                                    list={{...list, cards: filterCards(list.cards)}}
                                    index={index}
                                    onCardClick={(cid, lTitle) => { setSelectedCardId(cid); setSelectedListTitle(lTitle); }}
                                    onCardAdd={handleCardAdd}
                                    onListDelete={handleListDelete}
                                    onListUpdate={handleListUpdate}
                                    onCardDelete={handleCardDelete}
                                    isDragDisabled={false} 
                                    labels={board.labels || []}
                                    members={allMembers}
                                />
                            ))}
                            {provided.placeholder}

                            {/* Add List Button */}
                            <div className="flex-shrink-0 w-72">
                                {isAddingList ? (
                                    <div className="bg-[#f1f2f4] rounded-xl p-2 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                        <Input 
                                            autoFocus
                                            value={newListTitle}
                                            onChange={(e) => setNewListTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                                            placeholder="Enter list title..."
                                            className="mb-2 h-9 border-blue-600 rounded-[3px] focus:ring-0"
                                        />
                                        <div className="flex gap-1">
                                            <Button onClick={handleAddList} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8">Add list</Button>
                                            <Button onClick={() => setIsAddingList(false)} variant="ghost" size="sm" className="text-slate-500 h-8 hover:bg-slate-300/50">
                                                <MoreHorizontal className="h-6 w-6" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={() => setIsAddingList(true)}
                                        className="w-full justify-start h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold shadow-sm border-none transition-all"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Add another list
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                 </Droppable>
            </DragDropContext>
        </div>

      {/* Card Modal */}
      {selectedCard && (
          <CardModal 
             card={selectedCard}
             labels={board.labels || []}
             members={allMembers}
             onClose={() => setSelectedCardId(null)}
             onUpdate={handleCardUpdate}
             onDelete={handleCardDelete}
             onRefresh={fetchBoard}
          />
      )}
    </div>
  );
};

export default Board;
