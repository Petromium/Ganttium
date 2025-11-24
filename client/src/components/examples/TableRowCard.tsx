import { TableRowCard } from '../TableRowCard';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function TableRowCardExample() {
  const [selected, setSelected] = useState(false);

  return (
    <div className="p-4">
      <TableRowCard
        id="example-1"
        selected={selected}
        onSelect={setSelected}
        onClick={() => console.log('Clicked')}
        expandable
      >
        <div className="flex items-center gap-4">
          <Badge variant="outline">WBS-1.0</Badge>
          <span className="font-medium">Example Task</span>
          <Badge variant="secondary">In Progress</Badge>
        </div>
      </TableRowCard>
    </div>
  );
}
