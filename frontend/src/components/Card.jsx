import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, CheckSquare, AlignLeft, Paperclip } from 'lucide-react';

const Card = ({ card, index, onClick, onDelete, isDragDisabled, labels = [], members = [] }) => {
  const cardLabels = labels.filter(l => card.labels?.some(cl => cl.id === l.id) || card.labels?.includes(l.id)); 
  const cardMembers = members.filter(m => card.members?.some(cm => cm.id === m.id) || card.members?.includes(m.id));

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
            className={`
                group relative bg-white rounded-lg p-3 shadow-sm 
                border border-slate-200 hover:border-indigo-300 hover:shadow-md
                transition-all duration-200 cursor-pointer select-none
                ${snapshot.isDragging ? 'rotate-2 shadow-2xl ring-2 ring-indigo-500 z-50 opacity-100 scale-105' : ''}
            `}
        >
             {/* Delete Action Hidden Group Hover */}
             <div 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-slate-100 rounded-full text-slate-300 hover:text-red-500 z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                title="Delete Card"
            >
                 <span className="text-sm font-bold block w-4 h-4 text-center leading-4">×</span>
             </div>

          {/* Labels */}
          {cardLabels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {cardLabels.map(label => (
                <div
                  key={label.id}
                  className="h-1.5 w-8 rounded-full transition-all duration-300 hover:h-5 hover:w-auto hover:px-2 hover:py-0.5 hover:text-[10px] text-transparent hover:text-white flex items-center justify-center font-bold uppercase tracking-wider cursor-help overflow-hidden"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                >
                    {label.name}
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <p className="text-sm font-medium text-slate-800 mb-2 leading-relaxed break-words pr-4">
              {card.title}
          </p>
          
          {/* Card Footer */}
          {(dueDate || totalChecklistItems > 0 || card.description || cardMembers.length > 0) && (
            <div className="flex items-center justify-between gap-2 pt-1 mt-1">
                <div className="flex items-center gap-2 flex-wrap text-slate-500">
                  {/* Due Date */}
                  {dueDate && (
                    <div
                      className={`flex items-center gap-1 p-0.5 px-1.5 rounded text-[10px] font-semibold transition-colors ${
                        isOverdue
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : isDueSoon
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
    
                  {/* Checklist */}
                  {totalChecklistItems > 0 && (
                    <div className={`flex items-center gap-1 p-0.5 px-1.5 rounded text-[10px] font-medium transition-colors ${
                        completedChecklistItems === totalChecklistItems 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                      <CheckSquare className="h-3 w-3" />
                      <span>{completedChecklistItems}/{totalChecklistItems}</span>
                    </div>
                  )}
    
                  {/* Description */}
                  {card.description && (
                    <div className="text-slate-400">
                      <AlignLeft className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
    
                {/* Members */}
                {cardMembers.length > 0 && (
                  <div className="flex -space-x-1.5 shrink-0 ml-auto pl-1">
                    {cardMembers.slice(0, 3).map(member => (
                      <div
                        key={member.id}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-1.5 ring-white shadow-sm overflow-hidden transition-transform hover:z-10 hover:scale-110"
                        style={{ backgroundColor: member.color || '#94a3b8' }}
                        title={member.username || member.name}
                      >
                        {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                        ) : (
                            (member.username?.[0] || 'U').toUpperCase()
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Card;
