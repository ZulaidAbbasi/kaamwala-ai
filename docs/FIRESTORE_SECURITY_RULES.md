# KaamWala AI — Firestore Security Rules

**Last Updated:** 2026-05-16
**Mode:** Production
**Architecture:** All writes via Admin SDK (backend). Mobile reads scoped to authenticated user.

---

## Design Principles

1. **No public writes.** Every write goes through Cloud Functions using Admin SDK, which bypasses security rules entirely.
2. **Authenticated reads only.** Every read requires `request.auth != null`.
3. **Owner-scoped data.** Users can only read their own service requests, bookings, and traces.
4. **Provider profiles are public-readable** (limited fields via client-side queries — full docs readable since they contain no PII).
5. **Admin SDK bypasses rules.** Backend has unrestricted access.

---

## MVP Rules Strategy

For the hackathon MVP, we use a **safe-but-practical** rule set:

- All writes are denied at the rule level (backend uses Admin SDK which bypasses rules)
- Reads are gated by authentication
- Owner checks use `customerUid` or `workflowId` chain
- Provider profiles allow authenticated reads (they contain no real PII — demo data only)

### Limitations Documented

| Limitation | Why Acceptable for MVP | Production Fix |
|-----------|----------------------|---------------|
| No field-level read restrictions on provider_profiles | Demo data only, no real PII | Add `readFields` projection |
| workflowId ownership checked by matching customerUid in parent | Requires extra read | Use subcollections or custom claims |
| No rate limiting in rules | Cloud Functions handle rate limiting | Add `request.time` checks |

---

## Rule Walkthrough

### users
- Read: owner only (`request.auth.uid == resource.data.uid`)
- Write: denied (Admin SDK creates user docs on auth)

### provider_profiles
- Read: any authenticated user (data is public business info, no PII)
- Write: denied (Admin SDK only)

### service_requests
- Read: owner only (`request.auth.uid == resource.data.customerUid`)
- Write: denied

### provider_candidates, ranking_decisions, price_estimates
- Read: workflow owner (match `customerUid` in linked `service_requests`)
- For MVP simplicity: allow authenticated reads (backend creates all docs with correct ownership)
- Write: denied

### bookings
- Read: customer who created it (`customerUid`) OR assigned provider (`providerId` mapped via `ownerUid`)
- Write: denied

### booking_events, notifications
- Read: authenticated users who own the parent booking
- For MVP: authenticated reads (all data created by backend with correct ownership)
- Write: denied

### fallback_events
- Read: workflow owner
- Write: denied

### agent_traces
- Read: workflow owner (who submitted the original request)
- For MVP: authenticated reads
- Write: denied

### app_metrics
- Read: denied (admin dashboard only — not built for MVP)
- Write: denied
