import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Star, MoreHorizontal, Loader } from 'lucide-react';
import api from '../services/api';
import List from '../components/List';
import CardModal from '../components/CardModal'; // Our new modal
import SearchBar from '../components/SearchBar'; // Our new top bar
import Sidebar from '../components/Sidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

const Board = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [boards, setBoards] = useState([]); // For Sidebar

  // Search & Filter State
  const [filters, setFilters] = useState({
      keyword: '',
      labels: [], // Array of label IDs
      members: [], // Array of member IDs
      dueDateFilter: null // 'overdue', 'due-soon', etc.
  });

  // Modal State
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedListTitle, setSelectedListTitle] = useState('');

  // Add List State
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  useEffect(() => {
    fetchBoard();
    fetchBoards();
  }, [id]);

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/boards/${id}`);
      // Sort lists/cards
      data.lists.sort((a, b) => a.position - b.position);
      data.lists.forEach(list => {
        if (list.cards) list.cards.sort((a, b) => a.position - b.position);
      });
      setBoard(data);
    } catch (error) {
      console.error('Failed to fetch board', error);
      // Redirect or show error
    }
  };
  
  const fetchBoards = async () => {
      try {
          const { data } = await api.get('/boards');
          setBoards(data);
      } catch (error) {
          console.error('Failed to fetch boards', error);
      }
  };

  const [allMembers, setAllMembers] = useState([]);
  useEffect(() => {
    fetchUsers();
  }, []);

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
          // Keyword (Search)
          if (filters.keyword && !card.title.toLowerCase().includes(filters.keyword.toLowerCase())) {
              return false;
          }
          // Labels
          if (filters.labels.length > 0) {
              const cardLabelIds = card.labels?.map(l => l.id) || [];
              const hasLabel = filters.labels.some(id => cardLabelIds.includes(id));
              if (!hasLabel) return false;
          }
          // Members
          if (filters.members.length > 0) {
               const cardMemberIds = card.members?.map(m => m.id) || [];
              const hasMember = filters.members.some(id => cardMemberIds.includes(id));
              if (!hasMember) return false;
          }
          // Due Date
          if (filters.dueDateFilter) {
               if (filters.dueDateFilter === 'no-due-date') {
                   if (card.due_date) return false;
               } else {
                   if (!card.due_date) return false;
                   const due = new Date(card.due_date);
                   const now = new Date();
                   const diffDays = (due - now) / (1000 * 60 * 60 * 24);

                   if (filters.dueDateFilter === 'overdue' && due >= now) return false;
                   if (filters.dueDateFilter === 'due-soon' && (diffDays < 0 || diffDays > 3)) return false;
                   if (filters.dueDateFilter === 'due-later' && diffDays <= 3) return false;
               }
          }
          return true;
      });
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
       
       // Calc Position
       const prev = newLists[destination.index - 1];
       const next = newLists[destination.index + 1];
       const posPrev = prev ? prev.position : 0;
       const posNext = next ? next.position : (prev ? prev.position + 131070 : 65535);
       const newPos = (posPrev + posNext) / 2;
       
       try {
           await api.put(`/lists/${draggableId}`, { position: newPos });
       } catch (e) {
           console.error("Move list failed", e);
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
        const posNext = next ? next.position : (prev ? prev.position + 10000 : 200000); // simplified fallback
        const newPos = (posPrev + posNext) / 2;

        try {
            await api.put(`/cards/${draggableId}`, { position: newPos, list_id: sourceList.id });
        } catch (e) { console.error("Move card failed", e); }
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
        } catch (e) { console.error("Move card failed", e); }
    }
  };

  // --- Actions ---
  const handleAddList = async () => {
      if (!newListTitle.trim()) return;
      try {
          await api.post('/lists', { board_id: id, title: newListTitle });
          setNewListTitle('');
          setIsAddingList(false);
          fetchBoard();
      } catch (e) { console.error(e); }
  };
  
  const handleListDelete = async (listId) => {
      if (confirm("Delete list?")) {
        try {
            await api.delete(`/lists/${listId}`);
            fetchBoard();
        } catch (e) { console.error(e); }
      }
  };

  const handleCardAdd = async (listId, title) => {
      try {
          await api.post('/cards', { list_id: listId, title, position: 65535 });
          fetchBoard();
      } catch (e) { console.error(e); }
  };
  
  const handleCardDelete = async (cardId) => {
      if (confirm("Delete card?")) {
          try {
              await api.delete(`/cards/${cardId}`);
              setSelectedCardId(null);
              fetchBoard();
          } catch(e) { console.error(e); }
      }
  };

  const handleCreateBoard = async (newBoard) => {
      try {
        const payload = { 
            title: newBoard.title, 
        };
        // Fix: Backend has varchar(20) limit for color, but TEXT for image.
        // Send gradients as background_image strings.
        if (newBoard.background && newBoard.background.includes('gradient')) {
             payload.background_image = newBoard.background;
             payload.background_color = '#0079bf'; // Default fallback
        } else {
             payload.background_color = newBoard.background || '#0079bf';
        }

        const { data } = await api.post('/boards', payload);
        navigate(`/board/${data.id}`);
      } catch(e) { 
          console.error("Create board failed", e); 
          alert("Failed to create board. Please try again.");
      }
  };
  
  const handleCardUpdate = async (updatedCard) => {
      try {
          // 1. Basic Update (Title, Description, Due Date)
          const payload = {
              title: updatedCard.title,
              description: updatedCard.description,
              due_date: updatedCard.dueDate || updatedCard.due_date,
          };
          await api.put(`/cards/${updatedCard.id}`, payload);

          // 2. Member Updates (Diffing)
          // Find original card to compare members
          const originalCard = board.lists
            .flatMap(l => l.cards)
            .find(c => c.id === updatedCard.id);

          if (originalCard && updatedCard.members) {
              const oldMemberIds = originalCard.members.map(m => m.id);
              const newMemberIds = updatedCard.members; // CardModal passes array of IDs now? Or objects? 
              // Wait, CardModal passes `members` as array of ID's probably? 
              // Let's check CardModal.jsx... 
              // CardModal uses `editedCard.members` which stores IDs (toggleMember logic).
              // BUT it passes `labels` and `members` as PROPS to CardModal.
              // `editedCard` state tracks IDs.
              
              // Let's ensure we are treating newMemberIds as IDs.
              const validNewMemberIds = newMemberIds.map(m => typeof m === 'object' ? m.id : m);

              // Add missing members
              const toAdd = validNewMemberIds.filter(id => !oldMemberIds.includes(id));
              for (const memberId of toAdd) {
                  await api.post(`/cards/${updatedCard.id}/members`, { user_id: memberId });
              }

              // Remove extra members
              const toRemove = oldMemberIds.filter(id => !validNewMemberIds.includes(id));
              for (const memberId of toRemove) {
                  await api.delete(`/cards/${updatedCard.id}/members/${memberId}`);
              }
          }

          // 3. Label Updates (Diffing)
          if (originalCard && updatedCard.labels) {
              const oldLabelIds = originalCard.labels.map(l => l.id);
              const newLabelIds = updatedCard.labels;
              
              const validNewLabelIds = newLabelIds.map(l => typeof l === 'object' ? l.id : l);

              // Add missing labels
              const toAddLabels = validNewLabelIds.filter(id => !oldLabelIds.includes(id));
              for (const labelId of toAddLabels) {
                  await api.post(`/cards/${updatedCard.id}/labels`, { label_id: labelId });
              }

              // Remove extra labels
              const toRemoveLabels = oldLabelIds.filter(id => !validNewLabelIds.includes(id));
              for (const labelId of toRemoveLabels) {
                  await api.delete(`/cards/${updatedCard.id}/labels/${labelId}`);
              }
          }

          fetchBoard(); 
      } catch(e) { console.error(e); }
  };
  
  const handleBoardDelete = async (boardId) => {
      if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
          try {
              await api.delete(`/boards/${boardId}`);
              navigate('/'); // Return to dashboard/home
          } catch (error) {
              console.error('Failed to delete board', error);
              alert('Failed to delete board.');
          }
      }
  };

  if (!board) return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;

  const selectedCard = selectedCardId 
    ? board.lists.flatMap(l => l.cards).find(c => c.id === selectedCardId) 
    : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Sidebar - Fixed or Flex? User code was flex-col h-screen for board, Sidebar fixed. Pattern: Side rail + Content */}
      <Sidebar 
        boards={boards} 
        activeBoard={board} 
        onSelectBoard={(boardId) => navigate(`/board/${boardId}`)}
        onCreateBoard={handleCreateBoard}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area - Shifted by Sidebar Width */}
      <div 
        className={`flex-1 flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}
      >
        {/* Top/Search Bar */}
        <SearchBar 
            searchQuery={filters.keyword}
            onSearchChange={(q) => setFilters({...filters, keyword: q})}
            filters={filters}
            onFilterChange={setFilters}
            labels={board.labels || []}
            members={allMembers}
        />

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
             {/* Board Header (White text on board bg) */}
             <div className="flex items-center justify-between px-4 py-3 text-white bg-black/10 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold drop-shadow-md">{board.title}</h1>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Star className={`h-5 w-5`} />
                </Button>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 bg-white text-gray-800 border-gray-200">
                    <div className="space-y-1">
                        <h4 className="font-semibold text-sm px-2 py-1.5 border-b mb-1">Board Menu</h4>
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleBoardDelete(board.id)}
                        >
                            Delete Board
                        </Button>
                    </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Drag Drop Context */}
            <DragDropContext onDragEnd={onDragEnd}>
                 <Droppable droppableId="all-lists" direction="horizontal" type="list">
                    {(provided) => (
                        <div 
                             className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 items-start"
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
                                    onCardDelete={handleCardDelete}
                                    isDragDisabled={false} // filter logic handled in map
                                    labels={board.labels || []}
                                    members={allMembers}
                                />
                            ))}
                            {provided.placeholder}

                            {/* Add List Button */}
                            <div className="flex-shrink-0 w-72">
                                {isAddingList ? (
                                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                                        <Input 
                                            autoFocus
                                            value={newListTitle}
                                            onChange={(e) => setNewListTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
                                            placeholder="Enter list title..."
                                            className="mb-2"
                                        />
                                        <div className="flex gap-2">
                                            <Button onClick={handleAddList} size="sm">Add List</Button>
                                            <Button onClick={() => setIsAddingList(false)} variant="ghost" size="sm">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={() => setIsAddingList(true)}
                                        className="w-full justify-start bg-white/20 hover:bg-white/30 text-white font-medium backdrop-blur-sm"
                                    >
                                        + Add another list
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                 </Droppable>
            </DragDropContext>
        </div>
      </div>

      {/* Card Modal */}
      {selectedCard && (
          <CardModal 
             card={selectedCard}
             labels={board.labels || []}
             members={allMembers}
             onClose={() => setSelectedCardId(null)}
             onUpdate={handleCardUpdate}
          />
      )}
    </div>
  );
};

export default Board;
