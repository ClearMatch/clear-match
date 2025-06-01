'use client';

import { useEffect, useState } from 'react';
import { Bell, Users, Calendar, Briefcase, ArrowUpRight, Clock, Mail, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { HubSpotSync } from './dashboard/hubspot-sync';

interface DashboardStats {
  totalCandidates: number;
  activeSearching: number;
  recentActivities: number;
  pendingActions: number;
}

interface RecommendedAction {
  id: string;
  candidateId: string;
  candidateName: string;
  actionType: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

interface RecentActivity {
  id: string;
  candidateId: string;
  candidateName: string;
  type: string;
  description: string;
  createdAt: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    activeSearching: 0,
    recentActivities: 0,
    pendingActions: 0,
  });
  const [recommendedActions, setRecommendedActions] = useState<RecommendedAction[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        // Get user's organization ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!profile?.organization_id) return;

        // Fetch dashboard statistics
        const [
          { count: totalCandidates },
          { count: activeSearching },
          { data: activities },
        ] = await Promise.all([
          supabase
            .from('candidates')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id),
          supabase
            .from('candidates')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('is_active_looking', true),
          supabase
            .from('activities')
            .select(`
              id,
              type,
              description,
              created_at,
              candidates (
                id,
                first_name,
                last_name
              )
            `)
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        // Transform activities data
        const recentActivitiesData = activities?.map(activity => ({
          id: activity.id,
          candidateName: 'test',
          candidateId: 'test',
          type: activity.type,
          description: activity.description,
          createdAt: activity.created_at,
        })) || [];

        // Generate recommended actions based on activities and candidate data
        const recommendedActionsData: RecommendedAction[] = [
          {
            id: '1',
            candidateId: '1',
            candidateName: 'John Doe',
            actionType: 'follow_up',
            reason: 'No activity in the last 30 days',
            priority: 'high',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
          },
          // Add more recommended actions based on your business logic
        ];

        setStats({
          totalCandidates: totalCandidates || 0,
          activeSearching: activeSearching || 0,
          recentActivities: recentActivitiesData.length,
          pendingActions: recommendedActionsData.length,
        });
        setRecentActivities(recentActivitiesData);
        setRecommendedActions(recommendedActionsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your candidate pipeline and recommended actions
          </p>
        </div>
        <HubSpotSync />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Candidates</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalCandidates}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Briefcase className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Job Seekers</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.activeSearching}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent Activities</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.recentActivities}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Actions</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.pendingActions}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recommended Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recommended Actions</h2>
            <div className="space-y-4">
              {recommendedActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-start p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {action.priority === 'high' ? (
                      <div className="w-2 h-2 mt-2 bg-red-600 rounded-full"></div>
                    ) : action.priority === 'medium' ? (
                      <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">{action.candidateName}</h3>
                      <span className="text-xs text-gray-500">
                        {action.dueDate && new Date(action.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{action.reason}</p>
                    <div className="mt-2">
                      <button
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        Take action
                        <ArrowUpRight className="ml-1 h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivities.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            {activity.type === 'email' ? (
                              <Mail className="h-5 w-5 text-gray-500" />
                            ) : activity.type === 'call' ? (
                              <Phone className="h-5 w-5 text-gray-500" />
                            ) : (
                              <Calendar className="h-5 w-5 text-gray-500" />
                            )}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="text-sm text-gray-500">
                              <a href="#" className="font-medium text-gray-900">
                                {activity.candidateName}
                              </a>{' '}
                              {activity.description}
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}