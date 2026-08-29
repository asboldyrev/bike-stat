# ADR 0004: Anonymous users with per-device bearer credentials

Status: accepted
Date: 2026-08-29

## Context

Bike Stat is primarily for personal use. Email/password registration adds product and operational complexity without current value, but server data still needs a stable owner and protected API access across devices.

## Decision

Create an anonymous server-side user on first use and issue a high-entropy device-specific bearer credential.

Each device receives an independent credential. Persist only token hashes server-side.

Adding a device uses a separate short-lived one-time pairing token/link. Redeeming it creates a new device credential for the same user.

A device token and pairing token are distinct credential types and must never be interchangeable.

## Consequences

- no email/password UI is required for MVP;
- devices can be revoked independently;
- pairing can support QR/link UX;
- browser token storage raises XSS/CSP importance;
- account recovery without any remaining authorized device is intentionally not solved by this MVP.
