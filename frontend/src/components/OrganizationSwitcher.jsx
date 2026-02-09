import React from 'react';
import { useOrganization } from '../context/OrganizationContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from "@/components/ui/select" 
import { PlusCircle, Building2, Check } from 'lucide-react';
import { Button } from './ui/button'; 
import CreateOrganizationModal from './CreateOrganizationModal';

const OrganizationSwitcher = () => {
  const { organizations, currentOrganization, setCurrentOrganization } = useOrganization();
  const navigate = useNavigate();
  const location = useLocation();

  const handleOrganizationChange = (val) => {
    console.log('Organization change triggered:', val, 'Current path:', location.pathname);
    if (val === 'create_new') return;
    const org = organizations.find(o => o.id.toString() === val);
    if (org) {
      console.log('Switching to organization:', org.name, 'Current path:', location.pathname);
      setCurrentOrganization(org);
      
      // If user is on a board page, redirect to dashboard
      if (location.pathname.startsWith('/board/')) {
        console.log('Redirecting from board to dashboard');
        navigate('/');
      }
    }
  };

  // If no orgs, show big create button
  if (!currentOrganization && organizations.length === 0) {
    return (
      <CreateOrganizationModal>
        <Button variant="outline" className="w-full justify-start border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </CreateOrganizationModal>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 w-full">
         <Select 
            value={currentOrganization?.id?.toString()} 
            onValueChange={handleOrganizationChange}
         >
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2 text-left truncate">
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    {currentOrganization?.logo_url ? (
                        <img src={currentOrganization.logo_url} className="h-full w-full object-cover" />
                    ) : (
                        <Building2 className="h-3 w-3 text-primary" />
                    )}
                </div>
                <span className="truncate flex-1 font-medium">{currentOrganization?.name || "Select Organization"}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
               <SelectLabel>Organizations</SelectLabel>
               {organizations.map(org => (
                 <SelectItem key={org.id} value={org.id.toString()}>
                   <div className="flex items-center gap-2">
                       <span className="font-medium">{org.name}</span>
                       {/* <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">({org.slug})</span> */}
                   </div>
                 </SelectItem>
               ))}
            </SelectGroup>
            <SelectSeparator />
            <div className="p-1">
                <CreateOrganizationModal>
                    <Button variant="ghost" size="sm" className="w-full justify-start font-normal">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Organization
                    </Button>
                </CreateOrganizationModal>
            </div>
          </SelectContent>
        </Select>
    </div>
  );
};

export default OrganizationSwitcher;
