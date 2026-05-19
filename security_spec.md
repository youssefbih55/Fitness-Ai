# Security Specification - Fitness AI

## Data Invariants
1. A user can only read and write their own data (`userId` matches `request.auth.uid`).
2. Weight logs must have a number weight > 0.
3. Water intake must be positive.
4. User profiles must have basic identity fields.
5. Plans are immutable after creation (historical records).

## The Dirty Dozen Payloads

1. **Identity Spoofing**: Attempt to create a user profile for a different UID.
2. **PII Leak**: Authenticated user trying to read another user's weight log.
3. **Ghost Field Update**: Trying to add an `isAdmin` field to user profile.
4. **Invalid Type**: Updating weight with a string "heavy".
5. **Boundary Breach**: Setting water intake to -5 liters.
6. **Orphaned Write**: Creating a weight log without a valid user ID in path.
7. **Timestamp Spoofing**: Setting `createdAt` to a future date instead of `request.time`.
8. **Plan Modification**: Trying to update an old plan's data.
9. **Junk ID Poisoning**: Creating a document with a 1MB string as ID.
10. **State Shortcut**: Setting a "finished" status on a goal without meeting criteria (if applicable).
11. **PII Blanket Read**: Trying to list all `users` collection without filtering.
12. **Self-Promotion**: An unverified user trying to write to sensitive paths.

## Test Runner (Verifies PERMISSION_DENIED for all attacks)
[See firestore.rules.test.ts]
