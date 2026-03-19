---
name: generate-api-docs
description: Generate OpenAPI/Swagger documentation from route definitions.
category: documentation
---

# /generate-api-docs

Generate API documentation from the codebase's route definitions.

## Steps

1. **Detect the framework**: Express, FastAPI, Gin, Rails, Django REST, NestJS, etc.

2. **Extract all routes**:
   - HTTP method (GET, POST, PUT, DELETE, PATCH)
   - Path with parameters (`/users/:id`)
   - Request body schema (infer from usage or types)
   - Query parameters
   - Response schemas
   - Authentication requirements (look for middleware)

3. **Generate OpenAPI 3.0 spec**:
   ```yaml
   openapi: "3.0.0"
   info:
     title: <Project Name> API
     version: "1.0.0"
   paths:
     /users/{id}:
       get:
         summary: Get user by ID
         parameters:
           - name: id
             in: path
             required: true
             schema:
               type: string
         responses:
           "200":
             description: User found
           "404":
             description: User not found
   ```

4. **Infer schemas** from TypeScript types/interfaces, Python Pydantic models, or Go structs.

5. **Write** the spec to `docs/openapi.yaml` (or `openapi.json`).

6. **Optionally generate** a markdown summary for quick human reading.

7. **Report**: "Generated OpenAPI spec for N endpoints in docs/openapi.yaml"
