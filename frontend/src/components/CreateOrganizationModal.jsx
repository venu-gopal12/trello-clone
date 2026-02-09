import React, { useState } from 'react';
import { useOrganization } from '../context/OrganizationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PlusCircle } from 'lucide-react';

const CreateOrganizationModal = ({ children, trigger }) => {
  const { createOrganization } = useOrganization();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    
    setIsLoading(true);
    try {
      const finalSlug = slug || name.toLowerCase().replace(/\s+/g, '-');
      await createOrganization({ name, slug: finalSlug });
      setOpen(false);
      setName('');
      setSlug('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Organization Name</label>
            <Input 
              placeholder="acme-inc" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Slug (Optional)</label>
            <Input 
              placeholder="acme" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">Unique identifier for your organization workspace.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrganizationModal;
