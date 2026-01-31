# Implementing Server-Side Pagination & Filtering

This skill outlines the standard pattern for implementing high-performance tables with server-side pagination, sorting, and robust multi-filtering in the ERP.

## 1. Backend Implementation (NestJS)

### 1.1 Create Search DTO
Create a DTO in `dto/find-[resource].dto.ts`. It MUST support pagination parameters and robust array transformation for filters to handle comma-separated strings (e.g., `?status=A, B`).

**Standard DTO Pattern:**
```typescript
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindResourceDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 25; // Standard default

  @IsOptional()
  @IsString()
  search?: string;

  // Multi-value Filter
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Split by comma, trim whitespace, and remove empty entries
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return value;
  })
  @IsString({ each: true })
  status?: string[];
}
```

### 1.2 Service Logic
The service `findAll` method must handle `limit/offset` and build dynamic `WHERE` clauses.

**Key Requirements:**
1.  **Multi-Filter Support:** Use `inArray` when the filter is an array.
    ```typescript
    if (status && status.length > 0) {
      if (Array.isArray(status)) {
        conditions.push(inArray(table.status, status));
      } else {
        conditions.push(eq(table.status, status));
      }
    }
    ```
2.  **Search Logic:** Split search terms and use `OR` conditions across multiple fields (e.g., Code OR Name).
3.  **Return Structure:**
    ```typescript
    return {
      data: items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
    ```

## 2. Frontend Implementation (Next.js)

### 2.1 React Query Hook
The hook must serialize array parameters into comma-separated strings to be URL-friendly.

```typescript
export function useResource(params: FindParams = {}) {
  const serializedParams = {
    ...params,
    status: Array.isArray(params.status) ? params.status.join(",") : params.status,
  };
  
  return useQuery({
    queryKey: ["resource", serializedParams],
    // ...
  });
}
```

### 2.2 TanStack Table Component
The table component replaces client-side filtering with server-side state management.

1.  **Manual Pagination:**
    ```typescript
    const table = useReactTable({
      data,
      pageCount, // From API meta
      state: { pagination },
      onPaginationChange,
      manualPagination: true,
      // ...
    });
    ```
2.  **Multi-Select Filters:** Implement dropdowns that toggle values in a local array state (`string[]`) before passing them to the parent/hook.

### 2.3 Page Integration
The page component manages the state (`pagination`, `search`, `filters`) and passes it to the hook and the table.

```typescript
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 25,
});
// ...
```
