# Dashboard Frontend Optimization & Bug Report

Based on a code review of `@volvecapital/dashboard`, several potential bugs, unhandled edge cases, and optimization opportunities have been identified across API fetching, state management, routing, and form handling.

## 1. Unsafe JSON Parsing on API Errors (Potential App Crash)
**Location:** `src/services/*.service.ts` (e.g., `account.service.ts`)
**Issue:** 
The API services blindly parse error responses using `await response.json()`.
```typescript
if (!response.ok) {
  const errorData = await response.json() // ❌ Throws Syntax Error if response is HTML
}
```
If the backend returns a `502 Bad Gateway`, a `413 Payload Too Large` from an ingress controller, or any unhandled framework crash that replies with an HTML error page, this code will throw an unhandled `SyntaxError: Unexpected token < in JSON at position 0`.
**Optimization:**
Update `generateApiFetch` or the individual service checks to verify the response content type before parsing JSON, or wrap it in a try-catch block.
```typescript
const isJson = response.headers.get('content-type')?.includes('application/json')
const errorData = isJson ? await response.json() : { message: response.statusText }
```

## 2. Missing Request Cancellation (Race Conditions)
**Location:** `src/services/*.service.ts` & Route Query initializations
**Issue:** 
TanStack Query is integrated, but the `fetch` calls in `api-fetch.util.ts` do not accept or utilize an `AbortSignal`. When users rapidly switch filters, pages, or routes, previous redundant network requests cannot be canceled. This will cause race conditions where an older request resolves last and replaces newer data.
**Optimization:**
1. Update `getAllAccount` and other service functions to accept `{ signal ?: AbortSignal }` inside `params` or as an argument.
2. Pass this signal down into `generateApiFetch`'s `fetchInit` parameter.
3. In `useQuery`, extract the signal from the query function context:
```typescript
useQuery({
  queryKey: ['account', searchParam],
  queryFn: ({ signal }) => accountService.getAllAccount({ ...searchParam, signal }),
})
```

## 3. Form Updating UX (Account Editing)
**Location:** `src/components/forms/account-edit.form.tsx`
**Issue:** 
The Zod validation schema requires `account_password: z.string().nonempty()`. While needed when creating an account, requiring a password on *edit* prevents partial updates. Users who only want to update a billing cycle or a label are forced to either resubmit the current password or enter a new one.
**Optimization:**
Make the password `z.string().optional()` inside `AccountEditFormSchema` or use `.passthrough()`/`.partial()` if the underlying `PATCH` endpoint accepts omission. If not, only mandate the field on creation via separated schemas (`AccountCreateSchema` vs `AccountUpdateSchema`).

## 4. Missing Error Boundaries & Fallback States
**Location:** `src/routes/__root.tsx` & `src/routes/dashboard/route.tsx`
**Issue:**
The TanStack Router root configurations do not implement `errorComponent` or `pendingComponent`. Thus, when React encounters an unhandled runtime exception or a query suspend boundary fails, the entire React DOM unmounts (crash) rather than gracefully falling back to a UI state.
**Optimization:**
Add global error bounds and loading fallbacks to routes.
```tsx
export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (...),
  errorComponent: ({ error }) => <ErrorStateUI error={error} />,
  pendingComponent: LoadingSpinner,
})
```

## 5. Sub-optimal Rendering Dependencies
**Location:** `src/routes/dashboard/account/index.tsx`
**Issue:**
There is a heavy `useEffect` utilizing `JSON.stringify(freshData) !== JSON.stringify(selectedAccount)` running every time `accounts` changes. Serializing large payload objects inside render loops degrades performance. 
**Optimization:**
Instead of `useEffect`, derive `selectedAccount` directly during render by checking the ID against the newly fetched data, or rely purely on TanStack Query's cache instead of copying React Query state into React `useState` unnecessarily. If a component needs selected data, pass the ID downwards and let `useQuery(..., select: (data) => data.find(x => x.id === selectedId))` handle it.
