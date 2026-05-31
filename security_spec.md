# Security Specification & "Dirty Dozen" Threat Model

This document outlines the security architecture and validation constraints governing the Infinite Sequence real-time engine built on Firestore.

## 1. Game Data Invariants

1. **Host-Player Integrity**: The host of standard rooms cannot register a game session with empty player lists.
2. **Current Turn Restraints**: Cards played can only be done on the current player's relative turn indicator.
3. **Immutability of Play Fields**: Past placed chips on cells cannot be overwritten, modified, or cleared by other players. Only wildcards can place a chip, and one-eyed Jacks can remove a chip from a non-completed sequence.
4. **Timestamp Continuity**: Every creation and board update must strictly set `createdAt` and `updatedAt` to `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads

The following 12 payloads are designed to challenge our Zero-Trust architecture. Our rules are mathematically structured to deny them:

1. **Anonymous Impersonation Attack**: Creating a game where player `uid` does not match the authenticated `request.auth.uid`.
2. **Ghost Field Field Injection**: Appending arbitrary fields like `adminBypass: true` or `tokensCount: 99` to bypass checks.
3. **Double Placement Attack**: Modifying another player's chip on the board.
4. **Status Hijacking**: Moving game status from `waiting` directly to `completed` without plays.
5. **Turn Skipping**: Player playing during the opponent's turn.
6. **Deck Invalidation**: Altering `deckCount` to an arbitrary negative number or empty list.
7. **Junk Character Room Poisoning**: Creating rooms with non-regex IDs, e.g., `/games/!!!!poison!!!!`.
8. **Malicious Future Timestamps**: Setting `createdAt` or `updatedAt` to values in the future.
9. **Private Information Inspection**: Reading other players' private hand deck elements if stored.
10. **Lobby Query Grabbing**: Scraping private ongoing rooms without filtering tags is blocked by the Query Enforcer.
11. **Winner Forgery**: Setting `winner` directly to player's `uid` during mid-match update.
12. **Self-Assigned Host Privileges**: Joining a room and setting oneself as host.

## 3. Security Hardening Strategy

Our ruleset uses:
- Reusable type confirmation predicates (`isValidId`).
- `affectedKeys()` sets checks to allowlist specific transition paths (Action: Match creation, Action: Joining a lobby, Action: Placing a chip/playing a card).
- Default denies for all wild reads.
- Synchronized timestamp enforcement against `request.time`.
