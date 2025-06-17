
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInvitations, type Invitation } from '@/hooks/useInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, Plus, Calendar, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const InvitationManagement = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitedEmail, setInvitedEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const { createInvitation, getMyInvitations } = useInvitations();
  const { user } = useAuth();
  const { toast } = useToast();

  const loadInvitations = async () => {
    setLoading(true);
    const { success, invitations: data } = await getMyInvitations();
    if (success && data) {
      setInvitations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadInvitations();
    }
  }, [user]);

  const handleCreateInvitation = async () => {
    const { success } = await createInvitation(invitedEmail || undefined);
    if (success) {
      setInvitedEmail('');
      loadInvitations();
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard",
      description: `Invitation code ${code} copied to clipboard`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'used': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-career-dark flex items-center justify-center">
        <div className="text-career-text">Please sign in to manage invitations.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-career-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-career-text mb-2">Invitation Management</h1>
          <p className="text-career-text-muted">Create and manage invitation codes for new users.</p>
        </div>

        {/* Create Invitation */}
        <Card className="neumorphic-panel border-0 bg-career-panel mb-8">
          <CardHeader>
            <CardTitle className="text-career-text flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Invitation
            </CardTitle>
            <CardDescription className="text-career-text-muted">
              Generate a new invitation code to give someone access to the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-career-text text-sm font-medium mb-2 block">
                Email (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={invitedEmail}
                onChange={(e) => setInvitedEmail(e.target.value)}
                placeholder="Enter email address (optional)"
                className="neumorphic-input text-career-text placeholder:text-career-text-muted h-12"
              />
              <p className="text-xs text-career-text-muted mt-1">
                If provided, this invitation will be associated with the specific email address.
              </p>
            </div>
            <Button
              onClick={handleCreateInvitation}
              className="bg-career-mint hover:bg-career-mint-dark text-white neumorphic-button border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invitation
            </Button>
          </CardContent>
        </Card>

        {/* Invitations List */}
        <Card className="neumorphic-panel border-0 bg-career-panel">
          <CardHeader>
            <CardTitle className="text-career-text">Your Invitations</CardTitle>
            <CardDescription className="text-career-text-muted">
              All invitation codes you've created and their current status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="text-career-text-muted">Loading invitations...</div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-career-text-muted">No invitations created yet.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="neumorphic-panel-inset p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="bg-career-gray-dark px-3 py-1 rounded text-career-mint font-mono text-lg">
                            {invitation.code}
                          </code>
                          <Badge className={getStatusColor(invitation.status)}>
                            {invitation.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(invitation.code)}
                            className="text-career-text-muted hover:text-career-text"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-career-text-muted">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Created: {format(new Date(invitation.created_at), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Expires: {format(new Date(invitation.expires_at), 'MMM d, yyyy')}</span>
                          </div>
                          {invitation.invited_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{invitation.invited_email}</span>
                            </div>
                          )}
                          {invitation.used_at && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>Used: {format(new Date(invitation.used_at), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvitationManagement;
