import React from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';

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

function SortableWidget({ widget, onRemove, children }: { widget: WidgetConfig, onRemove: (id: string) => void, children: (widget: WidgetConfig) => React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative group overflow-hidden h-full">
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div {...attributes} {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button 
          variant="destructive" 
          size="icon" 
          className="h-6 w-6" 
          onClick={() => onRemove(widget.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      {children(widget)}
    </Card>
  );
}

export function DraggableDashboard({ 
  layout, 
  onLayoutChange, 
  onRemoveWidget, 
  children 
}: DraggableDashboardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.widgets.findIndex((w) => w.id === active.id);
      const newIndex = layout.widgets.findIndex((w) => w.id === over.id);
      
      const newWidgets = arrayMove(layout.widgets, oldIndex, newIndex).map((w, index) => ({
          ...w,
          position: index
      }));
      
      onLayoutChange({ widgets: newWidgets });
    }
  };

  const sortedWidgets = [...layout.widgets].sort((a, b) => a.position - b.position);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={sortedWidgets.map(w => w.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedWidgets.map((widget) => (
            <SortableWidget 
                key={widget.id} 
                widget={widget} 
                onRemove={onRemoveWidget} 
                children={children}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
