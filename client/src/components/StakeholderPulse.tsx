import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProject } from "@/contexts/ProjectContext";
import { AlertCircle, CheckCircle, Clock, MessageSquare, TrendingDown, Mail, Phone, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Stakeholder, CommunicationMetrics } from "@shared/schema";

interface StakeholderPulseProps {
  limit?: number;
}

export function StakeholderPulse({ limit = 5 }: StakeholderPulseProps) {
  const { selectedProjectId } = useProject();

  const { data: stakeholders = [] } = useQuery<Stakeholder[]>({
    queryKey: [`/api/projects/${selectedProjectId}/stakeholders`],
    enabled: !!selectedProjectId,
  });

  const { data: metrics = [] } = useQuery<CommunicationMetrics[]>({
    queryKey: [`/api/projects/${selectedProjectId}/communication-metrics`],
    enabled: !!selectedProjectId,
  });

  // Combine stakeholders with their metrics
  const stakeholdersWithMetrics = stakeholders.map(stakeholder => {
    const metric = metrics.find(m => m.stakeholderId === stakeholder.id);
    return { stakeholder, metric };
  }).sort((a, b) => {
    // Sort by health status (critical first, then at-risk, then healthy)
    const statusOrder = { critical: 0, 'at-risk': 1, healthy: 2 };
    const aStatus = a.metric?.healthStatus || 'healthy';
    const bStatus = b.metric?.healthStatus || 'healthy';
    return (statusOrder[aStatus as keyof typeof statusOrder] || 2) - (statusOrder[bStatus as keyof typeof statusOrder] || 2);
  }).slice(0, limit);

  const getHealthBadge = (status?: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive" className="text-xs">Critical</Badge>;
      case 'at-risk':
        return <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">At Risk</Badge>;
      default:
        return <Badge variant="outline" className="text-xs border-green-500 text-green-600">Healthy</Badge>;
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-3 w-3" />;
      case 'phone':
        return <Phone className="h-3 w-3" />;
      case 'chat':
        return <MessageSquare className="h-3 w-3" />;
      case 'meeting':
        return <Users className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getLastContactText = (date?: Date | string | null) => {
    if (!date) return "Never";
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  if (!selectedProjectId) {
    return null;
  }

  if (stakeholders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Stakeholder Pulse
          </CardTitle>
          <CardDescription>Communication health for key stakeholders</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No stakeholders found. Add stakeholders to track communication health.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Stakeholder Pulse
        </CardTitle>
        <CardDescription>Communication health for key stakeholders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {stakeholdersWithMetrics.map(({ stakeholder, metric }) => {
          const isHealthy = !metric || metric.healthStatus === 'healthy';
          const isAtRisk = metric?.healthStatus === 'at-risk';
          const isCritical = metric?.healthStatus === 'critical';

          return (
            <div
              key={stakeholder.id}
              className={cn(
                "flex items-start justify-between p-3 rounded-lg border",
                isCritical && "bg-red-50 border-red-200",
                isAtRisk && "bg-amber-50 border-amber-200",
                isHealthy && "bg-muted/30"
              )}
            >
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {stakeholder.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{stakeholder.name}</span>
                    {getHealthBadge(metric?.healthStatus)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {stakeholder.preferredChannel && (
                      <div className="flex items-center gap-1">
                        {getChannelIcon(stakeholder.preferredChannel)}
                        <span className="capitalize">{stakeholder.preferredChannel}</span>
                      </div>
                    )}
                    {metric?.lastInteractionDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Last contact: {getLastContactText(metric.lastInteractionDate)}</span>
                      </div>
                    )}
                    {metric?.responseTimeAvg && (
                      <div className="flex items-center gap-1">
                        <span>Avg response: {Math.round(metric.responseTimeAvg / 60)}h</span>
                      </div>
                    )}
                  </div>
                  {stakeholder.communicationStyle && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {stakeholder.communicationStyle === 'direct' && 'Direct'}
                        {stakeholder.communicationStyle === 'diplomatic' && 'Diplomatic'}
                        {stakeholder.communicationStyle === 'detailed' && 'Detailed'}
                        {stakeholder.communicationStyle === 'brief' && 'Brief'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCritical && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                {isAtRisk && (
                  <Clock className="h-4 w-4 text-amber-500" />
                )}
                {isHealthy && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          );
        })}
        {stakeholders.length > limit && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Showing top {limit} of {stakeholders.length} stakeholders
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


