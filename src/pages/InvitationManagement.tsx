import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInvitations, type Invitation } from '@/hooks/useInvitations';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Copy, Plus, Calendar, Mail, User, LogOut, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import ThemeToggle from '@/components/ThemeToggle';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';

const InvitationManagement = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitedEmail, setInvitedEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const { createInvitation, getMyInvitations } = useInvitations();
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Access control - only allow specific user
  const ADMIN_EMAIL = 'abmorrill4@gmail.com';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);

  const loadInvitations = async () => {
    setLoading(true);
    const { success, invitations: data } = await getMyInvitations();
    if (success && data) {
      setInvitations(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL) {
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'used': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.email !== ADMIN_EMAIL) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className={`min-h-screen flex w-full ${theme === 'dark' ? 'bg-career-dark' : 'bg-career-light'} transition-colors duration-300`}>
        <ThemeToggle />
        
        <Sidebar>
          <SidebarHeader>
            <div className="p-4">
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-2`}>
                Praeviderant
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                Your Career AI
              </p>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarSeparator />
              
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <User className="w-4 h-4" />
                  <span>Invitation Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className={`w-full ${theme === 'dark' ? 'border-career-text-dark/20 text-career-text-dark hover:bg-career-text-dark/10' : 'border-career-text-light/20 text-career-text-light hover:bg-career-text-light/10'} transition-all duration-200`}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className={`border-b ${theme === 'dark' ? 'border-career-text-dark/10' : 'border-career-text-light/10'} mb-8`}>
            <div className="flex items-center py-6">
              <SidebarTrigger />
              <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} ml-4`}>
                Invitation Management
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Create Invitation */}
            <div className={`p-8 rounded-2xl ${theme === 'dark' ? 'bg-career-panel-dark shadow-neumorphic-dark' : 'bg-career-panel-light shadow-neumorphic-light'} transition-all duration-300`}>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-career-accent rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'}`}>
                    Create New Invitation
                  </h2>
                  <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
                    Generate a new invitation code to give someone access to the platform.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className={`${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} text-sm font-medium mb-2 block`}>
                    Email (Optional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitedEmail}
                    onChange={(e) => setInvitedEmail(e.target.value)}
                    placeholder="Enter email address (optional)"
                    className={`h-12 ${theme === 'dark' ? 'bg-career-gray-dark border-career-text-dark/20 text-career-text-dark placeholder:text-career-text-muted-dark' : 'bg-career-gray-light border-career-text-light/20 text-career-text-light placeholder:text-career-text-muted-light'} transition-all duration-200`}
                  />
                  <p className={`text-xs ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mt-1`}>
                    If provided, this invitation will be associated with the specific email address.
                  </p>
                </div>
                <Button
                  onClick={handleCreateInvitation}
                  className="bg-career-accent hover:bg-career-accent-dark text-white transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invitation
                </Button>
              </div>
            </div>

            {/* Invitations List */}
            <div className={`p-8 rounded-2xl ${theme === 'dark' ? 'bg-career-panel-dark shadow-neumorphic-dark' : 'bg-career-panel-light shadow-neumorphic-light'} transition-all duration-300`}>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-career-text-dark' : 'text-career-text-light'} mb-6`}>
                Your Invitations
              </h3>
              <p className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'} mb-6`}>
                All invitation codes you've created and their current status.
              </p>

              {loading ? (
                <div className="text-center py-8">
                  <div className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>Loading invitations...</div>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <div className={`${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>No invitations created yet.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-career-gray-dark shadow-neumorphic-sm-dark' : 'bg-career-gray-light shadow-neumorphic-sm-light'} transition-all duration-300`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <code className={`${theme === 'dark' ? 'bg-career-dark text-career-accent' : 'bg-career-light text-career-accent'} px-3 py-1 rounded font-mono text-lg`}>
                              {invitation.code}
                            </code>
                            <Badge className={getStatusColor(invitation.status)}>
                              {invitation.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(invitation.code)}
                              className={`${theme === 'dark' ? 'text-career-text-muted-dark hover:text-career-text-dark' : 'text-career-text-muted-light hover:text-career-text-light'}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ${theme === 'dark' ? 'text-career-text-muted-dark' : 'text-career-text-muted-light'}`}>
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
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default InvitationManagement;
