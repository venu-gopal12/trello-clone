import React, { useEffect, useState } from 'react';
import { useOrganization } from '../context/OrganizationContext';
import api from '../services/api';
import { Activity, Clock } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';

const ActivityPage = () => {
  const { currentOrganization } = useOrganization();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      fetchActivity();
    }
  }, [currentOrganization]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/activity/organization/${currentOrganization.id}`);
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activity', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-slate-50">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <Activity className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Organization Selected</h2>
          <p className="text-slate-500 mt-2">Please select an organization to view its activity log.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h1>
          <p className="text-sm text-slate-500">Track all changes across {currentOrganization.name}</p>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {loading ? (
           Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="flex gap-4 relative">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
             </div>
           ))
        ) : activities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm relative z-10">
            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No activity recorded yet.</p>
          </div>
        ) : (
          activities.map((log) => (
            <div key={log.id} className="relative flex items-start group">
                {/* Timeline Dot */}
                <div className="absolute left-0 top-1 ml-5 -translate-x-1/2 rounded-full border-4 border-white bg-indigo-500 h-4 w-4 shadow-sm z-10 group-hover:scale-110 transition-transform"></div>
                
                <div className="ml-12 w-full">
                    <div className="bg-white rounded-lg border border-slate-100 px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900">{log.username}</span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500">{format(new Date(log.created_at), 'MMM d, h:mm a')}</span>
                             </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {formatActivity(log)}
                        </p>
                        
                        <div className="mt-2 text-xs font-medium text-slate-400 bg-slate-50 inline-block px-2 py-1 rounded">
                             {log.entity_type} • {log.entity_id}
                        </div>
                    </div>
                </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const formatActivity = (log) => {
    let details = {};
    try {
        details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details || {};
    } catch (e) {
        details = {};
    }

    const action = log.action_type;
    const cardTitle = details.title || details.cardTitle || 'this card';

    switch (action) {
        case 'create':
            return <span>created <span className="font-medium text-slate-800">{cardTitle}</span></span>;
        case 'delete':
            return <span>deleted card <span className="font-medium text-slate-800">{cardTitle}</span></span>;
        case 'update':
            if (details.description_changed) return <span>updated description of <span className="font-medium text-slate-800">{cardTitle}</span></span>;
            return <span>updated <span className="font-medium text-slate-800">{cardTitle}</span></span>;
        case 'rename':
             return <span>renamed card to <span className="font-medium text-slate-800">{cardTitle}</span></span>;
        case 'move':
             return <span>moved <span className="font-medium text-slate-800">{cardTitle}</span></span>; // TODO: Add list names if available
        case 'add_label':
             return <span>added label <span className="font-medium" style={{ color: details.labelColor || '#475569' }}>{details.labelName}</span> to <span className="font-medium text-slate-800">{cardTitle}</span></span>;
        case 'remove_label':
             return <span>removed label <span className="font-medium text-slate-600">{details.labelName}</span> from <span className="font-medium text-slate-800">{cardTitle}</span></span>;
        case 'add_member':
             return <span>added <span className="font-medium text-slate-800">{details.memberName}</span> to <span className="font-medium text-slate-800">{cardTitle}</span></span>;
        case 'remove_member':
             return <span>removed <span className="font-medium text-slate-800">{details.memberName}</span> from <span className="font-medium text-slate-800">{cardTitle}</span></span>;
        default:
             return <span>{action.replace('_', ' ')} on <span className="font-medium text-slate-800">{cardTitle}</span></span>;
    }
};

export default ActivityPage;
