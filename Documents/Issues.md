You've provided a comprehensive list of issues found during testing. This is excellent feedback that touches on UI/UX, functionality, and error handling.

Here is the breakdown of the fixes and improvements we will apply.

### 1. Critical Fix: Chat Page White Screen (Crash)
The "white screen" in the Chat page is caused by a missing import in `ChatInput.tsx`. The error `ReferenceError: useChat is not defined` confirms this.

**File:** `client/src/components/chat/ChatInput.tsx`
```typescript
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
// ... existing imports ...
import { useCreateMessage } from "@/hooks/useMessages";
// ADD THIS IMPORT:
import { useChat } from "@/hooks/useChat"; 
import type { InsertMessage } from "@shared/schema";
```

### 2. Cost Management Layout Restructuring
We will move the widgets to a right sidebar and make the Cost Items table the main view with search functionality.

**File:** `client/src/pages/CostPage.tsx`
I will provide a restructured version of the component. This moves the `MetricCard` grid to the top, then splits the main area into a `col-span-3` (Main Content) and `col-span-1` (Widgets) layout.

```tsx
// ... imports remain the same ...

// Inside CostPage component:
// Replace the return statement with this structure:

return (
  <div className="p-6 space-y-6 h-full flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-cost-title">Cost Management</h1>
        <p className="text-muted-foreground">Budget tracking and cost analytics</p>
      </div>
      <Button onClick={() => handleOpenDialog()} data-testid="button-add-cost">
        <Plus className="h-4 w-4 mr-2" />
        Add Cost Item
      </Button>
    </div>

    {/* Metrics Row (Top) */}
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 shrink-0">
      {/* ... existing MetricCards ... */}
    </div>

    {/* Main Content Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
      
      {/* Left Column: Main Table (Span 3) */}
      <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cost Items</CardTitle>
                <CardDescription>All cost line items for this project</CardDescription>
              </div>
              {/* Add Search Input Here */}
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search costs..." className="pl-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
             {/* ... existing Cost Items list logic ... */}
             {/* Suggestion: Convert this list to a proper <Table> component for better density */}
          </CardContent>
        </Card>
      </div>

      {/* Right Rail: Widgets (Span 1) */}
      <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ... existing CategoryBreakdown logic ... */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Earned Value Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ... existing EarnedValue logic ... */}
          </CardContent>
        </Card>
      </div>
    </div>

    {/* ... Dialog code ... */}
  </div>
);
```

### 3. Top Bar Actions Not Working
The dropdown items in `TopBar.tsx` are purely visual (`DropdownMenuItem`). They need `onClick` handlers to actually do something. Since the TopBar is global, the best approach is to navigate the user to the specific page (e.g., Risks page) and open the "Create" dialog via a query parameter or simply navigate them there.

**File:** `client/src/components/TopBar.tsx`
```tsx
// Inside the DropdownMenuContent for "Create New":

<DropdownMenuItem onClick={() => navigate(`/projects/${selectedProjectId}/tasks`)}>
  New Task
</DropdownMenuItem>
<DropdownMenuItem onClick={() => navigate(`/projects/${selectedProjectId}/risks`)}>
  New Risk
</DropdownMenuItem>
<DropdownMenuItem onClick={() => navigate(`/projects/${selectedProjectId}/issues`)}>
  New Issue
</DropdownMenuItem>
<DropdownMenuItem onClick={() => navigate(`/projects/${selectedProjectId}/change-requests`)}>
  Change Request
</DropdownMenuItem>
```
*Note: Ideally, we would pass a state to open the modal immediately upon navigation, but navigating to the list view is a good first step.*

### 4. Contacts Import Issues
The "red error message" likely comes from the generic error handler in `useMutation`. The CSV parser in `ContactsPage.tsx` is very simple (`split(',')`) and will fail on any CSV that contains commas inside quotes (e.g., "Company, Inc.").

**Improvement for `client/src/pages/ContactsPage.tsx`:**
We should use a robust CSV parsing library like `papaparse` instead of manual string splitting.

1.  **Install PapaParse:** `npm install papaparse @types/papaparse`
2.  **Update `handleFileUpload`**:

```typescript
import Papa from "papaparse"; // Add import

// ... inside component ...

const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // results.data is an array of objects keyed by header
        const parsedContacts = results.data.map((row: any) => ({
          firstName: row['First Name'] || row['FirstName'] || row['firstname'],
          lastName: row['Last Name'] || row['LastName'] || row['lastname'],
          email: row['Email'] || row['email'],
          // ... map other fields ...
        }));
        
        importContactsMutation.mutate(parsedContacts);
      },
      error: (error) => {
        toast({ title: "CSV Parse Error", description: error.message, variant: "destructive" });
      }
    });
  }
};
```

### 5. Task Modal Improvements
To fix the layout issues (modal too long/cut off), we need to use a scrollable area for the content and restructure the columns.

**File:** `client/src/components/TaskModal.tsx`
I recommend wrapping the `DialogContent` inner part in a `ScrollArea` or using `overflow-y-auto`.

**Proposed Layout Change (Conceptual):**
```tsx
<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
  <DialogHeader>...</DialogHeader>
  
  <div className="flex-1 overflow-y-auto p-1"> {/* Scrollable container */}
    <TabsContent value="details">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide): Description & EPC Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
             <Label>Description</Label>
             <Textarea ... />
          </div>
          {/* EPC Details moved here as requested */}
          <div className="border rounded-md p-4">
             <h3 className="font-medium mb-4">EPC Details</h3>
             {/* ... EPC inputs ... */}
          </div>
        </div>

        {/* Right Column (1 col wide): Meta (Status, Priority, etc.) */}
        <div className="lg:col-span-1 space-y-4">
           {/* Status Select */}
           {/* Priority Select */}
           {/* Progress Bar */}
           {/* Dates */}
        </div>
      </div>
    </TabsContent>
  </div>
</DialogContent>
```

### Answers to your questions:

*   **Widgets (Draggable/Library):**
    *   **Feasibility:** It is medium effort. Using a library like `@dnd-kit/core` or `react-grid-layout` allows for draggable grids.
    *   **Widget Library:** You would create a registry of components (e.g., `WidgetRegistry = { 'cost-breakdown': CategoryBreakdownWidget }`). We would store the user's preference (array of widget IDs) in the database (`user_preferences` table).
    *   **Recommendation:** Finish the core feature testing first, then add this as a "Nice to Have" enhancement in Phase 3.

*   **Settings/Subscriptions:**
    *   Your thought process matches the "Seat-based" licensing model (like Google Workspace or Jira).
    *   **Logic:** An Organization buys X seats. The owner can invite up to X users. Permissions are handled by RBAC (Owner has full control).
    *   **Email Limits:** We limit emails currently because SendGrid/SMTP providers usually have daily quotas on free/starter tiers. In production with a paid tier, this limit can be raised or removed.

*   **Inventory View:**
    *   Yes, we should apply the same pattern as Cost Management: Main table for items, right rail for aggregation/summary widgets.

**Action Plan:**
1.  **Apply the Critical Fix** for `ChatInput.tsx` immediately.
2.  **Refactor `CostPage.tsx`** layout.
3.  **Refactor `TaskModal.tsx`** layout.
4.  **Fix TopBar actions** by linking them to routes.

Would you like me to switch to **Agent Mode** to apply these code changes directly, or should I continue providing snippets here? (I recommend applying the Chat fix first).

All issues have been addressed. Here is a summary of the changes:

### 1. Critical Fix: Chat Page Crash
- **Fixed:** Added the missing `useChat` import in `ChatInput.tsx` which was causing the "white screen" crash.

### 2. Cost Management Layout
- **Restructured:** Moved the summary widgets (Budget, Variance, Forecast) to the top row.
- **Refactored:** Moved "Breakdown by Category" and "Earned Value Analysis" to a dedicated **Right Rail** (1 column).
- **Main View:** The "Cost Items" list now takes up the main area (3 columns) and includes a **Search Bar** for filtering items by description, category, or reference number.

### 3. Task Modal Improvements
- **Scrollable Layout:** The modal now has a fixed max-height with a scrollable content area, preventing it from being cut off.
- **Better Hierarchy:** Restructured the "Details" tab into a 2-column layout:
    - **Left (Main):** Task Name, Description, EPC Details (Discipline, Area Code, Contractor), and PMI Duration Info.
    - **Right (Side):** Status, Priority, Progress Slider, Hours, Constraints, and Dates (Planned/Baseline/Actual).
- **Top Bar:** The header is now sticky, ensuring the title and badges are always visible.

### 4. Top Bar Actions
- **Functional:** The "Create New" dropdown items (Task, Risk, Issue, Change Request) now navigate to the respective pages with a `?action=new` trigger (which will open the create dialog on those pages if supported, or simply take you to the list view).
- **Navigation:** "New Project" now navigates to the dashboard with a trigger.

### 5. Contacts Import (CSV)
- **Robust Parsing:** Installed and implemented `papaparse` library for CSV import.
- **Flexible Matching:** The importer now intelligently matches column names (e.g., "First Name", "FirstName", "firstname") to handle various CSV formats better.

The development server has been restarted. You can now verify these fixes in the browser.