import React, { useState } from 'react';
import { X, CreditCard, AlignLeft, CheckSquare, Clock, Tag, Users, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';

const CardModal = ({ card, labels, members, onClose, onUpdate }) => {
  const [editedCard, setEditedCard] = useState({ 
    ...card, 
    // Ensure we work with IDs internally for easy toggling
    members: card.members?.map(m => typeof m === 'object' ? m.id : m) || [],
    labels: card.labels?.map(l => typeof l === 'object' ? l.id : l) || []
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const cardLabels = labels.filter(l => editedCard.labels?.includes(l.id));
  const cardMembers = members.filter(m => editedCard.members?.includes(m.id));

  const handleUpdate = (updates) => {
    const updated = { ...editedCard, ...updates };
    setEditedCard(updated);
    onUpdate(updated);
  };

  const toggleLabel = (labelId) => {
    const newLabels = editedCard.labels?.includes(labelId)
      ? editedCard.labels.filter(id => id !== labelId)
      : [...(editedCard.labels || []), labelId];
    handleUpdate({ labels: newLabels });
  };

  const toggleMember = (memberId) => {
    const newMembers = editedCard.members?.includes(memberId)
      ? editedCard.members.filter(id => id !== memberId)
      : [...(editedCard.members || []), memberId];
    handleUpdate({ members: newMembers });
  };

  const addChecklist = () => {
    const newChecklist = {
      id: `ch${Date.now()}`,
      title: 'Checklist',
      items: [],
    };
    handleUpdate({ checklists: [...(editedCard.checklists || []), newChecklist] });
  };

  const addChecklistItem = (checklistId) => {
    if (!newChecklistItem.trim()) return;
    
    const updatedChecklists = editedCard.checklists.map(cl => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          items: [...cl.items, { id: `chi${Date.now()}`, text: newChecklistItem, completed: false }],
        };
      }
      return cl;
    });
    handleUpdate({ checklists: updatedChecklists });
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (checklistId, itemId) => {
    const updatedChecklists = editedCard.checklists.map(cl => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          items: cl.items.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return cl;
    });
    handleUpdate({ checklists: updatedChecklists });
  };

  const deleteChecklistItem = (checklistId, itemId) => {
    const updatedChecklists = editedCard.checklists.map(cl => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          items: cl.items.filter(item => item.id !== itemId),
        };
      }
      return cl;
    });
    handleUpdate({ checklists: updatedChecklists });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="pr-8">
          {/* Card Icon & Title */}
          <div className="flex items-start gap-3 mb-6">
            <CreditCard className="h-6 w-6 text-gray-600 mt-1" />
            <div className="flex-1">
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={editedCard.title}
                  onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                  onBlur={() => {
                    handleUpdate({ title: editedCard.title });
                    setIsEditingTitle(false);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdate({ title: editedCard.title });
                      setIsEditingTitle(false);
                    }
                  }}
                  className="text-xl font-semibold"
                />
              ) : (
                <h2
                  className="text-xl font-semibold cursor-pointer hover:bg-gray-100 p-2 -ml-2 rounded"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {editedCard.title}
                </h2>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6">
              {/* Labels */}
              {cardLabels.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Labels
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cardLabels.map(label => (
                      <Badge
                        key={label.id}
                        className="text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {cardMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Members
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {cardMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.avatar}
                        </div>
                        <span className="text-sm">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due Date */}
              {editedCard.dueDate && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Due Date
                  </h3>
                  <Badge variant="outline">
                    {format(new Date(editedCard.dueDate), 'MMM dd, yyyy')}
                  </Badge>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <AlignLeft className="h-4 w-4" />
                  Description
                </h3>
                {isEditingDescription ? (
                  <div>
                    <Textarea
                      autoFocus
                      value={editedCard.description}
                      onChange={(e) => setEditedCard({ ...editedCard, description: e.target.value })}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={() => {
                          handleUpdate({ description: editedCard.description });
                          setIsEditingDescription(false);
                        }}
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setIsEditingDescription(false)}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="min-h-[60px] p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {editedCard.description || 'Add a more detailed description...'}
                  </div>
                )}
              </div>

              {/* Checklists */}
              {editedCard.checklists?.map(checklist => {
                const total = checklist.items.length;
                const completed = checklist.items.filter(i => i.completed).length;
                const progress = total > 0 ? (completed / total) * 100 : 0;

                return (
                  <div key={checklist.id}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      {checklist.title}
                    </h3>
                    {total > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {checklist.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem(checklist.id, item.id)}
                          />
                          <span
                            className={`flex-1 text-sm ${
                              item.completed ? 'line-through text-gray-500' : 'text-gray-800'
                            }`}
                          >
                            {item.text}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteChecklistItem(checklist.id, item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addChecklistItem(checklist.id)}
                        placeholder="Add an item"
                        className="flex-1"
                      />
                      <Button onClick={() => addChecklistItem(checklist.id)} size="sm">
                        Add
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Actions */}
            <div className="w-40 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">ADD TO CARD</h4>
              
              {/* Labels Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Tag className="h-4 w-4 mr-2" />
                    Labels
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Labels</h4>
                    {labels.map(label => (
                      <div
                        key={label.id}
                        className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleLabel(label.id)}
                      >
                        <Checkbox checked={editedCard.labels?.includes(label.id)} />
                        <div
                          className="h-6 flex-1 rounded"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm">{label.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Members Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Members
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Members</h4>
                    {members.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleMember(member.id)}
                      >
                        <Checkbox checked={editedCard.members?.includes(member.id)} />
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.avatar}
                        </div>
                        <span className="text-sm">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Due Date Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Due Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editedCard.dueDate ? new Date(editedCard.dueDate) : undefined}
                    onSelect={(date) => handleUpdate({ dueDate: date ? date.toISOString().split('T')[0] : null })}
                  />
                </PopoverContent>
              </Popover>

              {/* Checklist */}
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
                onClick={addChecklist}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Checklist
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardModal;
