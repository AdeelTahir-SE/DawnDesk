# Finance Manager Removed UI Backlog

These Finance Manager surfaces were removed because they were UI-only, placeholder-like, or did not perform the workflow implied by the label. Keep this file as the implementation backlog for bringing them back later.

## Removed Navigation

- Integrations
  - Removed from the Finance Manager sidebar and route.
  - Previous screen only stored fake connected-app status in preferences.
  - Workflow automation was not wired to a background runner.
  - API key generation only created a local placeholder identifier.

## Removed Buttons And Tabs

- Cash & Treasury: Connect Bank
  - Reason: no live bank connector exists.
  - Future work: add real bank-provider integration, account linking, sync status, refresh jobs, and error handling.

- Accounts Payable: Electronic Payments
  - Reason: did not execute ACH, wire, or payment-provider transfers.
  - Future work: add payment provider setup, payable batch approval, execution, confirmation, failure states, and audit records.

- Procurement: Approval Workflows
  - Reason: only displayed derived pending PO totals; no approval routing or state transitions.
  - Future work: add approvers, approval steps, comments, approve/reject actions, notifications, and immutable audit events.

- Inventory & COGS: Valuation (FIFO/LIFO)
  - Reason: did not maintain purchase lots or cost layers; FIFO/LIFO buttons only changed labels around a simple quantity x unit cost calculation.
  - Future work: add inventory lots, receipts, costing layers, sale/issue transactions, FIFO/LIFO/weighted-average calculations, and adjustment history.

- Accounts Receivable: Recurring Billing
  - Reason: saved recurring-plan rows but did not generate invoices automatically.
  - Future work: add schedule runner, invoice generation, pause/resume, failed-run handling, and customer notifications.

- Accounts Receivable: Dunning & Collections
  - Reason: saved campaign rows but did not send reminders or apply collection workflows.
  - Future work: add overdue detection, email/provider integration, campaign steps, send logs, opt-out handling, and escalation state.

- Accounts Receivable: Revenue Recognition
  - Reason: saved schedules but did not post accounting entries or recognize revenue over time.
  - Future work: add recognition schedule engine, journal entry posting, period locking, deferred revenue balances, and audit reports.

- Tax Management: Jurisdictions
  - Reason: grouped tax-code strings only; no true jurisdiction model.
  - Future work: add jurisdiction records, nexus rules, tax applicability, effective dates, and validation.

- Tax Management: Tax Reporting
  - Reason: summarized configured rates only; no taxable transaction lines, liability report, filing, or remittance workflow.
  - Future work: add taxable line capture, liability calculations, filing-period reports, exports, and remittance status.

- Fixed Assets: Disposals
  - Reason: only counted non-active assets; no disposal/write-off workflow.
  - Future work: add disposal date, proceeds, gain/loss calculation, journal posting, attachments, and approval/audit trail.

- Compliance & Audit: Roles & Permissions
  - Reason: displayed persisted role rows but did not enforce app permissions.
  - Future work: add permission checks across finance actions, role assignment UI, policy evaluation, and tests for restricted actions.

- Finance Settings: Reset All Data
  - Reason: button had no handler.
  - Future work: add a confirmed destructive workflow, workspace-scoped deletion, export-before-delete option, audit logging, and recovery guidance.

## Schema Notes

No migration was needed for the removal work because the change only hides/removes unsupported frontend surfaces. Existing tables can remain in place for future implementation.

If these features are rebuilt later, add migrations only when the implementation requires new durable state such as bank connections, approval steps, inventory lots, recurring job runs, dunning send logs, revenue recognition postings, tax jurisdictions, disposal events, or permission assignments.
