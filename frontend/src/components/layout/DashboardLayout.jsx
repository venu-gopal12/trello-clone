import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useOrganization } from '../../context/OrganizationContext';
import CreateOrganizationModal from '../CreateOrganizationModal';
import { getUser, logout } from '../../lib/auth';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Layout, 
  Settings, 
  Activity, 
  Menu, 
  CreditCard,
  Plus,
  ChevronDown,
  Building2,
  PlusCircle,
  LogOut
} from 'lucide-react';
import { Button } from '../ui/button'; 
import { cn } from '../../lib/utils'; 

const SidebarItem = ({ icon: Icon, label, to, active, onClick, className }) => {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 text-[13px] font-medium cursor-pointer group select-none",
        active 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        className
      )}
      onClick={onClick}
    >
      {Icon && <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />}
      {label}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
};

const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { organizations, currentOrganization, setCurrentOrganization } = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();
  // const [workspaceOpen, setWorkspaceOpen] = useState(true); // Removed as we use nested structure now
  const [orgsOpen, setOrgsOpen] = useState(true);

  const handleOrgSelect = (org) => {
      console.log('Organization selected:', org.name, 'Current path:', location.pathname);
      setCurrentOrganization(org);
      
      // If user is on a board page, redirect to dashboard
      if (location.pathname.startsWith('/board/')) {
        console.log('Redirecting from board to dashboard');
        navigate('/');
      }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Sidebar Header */}
      <div className="p-4 h-16 flex items-center border-b border-slate-100 px-6">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-600 tracking-tight">
             <Layout className="h-6 w-6 fill-current" />
             Trello
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        
        {/* Organizations List */}
        <div className="space-y-3">
             <div className="flex items-center justify-between w-full px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                 <span>Organizations</span>
                 <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-slate-100 rounded text-slate-400">
                    <Plus className="h-3 w-3" />
                 </Button>
             </div>
             
             <div className="space-y-1">
                {organizations.map(org => {
                    const isSelected = currentOrganization?.id === org.id;
                    return (
                        <div key={org.id} className="space-y-1 group">
                             {/* Organization Header Item */}
                            <SidebarItem
                                icon={null}
                                label={
                                    <div className="flex items-center gap-3 w-full">
                                        <div className={cn(
                                            "h-6 w-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm",
                                            isSelected ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white border border-slate-200 text-slate-500 group-hover:border-indigo-300"
                                        )}>
                                            {org.logo_url ? (
                                                <img src={org.logo_url} className="h-full w-full object-cover rounded-md" alt={org.name} />
                                            ) : (
                                                <Building2 className="h-3.5 w-3.5" />
                                            )}
                                        </div>
                                        <span className={cn("truncate font-medium flex-1 text-sm tracking-tight", isSelected ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900")}>
                                            {org.name}
                                        </span>
                                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 ml-auto animate-pulse" />}
                                    </div>
                                }
                                active={false} // Handled custom above
                                onClick={() => handleOrgSelect(org)}
                                className={cn(
                                    "hover:bg-slate-50 border border-transparent",
                                    isSelected ? "bg-slate-50 border-slate-100" : ""
                                )}
                            />
                            
                            {/* Nested Sub-menu for Selected Organization */}
                            {isSelected && (
                                <div className="mt-1 ml-[11px] pl-3 border-l-[1.5px] border-indigo-100 space-y-0.5 animate-in slide-in-from-left-1 duration-300 fade-in-50">
                                    <SidebarItem 
                                        icon={Layout} 
                                        label="Boards" 
                                        to="/" 
                                        active={location.pathname === '/' || location.pathname.startsWith('/boards')} 
                                    />
                                    <SidebarItem 
                                        icon={Activity} 
                                        label="Activity" 
                                        to={`/organizations/${org.id}/activity`}
                                        active={location.pathname.includes('/activity')}
                                    />
                                    <SidebarItem 
                                        icon={Settings} 
                                        label="Settings" 
                                        to={`/organizations/${org.id}/settings`}
                                        active={location.pathname.includes('/settings')}
                                    />
                                    <SidebarItem 
                                        icon={CreditCard} 
                                        label="Billing" 
                                        to={`/organizations/${org.id}/billing`}
                                        active={location.pathname.includes('/billing')}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                
                <CreateOrganizationModal>
                    <button className="flex items-center gap-3 px-3 py-2 w-full text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all group mt-2">
                        <div className="h-6 w-6 rounded-md border border-dashed border-slate-300 flex items-center justify-center group-hover:border-indigo-300 transition-colors">
                            <Plus className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium">Create Organization</span>
                    </button>
                </CreateOrganizationModal>
             </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Free Plan</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2 overflow-hidden">
                <div className="bg-blue-500 h-1.5 rounded-full w-3/4" />
            </div>
            <p className="text-[10px] text-slate-400">7/10 boards used</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 fixed inset-y-0 left-0 z-20 shadow-sm transition-all">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl transition-transform transform">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm z-50 sticky top-0">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-500">
                <Menu className="h-6 w-6" />
             </Button>
             
             {/* Logo for mobile if needed, or breadcrumbs */}
             <span className="md:hidden font-semibold text-lg text-slate-800">Trello</span>
             
             {/* Desktop: Title */}
             <div className="hidden md:flex items-center gap-2 text-slate-600 font-medium">
                {currentOrganization ? (
                    <>
                        <Building2 className="h-4 w-4" />
                        <span>{currentOrganization.name}</span>
                    </>
                ) : (
                    <span>Select an Organization</span>
                )}
             </div>
          </div>

          <div className="flex items-center gap-3">
             <Button size="sm" className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                 <Plus className="h-4 w-4" />
                 Create
             </Button>
             
             <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:px-8 md:py-8 scroll-smooth">
           <Outlet />
        </main>
      </div>
    </div>
  );
};

const UserMenu = () => {
    const user = getUser();
    const navigate = useNavigate();
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    console.log('Current User in Menu:', user); // DEBUG

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 ring-2 ring-white shadow-sm border border-indigo-200 cursor-pointer hover:bg-indigo-200 transition-colors select-none">
                     {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                    <p className="font-semibold text-sm text-slate-900 truncate">{user?.username || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
                </div>
                <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start h-8 px-2 text-sm text-slate-600 font-normal hover:text-slate-900">
                        Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start h-8 px-2 text-sm text-slate-600 font-normal hover:text-slate-900">
                        Settings
                    </Button>
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <>
                            <div className="h-px bg-slate-100 my-1" />
                            <Button 
                                variant="ghost" 
                                onClick={() => navigate('/admin')} 
                                className="w-full justify-start h-8 px-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 hover:bg-indigo-50"
                            >
                                ⚡ Admin Panel
                            </Button>
                        </>
                    )}
                    <div className="h-px bg-slate-100 my-1" />
                    <Button 
                        variant="ghost" 
                        onClick={handleLogout} 
                        className="w-full justify-start h-8 px-2 text-sm text-red-600 font-medium hover:text-red-700 hover:bg-red-50"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default DashboardLayout;
