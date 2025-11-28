# Cost Management, Procurement & Currency Exchange - Development Plan

## **Cost Management System**

### Core Purpose
A project-level cost tracking and communication tool for Project Managers, NOT a replacement for accounting software. Bridges project execution and accounting by providing visibility and facilitating communication.

### Key Principles
1. **Project-centric, not accounting-centric**: Tracks costs by project tasks, resources, and work packages, not by general ledger accounts
2. **Historical tracking + Forecasting**: Enables "what happened" analysis AND "what will happen" projections for stakeholder meetings
3. **Communication Bridge**: Provides structured data exchange with accounting (CSV exports, standardized reports) and supports stakeholder reporting

### Core Features

#### 1. Cost Breakdown Structure (CBS)
- Hierarchical cost organization aligned with WBS
- Cost codes/categories: Labor, Materials, Equipment, Subcontractors, Overhead, Contingency
- Multi-level aggregation (e.g., "Foundation → Excavation → Labor")
- **Linkage Requirement**: Costs must link to at least one of: Task, Resource Assignment, Change Request, or Work Package

#### 2. Transaction Log
- Chronological record of ALL cost entries
- **Fields**: Date, Category, Description, Budgeted Amount, Actual Amount, Currency, Linked Task/Resource, Change Request (if applicable), Status (Committed/Invoiced/Paid), Reference Number (PO/Invoice)
- **Audit Trail**: Who entered, when, and any modifications
- **Filtering**: By date range, category, task, resource, change request, status

#### 3. Forecasting & Budgeting
- **Baseline Budget**: Initial approved budget by category/task
- **Current Forecast**: Updated projections based on actuals and trends
- **Variance Analysis**: Budget vs. Actual vs. Forecast
- **Trend Analysis**: Project future costs based on burn rate
- **Commitment Tracking**: Track committed costs (POs, contracts) separate from actuals

#### 4. Reporting & Export
- **Reports Page Integration**: Cost summary reports (PDF)
- **CSV Export/Import**: Full transaction log with template
- **AI Schema Download**: For AI-assisted data entry/analysis
- **Accounting Integration**: Standardized export format for accounting systems
- **Stakeholder Reports**: Executive summaries, variance reports, forecast updates

### Missing Considerations (Future Enhancements)
- **Cost Accruals**: Track costs incurred but not yet invoiced (work completed, materials received)
- **Multi-Currency**: Handle currency conversion and reporting *(NOW ADDRESSED - see Currency Exchange section)*
- **Approval Workflows**: Budget approvals, expense approvals (if needed)
- **Cost Code Standardization**: Align with company/industry cost codes

---

## **Procurement Management System**

### Core Purpose
A resource availability and procurement planning tool for Project Managers and teams. Prevents budget overruns from redundant purchases by ensuring visibility into existing inventory before sourcing new materials/equipment.

### Key Principles
1. **Inventory-First Procurement**: Always check organization inventory before sourcing
2. **Task-Driven Requirements**: Procurement needs derive from upcoming tasks in project schedule
3. **Availability Intelligence**: Real-time visibility into what's available, allocated, or needs procurement

### Core Features

#### 1. Resource Requirement Planning
- **Task-Resource Linkage**: Identify resources (materials, equipment) required for upcoming tasks
- **Resource Demand Calculation**: Aggregate requirements across tasks by resource type
- **Timeline-Based Planning**: Show when resources are needed based on task start dates
- **Resource Specifications**: Track required specs (quantity, quality, dimensions, etc.)

#### 2. Inventory Availability Check
- **Organization-Level Inventory**: Query PMO inventory for available resources
- **Availability Status**: Available, Allocated (to other projects), Reserved, In-use, Maintenance
- **Quantity Matching**: Check if inventory has sufficient quantity (all, partial, or none)
- **Allocation Visibility**: See which projects have resources allocated
- **Cross-Project Coordination**: Identify conflicts when multiple projects need same resource

#### 3. Procurement Planning & Sourcing
- **Gap Analysis**: Automatically identify resources needed but not in inventory
- **Sourcing List**: Generate list of items requiring procurement
- **Priority Ranking**: Prioritize based on task start dates and critical path
- **Lead Time Tracking**: Track expected delivery times for procurement items
- **Vendor Information**: Link to vendor contacts (from Contacts Directory) for sourcing

#### 4. Procurement Workflow (Simplified, NOT Full ERP)
- **Requisition**: Create procurement request for items not in inventory
- **Approval**: Basic approval workflow (if needed)
- **Purchase Order Tracking**: Link PO numbers to requisitions (reference only, not full PO management)
- **Delivery Tracking**: Mark items as "ordered", "in-transit", "received"
- **Inventory Update**: When received, optionally add to organization inventory

#### 5. Import/Export
- **CSV Import/Export**: Resource requirements, inventory levels, procurement lists
- **Template Downloads**: Standardized templates for bulk data entry
- **AI Schema Download**: For AI-assisted requirement planning

### Missing Considerations (Future Enhancements)
- **Bill of Materials (BOM)**: For complex assemblies, track component-level requirements
- **Material Specifications**: Detailed specs beyond basic type (grade, standards, certifications)
- **Vendor Management**: Full vendor database, performance tracking, contract management
- **Procurement Analytics**: Spend analysis, vendor performance, lead time trends
- **Integration with Actual Procurement Systems**: API/webhooks to sync with ERP/procurement tools

---

## **Currency Exchange & Multi-Currency Management**

### Core Purpose
Support multi-currency projects and organizations with automatic exchange rate synchronization from ECB, enabling accurate cost tracking and reporting across currencies.

### Key Principles
1. **Hierarchical Currency Settings**: Organization-level default, project-level override
2. **Automatic Rate Updates**: Daily synchronization with ECB for accuracy
3. **Historical Rate Tracking**: Maintain exchange rate history for accurate historical reporting
4. **Real-Time Conversion**: Convert costs to base currency for consolidated reporting

### Core Features

#### 1. Currency Configuration
- **Organization-Level Currency**: Default base currency for organization (e.g., EUR, USD, GBP)
- **Project-Level Currency**: Override default per project (e.g., Project in Saudi Arabia uses SAR)
- **Multi-Currency Support**: Allow different currencies within same project (e.g., labor in EUR, materials in USD)
- **Currency Display Preferences**: User preference for viewing amounts (base currency vs. transaction currency)

#### 2. Exchange Rate Management
- **ECB Integration**: Daily automatic sync with European Central Bank exchange rates API
- **Rate Storage**: Historical exchange rates table with date, base currency, target currency, rate
- **Rate Source Tracking**: Track source (ECB, manual entry, custom API)
- **Manual Override**: Allow manual entry/correction of rates when needed
- **Rate Validation**: Alert on significant rate fluctuations or missing rates

#### 3. Automatic Currency Conversion
- **Transaction-Level Conversion**: Convert costs to project base currency at transaction date rate
- **Reporting Conversion**: Convert all costs to selected reporting currency using latest or historical rates
- **Real-Time Calculations**: Calculate totals, variances, and forecasts in base currency
- **Conversion Audit Trail**: Track which rate was used for each conversion

#### 4. Exchange Rate Synchronization
- **Daily Sync Job**: Scheduled task (cron/scheduler) to fetch ECB rates daily
- **ECB API Integration**: Use ECB's REST API for EUR-based rates (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml)
- **Fallback Handling**: Handle API failures gracefully (retry logic, notifications)
- **Rate Update Notifications**: Notify admins of sync failures or significant rate changes
- **Sync History**: Log sync operations (success/failure, timestamp, rates updated)

#### 5. Multi-Currency Cost Tracking
- **Cost Entry**: Enter costs in their native currency (e.g., invoice in EUR, material purchase in USD)
- **Automatic Conversion**: System converts to project base currency using transaction date rate
- **Dual Display**: Show both original currency and converted amount
- **Currency Indicators**: Visual indicators (flags/icons) for currency types in UI

#### 6. Reporting & Analytics
- **Multi-Currency Reports**: Generate reports in any selected currency
- **Currency Breakdown**: Show cost breakdown by currency type
- **Exchange Rate Impact**: Analyze how exchange rate fluctuations affect project costs
- **Historical Reporting**: Use historical rates for accurate period-based reporting

### Technical Implementation

#### Database Schema Additions
```sql
-- Add currency to organizations table
organizations.currency VARCHAR(3) DEFAULT 'EUR'

-- Exchange rates table
exchange_rates (
  id, date, base_currency, target_currency, rate, 
  source, created_at, updated_at
)

-- Exchange rate sync log
exchange_rate_syncs (
  id, sync_date, status, rates_updated, 
  error_message, created_at
)
```

#### ECB API Integration
- **Endpoint**: `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`
- **Format**: XML (or JSON via alternative endpoints)
- **Update Frequency**: Daily (ECB updates around 16:00 CET)
- **Rate Calculation**: For non-EUR base currencies, calculate cross-rates (e.g., USD/SAR = EUR/SAR / EUR/USD)

#### Scheduled Job
- **Timing**: Daily at 17:00 CET (after ECB update)
- **Error Handling**: Retry logic (3 attempts with exponential backoff)
- **Notification**: Email/Slack alert on persistent failures
- **Manual Trigger**: Allow admins to manually trigger sync

#### Conversion Logic
- **Transaction Date Rate**: Use rate from transaction date (historical accuracy)
- **Latest Rate**: Use latest available rate for real-time reporting
- **Missing Rate Handling**: Use most recent available rate or alert user
- **Cross-Rate Calculation**: Calculate rates between non-EUR currencies using EUR as intermediary

### Future Enhancements
- **Alternative Rate Sources**: Fallback to other providers (e.g., Fixer.io, ExchangeRate-API) if ECB fails
- **Custom Rate Sources**: Allow organizations to use their own rate provider/API
- **Rate Locking**: Option to lock rates for specific periods (budget approval, contract pricing)
- **Currency Hedging**: Track hedging strategies/contracts (advanced feature)
- **Tax Implications**: Consider VAT/tax calculations in different currencies
- **Bank Fees**: Account for currency conversion fees in cost calculations

---

## **Integration Points**

### Existing System Integration
- **Cost Management**: All cost entries respect currency settings and convert automatically
- **Procurement**: Material costs from vendors in different currencies convert to project base
- **Reports**: All financial reports support multi-currency display and conversion
- **Analytics**: Cost variance analysis accounts for exchange rate impacts

### Database Tables to Enhance
- `organizations` - Add `currency` field
- `projects` - Already has `currency` field, may need enhancements
- `costItems` - Already has `currency` field, needs conversion logic
- `resources` - Already has `currency` field, needs conversion logic

### New Tables Required
- `exchange_rates` - Historical exchange rates
- `exchange_rate_syncs` - Sync operation log
- `procurement_requisitions` - Procurement requests
- `resource_requirements` - Task-resource requirements
- `inventory_allocations` - Project-resource allocations
- `cost_breakdown_structure` - Hierarchical CBS (optional enhancement)

---

## **Implementation Priority**

### Phase 1: Currency Exchange Foundation
1. Add currency fields to organizations
2. Create exchange_rates and exchange_rate_syncs tables
3. Implement ECB API integration
4. Create daily sync scheduler
5. Add currency conversion utility functions

### Phase 2: Enhanced Cost Management
1. Enhance costItems with commitment tracking
2. Add cost breakdown structure (CBS)
3. Implement forecasting calculations
4. Add cost reports to Reports page
5. CSV import/export for costs

### Phase 3: Procurement System
1. Create procurement_requisitions table
2. Create resource_requirements table
3. Create inventory_allocations table
4. Build resource requirement planning UI
5. Build procurement workflow UI
6. CSV import/export for procurement

### Phase 4: Integration & Polish
1. Multi-currency cost display
2. Currency conversion in reports
3. Exchange rate impact analysis
4. End-to-end testing
5. Documentation

---

## **User Experience Considerations**

### Cost Management
- Currency selector dropdown in project settings
- Rate display section showing current exchange rates
- Conversion toggle between original vs. converted currency
- Rate alerts when rates change significantly (>5% fluctuation)

### Procurement
- Visual indicators for inventory availability
- Color-coded status (available/allocated/needs-procurement)
- Timeline view showing resource needs vs. availability
- Quick actions: "Check Inventory", "Create Requisition", "Reserve Resource"

---

*Last Updated: Development Phase 1.2 Complete - Ready for Phase 1.3*

