# Make Email Subject Management Tenant-Specific

The issue is that the `EmailSubject` table is currently located exclusively in the `master` schema. As a result, all tenants share the exact same email subjects. When a new email subject is added in the dashboard, it is saved to the `master` database and applied to all tenants globally.

To resolve this and make email subject management independent for each tenant, we will move the `EmailSubject` configuration to the tenant-specific schemas.

## Proposed Changes

We will make the following changes to the database and backend architecture:

### 1. Database Migrations

#### [NEW] `apps/api/migrations/tenant/048-create-email-subject-table.ts`
Create the `email_subject` table in the tenant schemas. We will also write logic to automatically migrate the existing subjects from the `master` schema into each tenant's schema so you don't lose the subjects you have already created.

#### [NEW] `apps/api/migrations/master/011-drop-email-subject-table.ts`
Drop the now-obsolete `email_subject` table from the `master` schema.

---

### 2. API Backend (Apps API)

#### [MODIFY] `apps/api/src/modules/email-subject/email-subject.controller.ts`
- Extract the `tenantId` from the `@Headers('x-tenant-id')` object in all endpoint methods (`findAll`, `create`, `update`, `remove`).
- Pass the `tenantId` to the service layer.

#### [MODIFY] `apps/api/src/modules/email-subject/email-subject.service.ts`
- Update all methods to use `tenantId` (the schema name) instead of hardcoding `'master'`. 
- e.g., `await this.postgresProvider.setSchema(tenantId, transaction);`

---

### 3. Background Processor (Email Receiver)

#### [MODIFY] `apps/email-reciever/src/modules/email-forward/email-forward-processor.service.ts`
- Currently, the processor searches for matching email subjects inside the `master` schema. We will change this to search inside the `payload.tenant` schema instead.
- This ensures that when an email arrives, the system only processes it if the subject matches the ones configured specifically for that particular tenant.

> [!WARNING]
> This will require a database migration process on your VPS. After the code is merged, you will need to run the standard database migration command to copy the subjects and restructure the database.

## Verification Plan

### Automated Tests
N/A

### Manual Verification
1. Open the dashboard for Tenant A and add a new subject.
2. Open the dashboard for Tenant B and verify that the subject does *not* appear there.
3. Send a test email matching the subject for Tenant A, and verify it is successfully captured and processed by the system.
