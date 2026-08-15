# Phase 4 Testing Guide

## Prerequisites
1. MongoDB connection is active (check via GET /health)
2. Server is running on port 5000 (or PORT from .env)
3. Zod is installed (`npm install zod`)

## Test Case 1: Full CRUD Flow
**Goal:** Create a category, create a product in that category, edit the product's price, delete the product, confirm a GET afterward returns 404.

### Step 1: Create a Category
```bash
POST http://localhost:5000/api/v1/admin/categories
Content-Type: application/json

{
  "name": "Pain Relief",
  "slug": "pain-relief",
  "active": true
}
```

**Expected Response:** 201 Created with category object including `_id`

### Step 2: Create a Product in that Category
```bash
POST http://localhost:5000/api/v1/admin/products
Content-Type: application/json

{
  "name": "Panadol 500mg",
  "description": "Pain relief tablets",
  "price": 150,
  "sku": "PAN-500",
  "categoryIds": ["<CATEGORY_ID_FROM_STEP_1>"],
  "stockStatus": "in_stock"
}
```

**Expected Response:** 201 Created with product object including `_id`

### Step 3: Edit the Product's Price
```bash
PUT http://localhost:5000/api/v1/admin/products/<PRODUCT_ID_FROM_STEP_2>
Content-Type: application/json

{
  "price": 175
}
```

**Expected Response:** 200 OK with updated product object showing new price

### Step 4: Delete the Product
```bash
DELETE http://localhost:5000/api/v1/admin/products/<PRODUCT_ID_FROM_STEP_2>
```

**Expected Response:** 204 No Content

### Step 5: Confirm GET Returns 404
```bash
GET http://localhost:5000/api/v1/admin/products/<PRODUCT_ID_FROM_STEP_2>
```

**Expected Response:** 404 with error message "Product not found"

---

## Test Case 2: Missing Required Field Validation
**Goal:** Submit a product with a missing required field (e.g. no name) — confirm a 400 with a clear validation message, not a 500.

```bash
POST http://localhost:5000/api/v1/admin/products
Content-Type: application/json

{
  "description": "Missing name and price and sku",
  "stockStatus": "in_stock"
}
```

**Expected Response:** 400 Bad Request with validation details showing which fields are required

Example expected error:
```json
{
  "status": "error",
  "message": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Product name is required"
    },
    {
      "field": "price",
      "message": "Required"
    },
    {
      "field": "sku",
      "message": "SKU is required"
    }
  ]
}
```

---

## Test Case 3: Mass Assignment Protection
**Goal:** Submit a field the endpoint doesn't recognize (e.g. try setting `role` on a product update) — confirm it's silently ignored, not accepted or applied.

### Step 1: Create a test product
```bash
POST http://localhost:5000/api/v1/admin/products
Content-Type: application/json

{
  "name": "Test Product",
  "price": 100,
  "sku": "TEST-001"
}
```

### Step 2: Try to update with an unrecognized field
```bash
PUT http://localhost:5000/api/v1/admin/products/<PRODUCT_ID_FROM_STEP_1>
Content-Type: application/json

{
  "price": 120,
  "role": "admin",
  "isAdmin": true,
  "secretField": "should-not-be-set"
}
```

**Expected Response:** 200 OK with updated product showing only the price change

**Critical Check:** The response should:
- Show `price: 120` (the valid field was updated)
- NOT have `role`, `isAdmin`, or `secretField` properties
- The unrecognized fields were silently ignored by Zod's strict mode

### Step 3: Verify the product doesn't have those fields
```bash
GET http://localhost:5000/api/v1/admin/products/<PRODUCT_ID_FROM_STEP_1>
```

**Expected Response:** Product object with only valid schema fields, no `role`, `isAdmin`, or `secretField`

---

## Success Criteria
All three test cases must pass:
1. ✅ Full CRUD flow works, DELETE followed by GET returns 404
2. ✅ Missing required fields return 400 with clear validation messages
3. ✅ Unrecognized fields are silently ignored (mass assignment protection)
