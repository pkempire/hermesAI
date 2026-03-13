# updateFlow

Update an existing workflow.

```typescript
// First get the current flow to obtain revisionId
const currentFlow = await integrations.hubspot.getFlow("12345678");

// Update the flow
const updatedFlow = await integrations.hubspot.updateFlow("12345678", {
   revisionId: currentFlow.revisionId,
   name: "Updated Workflow Name",
   isEnabled: true
});
```

## Input

| Parameter                  | Type        | Description                                               |
| -------------------------- | ----------- | --------------------------------------------------------- |
| `flowId`                   | `string`    | The ID of the workflow to update                          |
| `input.revisionId`         | `string`    | **Required** - Current revision ID for optimistic locking |
| `input.name`               | `string`    | Updated name                                              |
| `input.description`        | `string`    | Updated description                                       |
| `input.isEnabled`          | `boolean`   | Enable/disable the workflow                               |
| `input.actions`            | `unknown[]` | Updated workflow actions                                  |
| `input.enrollmentCriteria` | `unknown`   | Updated enrollment criteria                               |

## Output

Returns the updated workflow object.

```typescript
{
  id: string;
  name?: string;
  description?: string;
  type: "CONTACT_FLOW" | "PLATFORM_FLOW";
  isEnabled: boolean;
  revisionId: string;
  objectTypeId: string;
  createdAt: string;
  updatedAt: string;
}
```
