import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';

const SearchBar = ({ searchQuery, onSearchChange, filters, onFilterChange, labels, members }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3 max-w-4xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search cards..."
            className="pl-10"
          />
        </div>

        {/* Filter by Labels */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Labels
              {filters.labels.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{filters.labels.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm mb-3">Filter by Labels</h4>
              {labels.map(label => (
                <div
                  key={label.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                    filters.labels.includes(label.id) ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => {
                    const newLabels = filters.labels.includes(label.id)
                      ? filters.labels.filter(id => id !== label.id)
                      : [...filters.labels, label.id];
                    onFilterChange({ ...filters, labels: newLabels });
                  }}
                >
                  <div
                    className="h-6 w-12 rounded"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm flex-1">{label.name}</span>
                  {filters.labels.includes(label.id) && (
                    <X className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              ))}
              {filters.labels.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onFilterChange({ ...filters, labels: [] })}
                >
                  Clear All
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filter by Members */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Members
              {filters.members.length > 0 && (
                <Badge className="ml-2 bg-blue-600">{filters.members.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm mb-3">Filter by Members</h4>
              {members.map(member => (
                <div
                  key={member.id}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                    filters.members.includes(member.id) ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => {
                    const newMembers = filters.members.includes(member.id)
                      ? filters.members.filter(id => id !== member.id)
                      : [...filters.members, member.id];
                    onFilterChange({ ...filters, members: newMembers });
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar}
                  </div>
                  <span className="text-sm flex-1">{member.name}</span>
                  {filters.members.includes(member.id) && (
                    <X className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              ))}
              {filters.members.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onFilterChange({ ...filters, members: [] })}
                >
                  Clear All
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Filter by Due Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Due Date
              {filters.dueDateFilter && (
                <Badge className="ml-2 bg-blue-600">1</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm mb-3">Filter by Due Date</h4>
              {['overdue', 'due-soon', 'due-later', 'no-due-date'].map(filter => (
                <div
                  key={filter}
                  className={`p-2 rounded cursor-pointer hover:bg-gray-100 text-sm ${
                    filters.dueDateFilter === filter ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => {
                    const newFilter = filters.dueDateFilter === filter ? null : filter;
                    onFilterChange({ ...filters, dueDateFilter: newFilter });
                  }}
                >
                  {filter === 'overdue' && 'Overdue'}
                  {filter === 'due-soon' && 'Due Soon (3 days)'}
                  {filter === 'due-later' && 'Due Later'}
                  {filter === 'no-due-date' && 'No Due Date'}
                </div>
              ))}
              {filters.dueDateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onFilterChange({ ...filters, dueDateFilter: null })}
                >
                  Clear
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear All Filters */}
        {(filters.labels.length > 0 || filters.members.length > 0 || filters.dueDateFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({ labels: [], members: [], dueDateFilter: null })}
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
