# Prospect Search Architecture (Canonical Path)

## Canonical backend entrypoints

- **Start search:** `POST /api/prospect-search/execute`
- **Stream progress:** `GET /api/prospect-search/stream?websetId=...`

Legacy endpoints are now deprecated (`410 Gone`):

- `POST /api/prospect-search`
- `GET /api/prospect-search/status`

## Request lifecycle

1. Client submits structured criteria to `execute`.
2. Server enforces auth and quota, creates/reuses Exa webset, and persists a campaign ownership record (`settings.exa_webset_id`).
3. `execute` returns a canonical **start** payload:
   - `type: "prospect_search_start"`
   - `event: "start"`
   - `websetId`, `searchCriteria`, `progress`
4. Client opens SSE connection to `stream` with `websetId`.
5. `stream` validates authenticated ownership (campaign record belongs to requester).
6. Server emits canonical stream events:
   - `prospect_search_start` (initial stream open)
   - `prospect_search_progress` (incremental progress/results)
   - `prospect_search_complete` (final success)
   - `prospect_search_error` (failure/timeout)

## Ownership and security model

- A user must be authenticated to call both `execute` and `stream`.
- `stream` authorizes access by checking for a campaign row where:
  - `campaigns.user_id = current user`
  - `campaigns.settings.exa_webset_id = requested websetId`
- If ownership check fails, stream is denied with `403`.
- This makes `websetId` non-transferable across users and prevents cross-tenant result access.

## Caller contract

All callers should handle a single event model:

- **Start:** `{ type: "prospect_search_start", event: "start", ... }`
- **Progress:** `{ type: "prospect_search_progress", event: "progress", prospects?: [], analyzed, found, ... }`
- **Complete:** `{ type: "prospect_search_complete", event: "complete", prospects: [] }`
- **Error:** `{ type: "prospect_search_error", event: "error", message }`

This contract is consumed by the interactive prospect search UI and tool adapters.
