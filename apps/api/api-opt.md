# apps/api Code Analysis & Optimization Report

Based on the review of the NestJS application under `apps/api`, a number of potential bugs, security vulnerabilities, and code improvement opportunities have been identified. 

## 🚨 Critical Security Vulnerabilities

### 1. Tenant Escape / Broken Access Control in `VcAuthGuard`
**Location:** `apps/api/src/guards/vc-auth.guard.ts` (Lines 114-118)
**Description:** 
The auth guard correctly verifies the JWT token and extracts the `tokenPayload`. For non-ADMIN users, it even queries the database to ensure the tenant defined in `tokenPayload.tenant_id` exists. However, it overrides `req.tenant_id` with the value supplied in the `x-tenant-id` header *without verifying* that it matches the user's `tokenPayload.tenant_id`.
```typescript
const tenant_id = req.headers['x-tenant-id'] as string;
if (!tenant_id) {
  throw new NotFoundException('Missing tenant id');
}
req.tenant_id = tenant_id; // Vulnerability: blindly trusts the header
```
**Impact:** A malicious non-admin user can supply a valid JWT for Tenant A, inject `x-tenant-id: Tenant-B`, and subsequently execute queries against Tenant B's schema.
**Fix:** Validate that the requested header matches the token payload:
```typescript
if (tokenPayload.role !== 'ADMIN' && tenant_id !== tokenPayload.tenant_id) {
    throw new UnauthorizedException('Tenant mismatch');
}
```

### 2. SQL Injection Vulnerability in `PostgresProvider`
**Location:** `apps/api/src/database/postgres.provider.ts` (Line 114)
**Description:**
The `setSchema` method uses template literals to perform string interpolation directly into a SQL query:
```typescript
await this.sequelize.query(`SET search_path TO ${schema}`, { transaction });
```
**Impact:** Because the `schema` parameter originates from `req.tenant_id` (which, as noted above, is drawn directly from the `x-tenant-id` HTTP header), an attacker could inject malicious SQL. Even if it's a UUID, string interpolating user-controlled data into SQL is a catastrophic practice.
**Fix:** Use parameterized queries or explicitly escape/sanitize the `schema` identifier before interpolation.

---

## 🐛 Bugs and Reliability Issues

### 1. Missing Transaction Propagations
**Location:** `apps/api/src/modules/product/product.service.ts` (Line 190)
**Description:** In the `update` method, a database transaction is created, but it is not passed to the `update` call:
```typescript
await product.update({ ...updateProductDto }); // Missing { transaction }
```
**Fix:** Include the transaction object:
```typescript
await product.update({ ...updateProductDto }, { transaction });
```

### 2. Transaction Edge Case in `product.service.ts`
**Location:** `apps/api/src/modules/product/product.service.ts` (Lines 116-118)
**Description:** The `{ transaction }` options object is passed inconsistently. The `count` call and `create` call pass it, but if validation fails in other parts logically attached, the rollback will occur for partial states.

### 3. Sequelize `findAndCountAll` Cartesian Explosion
**Location:** `apps/api/src/modules/transaction/transaction.service.ts` (Lines 99-135)
**Description:** You are using `findAndCountAll` with deeply nested `include` arrays (e.g., Transaction -> TransactionItem -> AccountUser -> Account -> Email & ProductVariant).
Using `findAndCountAll` with deep includes in Sequelize implicitly uses `LEFT OUTER JOIN`s, which can drastically multiply rows and cause inaccurate counts or memory bloat unless `distinct: true` is explicitly specified.
**Fix:** Add `distinct: true` to the query options.

---

## 💡 Code Improvements and Best Practices

### 1. Avoid Magic Strings
**Location:** `apps/api/src/guards/vc-auth.guard.ts` & others
**Description:** Strings like `'ADMIN'`, `'active'`, it's better to use predefined Enums or Constants (`UserRole.ADMIN`, `AccountStatus.ACTIVE`). This enhances type safety and find-and-replace refactoring.

### 2. Dynamic Model Registration
**Location:** `apps/api/src/database/postgres.provider.ts`
**Description:** The models are explicitly added via an array inside `this.sequelize.addModels([...])`. This requires manual updates every time a new model is introduced.
**Improvement:** Use `@nestjs/sequelize` properly or utilize `import * as models` dynamic resolution to automatically inject models from the `process.cwd()` or `__dirname` models directory.

### 3. Replace Complex CTEs with Sequlelize Methods or Views
**Location:** `apps/api/src/modules/account/account.service.ts` (Line 713+)
**Description:** A massive, multi-CTE raw query is used for analytics (`countStatusAccount`). This is hard to maintain, un-testable via unit tests, and prone to breaking on schema changes.
**Improvement:** If this raw query is necessary for performance reasons, migrate it to a PostgreSQL `VIEW` or `MATERIALIZED VIEW` rather than storing huge query strings in the service layer. You can then query the view like a normal Sequelize model.

### 4. Cache Utilization
**Location:** `app.module.ts`
**Description:** `CacheModule` is imported but doesn't appear to be meaningfully leveraged for master data (like `products`, `product-variants`). Implementing `@UseInterceptors(CacheInterceptor)` on public endpoints or caching static settings can greatly reduce the unnecessary DB queries.

### 5. Repetitive Rollback Logic
**Location:** Across all Service classes
**Description:** Using manual transactions `const tx = await this.postgresProvider.transaction(); try { ... } catch { await tx.rollback(); }` everywhere pollutes the code.
**Improvement:** Implement a centralized Transaction Interceptor or use `cls-hooked` (Continuation Local Storage) commonly implemented via libraries like `sequelize-cls` to automatically handle transaction commits/rollbacks at the end of the request lifecycle.
