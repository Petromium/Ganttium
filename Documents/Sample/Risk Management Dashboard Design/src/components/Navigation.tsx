import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileText, 
  Users, 
  Settings, 
  ChevronLeft,
  Building2,
  BarChart3,
  Calendar
} from 'lucide-react';

interface NavigationProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: false },
  { icon: AlertTriangle, label: 'Risk Management', active: true },
  { icon: FileText, label: 'Projects', active: false },
  { icon: Users, label: 'Team', active: false },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: Calendar, label: 'Schedule', active: false },
  { icon: Building2, label: 'Resources', active: false },
];

export function Navigation({ collapsed, onToggle }: NavigationProps) {
  return (
    <aside 
      className={`bg-gray-900 text-gray-100 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <span className="text-white">ProjectFlow</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-8 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings at Bottom */}
      <div className="p-2 border-t border-gray-800">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>
    </aside>
  );
}
