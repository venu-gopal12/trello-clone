import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Textarea } from './ui/textarea';
import Card from './Card';

const List = ({ list, index, onCardClick, isDragDisabled, onCardAdd, onListDelete, onCardDelete, onListUpdate, labels = [], members = [] }) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onCardAdd(list.id, newCardTitle);
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };
  
  const handleTitleUpdate = () => {
    if (editedTitle.trim() && editedTitle !== list.title) {
        onListUpdate && onListUpdate(list.id, editedTitle);
    }
    setIsEditingTitle(false);
  };

  return (
     <Draggable draggableId={String(list.id)} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-72 flex flex-col max-h-full transition-transform duration-200"
          style={{ width: '272px' }}
        >
          <div 
            className={`bg-[#f1f2f4] rounded-xl flex flex-col max-h-full shadow-sm border border-white/40 transition-all duration-200 ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500 rotate-1 scale-105 z-50 bg-white' : 'hover:bg-[#f8f9fa]'}`}
            {...provided.dragHandleProps} 
          >
            {/* List Header */}
            <div className="p-3 pl-4 flex items-center justify-between cursor-grab active:cursor-grabbing group">
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleUpdate}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleUpdate()}
                  className="h-8 font-semibold bg-white border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm shadow-sm"
                />
              ) : (
                <h3
                  className="font-bold text-slate-700 text-sm flex-1 cursor-pointer truncate px-2 -ml-2 py-1 rounded-md hover:bg-slate-200/50 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {list.title}
                </h3>
              )}
              
               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                   <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-slate-500 hover:bg-slate-200 rounded-md"
                                onMouseDown={(e) => e.stopPropagation()} 
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-40 p-1">
                            <Button 
                                variant="ghost" 
                                className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 h-8 px-2 text-sm font-medium"
                                onClick={() => onListDelete(list.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete List
                            </Button>
                        </PopoverContent>
                   </Popover>
               </div>
            </div>

            {/* Cards Droppable Area */}
            <Droppable droppableId={String(list.id)} type="card" isDropDisabled={isDragDisabled}>
              {(provided, snapshot) => (
                <div 
                    className={`px-2 pb-2 flex-1 overflow-y-auto min-h-[10px] space-y-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent ${snapshot.isDraggingOver ? 'bg-blue-100/50' : ''}`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                >
                  {list.cards?.map((card, cardIndex) => (
                    <Card
                      key={card.id}
                      card={card}
                      index={cardIndex}
                      labels={labels}
                      members={members}
                      onClick={() => onCardClick(card.id, list.title)}
                      onDelete={() => onCardDelete(card.id)}
                      isDragDisabled={isDragDisabled}
                    />
                  ))}
                  {provided.placeholder}

                  {/* Add Card Form */}
                  {isAddingCard && (
                    <div className="bg-white rounded-lg p-2 shadow-sm border border-transparent">
                      <Textarea
                        autoFocus
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddCard()}
                        placeholder="Enter a title for this card..."
                        className="mb-2 min-h-[60px] resize-none text-sm border-none shadow-none focus:ring-0 p-0 placeholder:text-slate-400"
                      />
                    </div>
                  )}
                </div>
              )}
            </Droppable>

             {/* Add Card Button (Footer) */}
             <div className="p-2 pt-0">
               {isAddingCard ? (
                 <div className="flex gap-1 items-center">
                    <Button onClick={handleAddCard} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8">
                      Add card
                    </Button>
                    <Button onClick={() => setIsAddingCard(false)} variant="ghost" size="icon" className="text-slate-500 h-8 w-8 hover:bg-slate-200">
                      <XIcon className="h-5 w-5" />
                    </Button>
                 </div>
               ) : (
                <Button
                  onClick={() => setIsAddingCard(true)}
                  variant="ghost"
                  className="w-full justify-start text-slate-500 hover:bg-slate-200 hover:text-slate-700 font-medium transition-all h-9"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add a card
                </Button>
               )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const XIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default List;
