---
description: Guide for building high-performance, lag-free data tables with local search isolation and stable animations.
---

# Building Performant Tables

This skill documents the standardized architecture for data tables in the ERP (TanStack Table + React Query). The goal is to prevent **Input Lag** and **Rendering Glitches** (empty tables).

## 1. Search State Isolation (The "Input Lag" Killer)

**Problem**: Managing `search` state at the Page level causes the entire page (and table) to re-render on every keystroke, causing severe typing lag.
**Solution**: Isolate the search state **inside** the Table component.

### Implementation Pattern

1.  **Parent Page (Smart Container)**:
    - Passes an initial `search` prop (usually from URL/State) but DOES NOT manage the live typing state.
    - Receives updates only when the user _stops_ typing.

2.  **Table Component (Dumb UI + Local Logic)**:
    - Maintains `internalSearch` state.
    - Uses `useDebounce` locally.
    - Syncs with parent only after debounce.

```tsx
// Inside Table Component
export function MyTable({
  search, // Initial/Parent value
  onSearchChange, // Update parent
}: Props) {
  // 1. Internal state for instant UI feedback (Zero Lag)
  const [internalSearch, setInternalSearch] = useState(search);

  // 2. Debounce internal state (500ms)
  const debouncedSearch = useDebounce(internalSearch, 500);

  // 3. Update parent ONLY when debounced value settles
  useEffect(() => {
    if (debouncedSearch !== search) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange, search]);

  // 4. Sync reverse (if parent updates search externally, e.g., URL clear)
  useEffect(() => {
    if (search !== internalSearch && search !== debouncedSearch) {
      setInternalSearch(search);
    }
  }, [search]);

  return (
    // ...
    <Input
      // 5. BIND TO INTERNAL STATE! (Critical)
      value={internalSearch}
      onChange={(e) => setInternalSearch(e.target.value)}
    />
  );
}
```

## 2. Stable Animations (The "Empty Table / Glitch" Killer)

**Problem**: Using `<AnimatePresence mode="wait">` without a unique key on the container causes React to unmount the old list before the new one is ready, forcing a "No results" state or flickering between filter changes.

**Solution**: Use `mode="popLayout"` and force a re-mount using filter keys on `TableBody`.

### Implementation Pattern

```tsx
// Inside Table Render
<Table>
  <ProcessTableHeader />

  {/* 
    CRITICAL: 
    1. Key must include ALL functional filters (search, tab, type, etc).
    2. This forces AnimatePresence to treat the list as a NEW component when filters change, 
       ensuring proper exit/enter transitions.
  */}
  <TableBody key={`${search}-${statusFilter.join(",")}`}>
    <AnimatePresence mode="popLayout">
      {/* mode="popLayout" allows immediate presence of new items while old ones exit */}

      {data.map((row) => (
        <motion.tr
          layout // Optional: smooth layout shifts
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* ... cells */}
        </motion.tr>
      ))}
    </AnimatePresence>
  </TableBody>
</Table>
```

## 3. Checklist for New Tables

1.  [ ] **Input Binding**: Is `<Input>` bound to `internalSearch`? (If bound to `props.search`, it will lag).
2.  [ ] **Refetching**: Does the parent Page use the _debounced_ value to trigger `useQuery`?
3.  [ ] **Keys**: Does `<TableBody>` have a `key` combining all active filters?
4.  [ ] **Mode**: Is `AnimatePresence` set to `popLayout`?
