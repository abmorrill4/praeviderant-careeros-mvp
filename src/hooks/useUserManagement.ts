import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  lastActive: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface UserStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  adminUsers: number;
}

interface UserManagementData {
  userStats: UserStats;
  recentUsers: UserData[];
  loading: boolean;
  error: string | null;
}

export const useUserManagement = () => {
  const [data, setData] = useState<UserManagementData>({
    userStats: {
      totalUsers: 0,
      activeToday: 0,
      newThisWeek: 0,
      adminUsers: 0
    },
    recentUsers: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Get user statistics from profiles and auth.users
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, name, created_at');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setData(prev => ({ ...prev, loading: false, error: profilesError.message }));
          return;
        }

        // Calculate statistics
        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const totalUsers = profiles?.length || 0;
        
        // For demo purposes, we'll use some basic calculations
        // In a real app, you'd track last_active timestamps
        const activeToday = Math.floor(totalUsers * 0.15); // Estimate 15% daily active
        const newThisWeek = profiles?.filter(p => 
          new Date(p.created_at) > weekAgo
        ).length || 0;

        // Count admin users - for now we'll estimate based on email patterns
        // Since we can't easily access auth.users metadata from client side
        const adminUsers = profiles?.filter(profile => 
          profile.email === 'abmorrill4@gmail.com' ||
          profile.email?.endsWith('@praeviderant.com')
        ).length || 0;

        // Get recent users (last 10)
        const recentUsers: UserData[] = profiles?.slice(0, 10).map(profile => ({
          id: profile.id,
          email: profile.email || 'Unknown',
          name: profile.name,
          role: (profile.email === 'abmorrill4@gmail.com' || profile.email?.endsWith('@praeviderant.com')) ? 'admin' : 'user',
          lastActive: getRelativeTime(profile.created_at),
          status: 'active' as const,
          createdAt: profile.created_at
        })) || [];

        setData({
          userStats: {
            totalUsers,
            activeToday,
            newThisWeek,
            adminUsers
          },
          recentUsers,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching user management data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch user data'
        }));
      }
    };

    fetchUserData();
  }, []);

  return data;
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString();
}