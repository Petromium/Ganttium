import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export const WIDGET_TYPES = {
  METRIC_CARD: 'metric_card',
  COST_SNAPSHOT: 'cost_snapshot',
  RESOURCE_SNAPSHOT: 'resource_snapshot',
  RISK_SNAPSHOT: 'risk_snapshot',
  DOCUMENT_STATS: 'document_stats',
  PORTFOLIO_SIGNALS: 'portfolio_signals',
  UPCOMING_EVENTS: 'upcoming_events',
  WBS_LINKAGE: 'wbs_linkage',
  S_CURVE: 's_curve',
  EVA_GAUGES: 'eva_gauges',
} as const;

export type WidgetType = typeof WIDGET_TYPES[keyof typeof WIDGET_TYPES];

export interface WidgetConfig {
  id: string;
  type: WidgetType | string;
  position: number;
  size: 'small' | 'medium' | 'large';
  title?: string;
  config?: Record<string, any>;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

interface DraggableDashboardProps {
  layout: DashboardLayout;
  onLayoutChange: (layout: DashboardLayout) => void;
  onRemoveWidget: (id: string) => void;
  children: (widget: WidgetConfig) => React.ReactNode;
}

export function DraggableDashboard({ 
  layout, 
  onLayoutChange, 
  onRemoveWidget, 
  children 
}: DraggableDashboardProps) {
  // Simple grid layout for now to satisfy build requirements
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {layout.widgets
        .sort((a, b) => a.position - b.position)
        .map((widget) => (
        <Card key={widget.id} className="relative group overflow-hidden">
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => onRemoveWidget(widget.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {children(widget)}
        </Card>
      ))}
    </div>
  );
}
