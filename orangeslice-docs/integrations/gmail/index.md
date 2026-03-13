---
description: Gmail email sending via Google integration
---

# Gmail Integration

Typed functions for Gmail actions powered by Orange Slice Google integrations.

## Email

- `integrations.gmail.sendEmail(input)` - Send an email through the connected Gmail account
- Heavy rate limit: `sendEmail` is capped at **40 calls/day** per connected Gmail account
