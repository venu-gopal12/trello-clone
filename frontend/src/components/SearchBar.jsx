import React from 'react';
import { Search, X, Check, Filter } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

const SearchBar = ({ searchQuery, onSearchChange, filters, onFilterChange, labels, members, compact = false }) => {
  // Styles for transparent/dark background (Board View) vs light background (Dashboard)
  const containerClass = compact ? '' : 'bg-white border-b border-slate-200 px-4 py-3';
  const inputWrapperClass = compact ? 'w-48 xl:w-64 transition-all duration-300 focus-within:w-64 xl:focus-within:w-80' : 'w-72';
  
  // When compact (on board), text should be white-ish, input background transparent-white
  const inputClass = compact 
    ? "pl-8 h-9 text-sm bg-white/20 border-transparent text-white placeholder:text-white/70 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 transition-all rounded-md"
    : "pl-8 h-9 text-sm bg-slate-100/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all rounded-md";

  const searchIconClass = compact ? "text-white/70" : "text-slate-400";
  
  // Buttons on board should be white text, hover white bg with dark text
  const buttonVariant = compact ? "ghost" : "ghost";
  const buttonClass = (isActive) => cn(
      "h-9 px-2 text-xs font-medium transition-colors",
      compact 
        ? (isActive ? "bg-white/20 text-white" : "text-white hover:bg-white/20")
        : (isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50")
  );

  return (
    <div className={`flex items-center gap-2 ${containerClass}`}>
      {/* Search Input */}
      <div className={`relative ${inputWrapperClass}`}>
        <Search className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 pointer-events-none ${searchIconClass}`} />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className={inputClass}
        />
        {searchQuery && (
            <button 
                onClick={() => onSearchChange('')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 hover:text-slate-600 ${compact ? 'text-white/70 hover:text-white' : 'text-slate-400'}`}
            >
                <X className="h-3 w-3" />
            </button>
        )}
      </div>

      <div className={`h-5 w-[1px] mx-1 ${compact ? 'bg-white/30' : 'bg-slate-200'}`}></div>

      {/* Filter by Labels */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={buttonVariant}
            size="sm" 
            className={buttonClass(filters.labels.length > 0)}
          >
            <span>Labels</span>
            {filters.labels.length > 0 && (
              <Badge className={`ml-1.5 h-4 px-1 text-[9px] ${compact ? 'bg-white text-blue-700 hover:bg-white' : 'bg-indigo-600 text-white'}`}>
                  {filters.labels.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Filter by Labels</h4>
            {labels.map(label => (
              <div
                key={label.id}
                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${
                  filters.labels.includes(label.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
                onClick={() => {
                  const newLabels = filters.labels.includes(label.id)
                    ? filters.labels.filter(id => id !== label.id)
                    : [...filters.labels, label.id];
                  onFilterChange({ ...filters, labels: newLabels });
                }}
              >
                <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                />
                <span className="text-sm text-slate-700 flex-1 truncate">{label.name}</span>
                {filters.labels.includes(label.id) && (
                  <Check className="h-3.5 w-3.5 text-indigo-600" />
                )}
              </div>
            ))}
            {filters.labels.length > 0 && (
               <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7 mt-2 text-slate-500"
                onClick={() => onFilterChange({ ...filters, labels: [] })}
              >
                Clear selection
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Filter by Members */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={buttonVariant}
            size="sm" 
            className={buttonClass(filters.members.length > 0)}
          >
            <span>Members</span>
            {filters.members.length > 0 && (
              <Badge className={`ml-1.5 h-4 px-1 text-[9px] ${compact ? 'bg-white text-blue-700 hover:bg-white' : 'bg-indigo-600 text-white'}`}>
                  {filters.members.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Filter by Members</h4>
            {members.map(member => (
              <div
                key={member.id}
                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${
                  filters.members.includes(member.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'
                }`}
                onClick={() => {
                  const newMembers = filters.members.includes(member.id)
                    ? filters.members.filter(id => id !== member.id)
                    : [...filters.members, member.id];
                  onFilterChange({ ...filters, members: newMembers });
                }}
              >
                 <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: member.color || '#94a3b8' }}
                  >
                    {member.username?.[0]?.toUpperCase()}
                  </div>
                <span className="text-sm text-slate-700 flex-1 truncate">{member.name || member.username}</span>
                {filters.members.includes(member.id) && (
                  <Check className="h-3.5 w-3.5 text-indigo-600" />
                )}
              </div>
            ))}
             {filters.members.length > 0 && (
               <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs h-7 mt-2 text-slate-500"
                onClick={() => onFilterChange({ ...filters, members: [] })}
              >
                Clear selection
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
       {/* Filter by Due Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className={`h-9 w-9 ${compact ? (filters.dueDateFilter ? 'bg-white/20 text-white' : 'text-white hover:bg-white/20') : (filters.dueDateFilter ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600')}`}>
               <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2 px-1">Due Date</h4>
              {['overdue', 'due-soon', 'due-later', 'no-due-date'].map(filter => (
                <div
                  key={filter}
                  className={`flex items-center p-1.5 rounded-md cursor-pointer text-sm ${
                    filters.dueDateFilter === filter ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    const newFilter = filters.dueDateFilter === filter ? null : filter;
                    onFilterChange({ ...filters, dueDateFilter: newFilter });
                  }}
                >
                  <span className="flex-1">
                      {filter === 'overdue' && 'Overdue'}
                      {filter === 'due-soon' && 'Due Soon (<3 days)'}
                      {filter === 'due-later' && 'Due Later'}
                      {filter === 'no-due-date' && 'No Due Date'}
                   </span>
                   {filters.dueDateFilter === filter && <Check className="h-3.5 w-3.5" />}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

      {/* Clear All Filters */}
      {(filters.labels.length > 0 || filters.members.length > 0 || filters.dueDateFilter) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange({ ...filters, labels: [], members: [], dueDateFilter: null })}
          className={`text-xs h-9 px-2 ${compact ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-slate-400 hover:text-red-500'}`}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
};

export default SearchBar;
