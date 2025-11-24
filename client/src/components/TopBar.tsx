import { Search, Plus, Download, Upload, Bell, Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";

export function TopBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      
      <Select defaultValue="acme-corp" data-testid="select-organization">
        <SelectTrigger className="w-48" data-testid="trigger-organization">
          <SelectValue placeholder="Select Organization" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="acme-corp">ACME Corporation</SelectItem>
          <SelectItem value="tech-solutions">Tech Solutions Inc</SelectItem>
          <SelectItem value="global-eng">Global Engineering</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="refinery-expansion" data-testid="select-project">
        <SelectTrigger className="w-56" data-testid="trigger-project">
          <SelectValue placeholder="Select Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="refinery-expansion">Refinery Expansion Project</SelectItem>
          <SelectItem value="pipeline-construction">Pipeline Construction</SelectItem>
          <SelectItem value="offshore-platform">Offshore Platform Build</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search tasks, documents, resources..."
          className="pl-9"
          data-testid="input-search"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="default" data-testid="button-add">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Create New</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="menu-item-new-task">New Task</DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-item-new-risk">New Risk</DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-item-new-issue">New Issue</DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-item-new-change">Change Request</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="menu-item-new-project">New Project</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" data-testid="button-import-export">
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Import / Export</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="menu-item-import-json">Import JSON</DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-item-import-csv">Import CSV</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="menu-item-export-pdf">Export as PDF</DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-item-export-json">Export as JSON</DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-item-export-csv">Export as CSV</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        data-testid="button-theme-toggle"
      >
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </Button>

      <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
        <Bell className="h-4 w-4" />
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs" data-testid="badge-notification-count">
          3
        </Badge>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" data-testid="button-profile">
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="menu-item-profile">Profile</DropdownMenuItem>
          <DropdownMenuItem data-testid="menu-item-settings">Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="menu-item-logout">Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
