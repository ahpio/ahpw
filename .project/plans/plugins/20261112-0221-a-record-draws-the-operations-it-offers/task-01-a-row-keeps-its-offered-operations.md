---
title: A row keeps the operations its record offers
status: implemented
depends: []
layer: "bridges"
refs:
  - "[code://src/bridges/operations.ts#L78-L83](../../../../src/bridges/operations.ts#L78-L83) - `rowOperations`"
  - "[code://src/bridges/operations.test.ts](../../../../src/bridges/operations.test.ts) - its tests"
---

## Objective

`rowOperations` answers only the operations whose id the record's `operations` field names. A record without the field gets what it gets today.

## Files

- `UPDATE: src/bridges/operations.ts:78-83` - `rowOperations` filters by the record's `operations` when it is an array.
- `UPDATE: src/bridges/operations.test.ts` - the filter's cases.

## Steps

1. Read the merged ahpd code for the name and shape of the record's field before you change anything.
2. Keep the `kind` filter as it is.
3. When the record's `operations` is an array, keep only the operations whose `id` it holds.
4. When the record has no such field, answer as today.
5. Update the comment at the top of `operations.ts` to say a record names the operations it offers.

## Validation

- Test a record whose `operations` names Disable and Stop. Expect only those two.
- Test a record with no `operations`. Expect every operation of its kind.
- Test a record with an empty `operations`. Expect none.
- The test suite passes.

## Resume

