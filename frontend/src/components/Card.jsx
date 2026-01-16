import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, CheckSquare, MessageSquare } from 'lucide-react';

// Adapted from User's Reference to use hello-pangea/dnd instead of dnd-kit
const Card = ({ card, index, onClick, onDelete, isDragDisabled, labels = [], members = [] }) => {
  const cardLabels = labels.filter(l => card.labels?.some(cl => cl.id === l.id) || card.labels?.includes(l.id)); // Handle both object array or ID array
  const cardMembers = members.filter(m => card.members?.some(cm => cm.id === m.id) || card.members?.includes(m.id));

  // Handle potential data mismatch (backend snake_case vs user camelCase)
  const checklists = card.checklists || []; 
  const totalChecklistItems = checklists.reduce((acc, cl) => acc + (cl.items?.length || 0), 0);
  const completedChecklistItems = checklists.reduce(
    (acc, cl) => acc + (cl.items?.filter(i => i.completed)?.length || 0), 0
  );

  const dueDate = card.due_date || card.dueDate;
  const isDueSoon = dueDate && new Date(dueDate) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const isOverdue = dueDate && new Date(dueDate) < new Date();

  return (
    <Draggable draggableId={String(card.id)} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={onClick}
            style={{ ...provided.draggableProps.style }}
            className={`bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-blue-500/20 group relative mb-2 ${
                snapshot.isDragging ? 'opacity-50 rotate-3' : ''
            }`}
        >
             {/* Delete Button (Custom addition to match previous functionality) */}
             <div 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
             >
                 <span className="text-xl leading-none">×</span>
             </div>

          {/* Labels */}
          {cardLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {cardLabels.map(label => (
                <div
                  key={label.id}
                  className="h-2 w-10 rounded-full"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                />
              ))}
            </div>
          )}

          {/* Title */}
          <p className="text-sm text-gray-800 mb-2 pr-4 break-words">{card.title}</p>

          {/* Card Footer */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Due Date */}
              {dueDate && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded ${
                    isOverdue
                      ? 'bg-red-100 text-red-700'
                      : isDueSoon
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  <span>{new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              )}

              {/* Checklist Progress */}
              {totalChecklistItems > 0 && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded ${
                    completedChecklistItems === totalChecklistItems
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <CheckSquare className="h-3 w-3" />
                  <span>{completedChecklistItems}/{totalChecklistItems}</span>
                </div>
              )}

              {/* Description Indicator */}
              {card.description && (
                <div className="flex items-center text-gray-500">
                  <MessageSquare className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Members */}
            {cardMembers.length > 0 && (
              <div className="flex -space-x-2 ml-auto">
                {cardMembers.slice(0, 3).map(member => (
                  <div
                    key={member.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ring-2 ring-white"
                    style={{ backgroundColor: member.color || '#ccc' }}
                    title={member.username || member.name}
                  >
                    {member.avatar_url ? <img src={member.avatar_url} className="w-full h-full rounded-full" /> : (member.username?.[0] || 'U')}
                  </div>
                ))}
                {cardMembers.length > 3 && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-300 text-gray-700 ring-2 ring-white">
                    +{cardMembers.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Card;
