# Contracts: Mobile UI Refinements

No API contracts are introduced or modified by this feature.

This is a frontend-only feature affecting CSS layout and one component's internal state (EdgeZoneOverlay hint timer). All existing API endpoints remain unchanged.

## Component Interface Changes

The only interface change is a new prop on `EdgeZoneOverlay`:

```typescript
// EdgeZoneOverlay.tsx — new prop addition
interface EdgeZoneOverlayProps {
  // ... existing props unchanged ...
  dataLoaded: boolean;  // NEW: triggers 3s delayed hint visibility
}
```

All other components maintain their existing interfaces.
