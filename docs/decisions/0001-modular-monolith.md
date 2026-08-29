# ADR 0001: Modular monolith

Status: accepted
Date: 2026-08-29

## Context

Bike Stat needs Laravel backend capabilities, Vue UI, PWA behavior, GPX processing and persistence. Current scope is a personal application and does not justify independent service deployment.

## Decision

Keep backend, API and Vue frontend in one repository and one Laravel deployable. Maintain logical boundaries inside the application.

## Consequences

- simpler deployment and development;
- shared release/CI lifecycle;
- logical modules remain separable later if a concrete operational need appears.
