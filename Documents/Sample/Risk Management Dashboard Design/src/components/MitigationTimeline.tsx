import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';

interface Action {
  id: string;
  riskId: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
}

const actions: Action[] = [
  {
    id: 'A-001',
    riskId: 'R-001',
    title: 'Coordinate with utility companies for relocation',
    assignee: 'Mike Johnson',
    dueDate: 'Dec 12, 2025',
    status: 'completed',
  },
  {
    id: 'A-002',
    riskId: 'R-001',
    title: 'Develop alternative foundation design',
    assignee: 'Sarah Chen',
    dueDate: 'Dec 15, 2025',
    status: 'in-progress',
  },
  {
    id: 'A-003',
    riskId: 'R-002',
    title: 'Source steel from alternative suppliers',
    assignee: 'Tom Rodriguez',
    dueDate: 'Dec 10, 2025',
    status: 'overdue',
  },
  {
    id: 'A-004',
    riskId: 'R-004',
    title: 'Submit revised environmental impact assessment',
    assignee: 'Lisa Wang',
    dueDate: 'Dec 20, 2025',
    status: 'in-progress',
  },
  {
    id: 'A-005',
    riskId: 'R-007',
    title: 'Schedule stakeholder design review meeting',
    assignee: 'Mike Johnson',
    dueDate: 'Dec 18, 2025',
    status: 'pending',
  },
  {
    id: 'A-006',
    riskId: 'R-005',
    title: 'Negotiate with backup subcontractors',
    assignee: 'James Miller',
    dueDate: 'Dec 22, 2025',
    status: 'pending',
  },
];

function getStatusIcon(status: Action['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case 'in-progress':
      return <Clock className="w-5 h-5 text-blue-600" />;
    case 'overdue':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    case 'pending':
      return <Circle className="w-5 h-5 text-gray-400" />;
  }
}

function getStatusColor(status: Action['status']) {
  switch (status) {
    case 'completed':
      return 'border-green-200 bg-green-50';
    case 'in-progress':
      return 'border-blue-200 bg-blue-50';
    case 'overdue':
      return 'border-red-200 bg-red-50';
    case 'pending':
      return 'border-gray-200 bg-white';
  }
}

export function MitigationTimeline() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-gray-900">Mitigation Action Plan</h2>
        <p className="text-gray-600 mt-1">Active mitigation strategies and their progress</p>
      </div>

      <div className="space-y-4">
        {actions.map((action, index) => (
          <div key={action.id} className="relative">
            {/* Timeline connector */}
            {index < actions.length - 1 && (
              <div className="absolute left-[10px] top-9 w-0.5 h-full bg-gray-200" />
            )}

            {/* Action card */}
            <div
              className={`relative pl-12 pb-4 border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5 rounded-r-lg p-4 ${getStatusColor(
                action.status
              )}`}
            >
              {/* Status icon */}
              <div className="absolute left-[-13px] top-4 bg-white rounded-full">
                {getStatusIcon(action.status)}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-gray-900">{action.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Related to <code className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs">{action.riskId}</code>
                    </p>
                  </div>
                  {action.status === 'overdue' && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full border border-red-200 whitespace-nowrap">
                      Overdue
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                      {action.assignee.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <span>{action.assignee}</span>
                  </div>
                  <span>•</span>
                  <span>Due {action.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state example (commented out) */}
      {/* 
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-gray-900 mb-2">No Active Mitigations</h3>
        <p className="text-gray-600 max-w-sm">
          All risks are being monitored. Mitigation actions will appear here when needed.
        </p>
      </div>
      */}
    </div>
  );
}
