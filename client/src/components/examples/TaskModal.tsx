import { TaskModal } from '../TaskModal';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function TaskModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Task Modal</Button>
      <TaskModal 
        open={open} 
        onOpenChange={setOpen}
        onClose={() => setOpen(false)} 
      />
    </div>
  );
}
