import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import Card from './Card';

const List = ({ list, index, onCardClick, isDragDisabled, onCardAdd, onListDelete, onCardDelete, labels = [], members = [] }) => {
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
  
  // Placeholder for title update logic, user ref code had it, so defining stub
  // My Board.jsx doesn't pass onUpdateList, so this is visual only for now
  const handleTitleUpdate = () => {
    // if (editedTitle.trim() !== list.title) onUpdateList({...list, title: editedTitle})
    setIsEditingTitle(false);
  };

  return (
     <Draggable draggableId={String(list.id)} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-72 flex flex-col max-h-full mr-4"
        >
          <div 
            className="bg-gray-100 rounded-lg shadow-sm flex flex-col max-h-full border border-gray-200"
            {...provided.dragHandleProps} 
          >
            {/* List Header */}
            <div className="p-3 flex items-center justify-between cursor-grab active:cursor-grabbing">
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleUpdate}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleUpdate()}
                  className="h-8 font-semibold"
                />
              ) : (
                <h3
                  className="font-semibold text-gray-800 flex-1 cursor-pointer truncate px-1"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {list.title}
                </h3>
              )}
              
              {/* Delete List Button */}
               <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-red-600 ml-1"
                onMouseDown={(e) => e.stopPropagation()} // Stop drag
                onClick={(e) => {
                    e.stopPropagation();
                    onListDelete(list.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Cards Droppable Area */}
            <Droppable droppableId={String(list.id)} type="card" isDropDisabled={isDragDisabled}>
              {(provided, snapshot) => (
                <div 
                    className={`px-2 pb-2 flex-1 overflow-y-auto min-h-[10px] space-y-2 ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
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
                    <div className="bg-white rounded-lg p-2 shadow-sm border border-blue-200">
                      <Textarea
                        autoFocus
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddCard()}
                        placeholder="Enter title..."
                        className="mb-2 min-h-[60px] resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleAddCard} size="sm">
                          Add Card
                        </Button>
                        <Button onClick={() => setIsAddingCard(false)} variant="ghost" size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Droppable>

            {/* Add Card Button */}
            {!isAddingCard && (
              <div className="p-2">
                <Button
                  onClick={() => setIsAddingCard(true)}
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add a card
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default List;
