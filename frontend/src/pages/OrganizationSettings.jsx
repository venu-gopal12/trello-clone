import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Mail, Shield, UserMinus, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const OrganizationSettings = () => {
  const { id } = useParams();
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState('member');
  
  // Add member form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [id]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/organizations/${id}/members`);
      setMembers(data);
      
      // Find current user's role
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const myMembership = data.find(m => m.id === currentUser.id);
      if (myMembership) {
        setCurrentUserRole(myMembership.role);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAdding(true);
    try {
      const { data } = await api.post(`/organizations/${id}/members`, { email, role });
      setMembers([...members, data]);
      setEmail('');
      setRole('member');
      toast.success(`${data.username} added successfully`);
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/organizations/${id}/members/${userId}`, { role: newRole });
      setMembers(members.map(m => m.id === userId ? { ...m, role: newRole } : m));
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId, username) => {
    if (!confirm(`Remove ${username} from this organization?`)) return;

    try {
      await api.delete(`/organizations/${id}/members/${userId}`);
      setMembers(members.filter(m => m.id !== userId));
      toast.success(`${username} removed successfully`);
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const isAdmin = currentUserRole === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-slate-600 mt-1">{currentOrganization?.name}</p>
      </div>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members
          </CardTitle>
          <CardDescription>
            Manage who has access to this organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Member Form - Only for Admins */}
          {isAdmin && (
            <form onSubmit={handleAddMember} className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-sm text-slate-700">Invite Member</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={adding}
                    className="bg-white"
                  />
                </div>
                <Select value={role} onValueChange={setRole} disabled={adding}>
                  <SelectTrigger className="w-32 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={adding || !email.trim()}>
                  {adding ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Invite
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                User must have an existing account to be added
              </p>
            </form>
          )}

          {/* Members List */}
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No members yet</p>
              </div>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                      {member.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{member.username}</p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isAdmin ? (
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => handleRoleChange(member.id, newRole)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">
                            <span className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              Member
                            </span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              Admin
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role === 'admin' ? (
                          <><Shield className="h-3 w-3 mr-1" /> Admin</>
                        ) : (
                          <><Users className="h-3 w-3 mr-1" /> Member</>
                        )}
                      </Badge>
                    )}

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id, member.username)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationSettings;
