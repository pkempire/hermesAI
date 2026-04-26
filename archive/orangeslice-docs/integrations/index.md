# Integrations

Access external APIs through `integrations.<provider>.<function>()`.

## Available Providers

### HubSpot

CRM operations for contacts, companies, and deals.

```typescript
// Create a contact
const result = await integrations.hubspot.createContact({
   properties: { email: "john@example.com", firstname: "John" }
});

// Search for deals
const deals = await integrations.hubspot.searchDeals({
   filterGroups: [
      {
         filters: [{ propertyName: "dealstage", operator: "EQ", value: "closedwon" }]
      }
   ]
});
```

See [hubspot/](./hubspot/) for all available functions.

### Instantly

Cold email outreach and campaign management.

```typescript
// Add a lead to a campaign
const lead = await integrations.instantly.createLead({
   email: "john@example.com",
   first_name: "John",
   company_name: "Acme Inc",
   campaign: "campaign-uuid"
});

// Bulk add leads
await integrations.instantly.bulkAddLeads({
   campaign_id: "campaign-uuid",
   leads: [
      { email: "john@example.com", first_name: "John" },
      { email: "jane@example.com", first_name: "Jane" }
   ]
});

// Get campaign analytics
const analytics = await integrations.instantly.getCampaignAnalytics("campaign-uuid");
console.log(analytics.open_rate, analytics.reply_rate);
```

See [instantly/](./instantly/) for all available functions.

### HeyReach

LinkedIn automation and outreach management.

```typescript
// Add leads to a campaign
const result = await integrations.heyreach.addLeadsToCampaignV2({
   campaignId: 12345,
   accountLeadPairs: [
      {
         linkedInAccountId: 67890,
         lead: {
            firstName: "John",
            lastName: "Doe",
            profileUrl: "https://linkedin.com/in/johndoe",
            companyName: "Acme Inc"
         }
      }
   ]
});
console.log(`Added: ${result.addedLeadsCount}`);

// Get leads from a campaign
const { items } = await integrations.heyreach.getLeadsFromCampaign({
   campaignId: 12345,
   limit: 100
});

// Send a message
await integrations.heyreach.sendMessage({
   conversationId: "conv-123",
   linkedInAccountId: 67890,
   message: "Thanks for connecting!"
});
```

See [heyreach/](./heyreach/) for all available functions.

### Salesforce

CRM operations using SOQL queries and the Salesforce REST API.

```typescript
// Query records
const result = await integrations.salesforce.query(
   "SELECT Id, Name, Email FROM Contact WHERE AccountId = '001xx000003DGbYAAW'"
);

// Create a record
const contact = await integrations.salesforce.createRecord("Contact", {
   FirstName: "John",
   LastName: "Doe",
   Email: "john@example.com"
});

// Update a record
await integrations.salesforce.updateRecord("Contact", contact.id, {
   Phone: "+1234567890"
});
```

See [salesforce/](./salesforce/) for all available functions.

### Slack

Workspace messaging, channels, users, and Slack Connect.

```typescript
// Send a message
const result = await integrations.slack.chatPostMessage({
   channel: "C1234567890",
   text: "Hello from Orange Slice!",
   blocks: [{ type: "section", text: { type: "mrkdwn", text: "*Bold* message" } }]
});

// List channels
const channels = await integrations.slack.conversationsList({
   types: "public_channel,private_channel"
});

// Find user by email
const user = await integrations.slack.usersLookupByEmail({
   email: "john@company.com"
});

// Send Slack Connect invite
const invite = await integrations.slack.conversationsInviteShared({
   channel: "C1234567890",
   emails: ["partner@external.com"]
});
```

See [slack/](./slack/) for all available functions.

### Gmail

Send emails from connected Google Gmail accounts.

```typescript
// Send a plain text email
const result = await integrations.gmail.sendEmail({
   recipient_email: "john@example.com",
   subject: "Quick update",
   body: "Hey John - sharing a quick status update."
});

// Send HTML with CC recipients
await integrations.gmail.sendEmail({
   recipient_email: "team@example.com",
   cc: ["manager@example.com"],
   subject: "Weekly summary",
   body: "<h2>Weekly Summary</h2><p>All systems operational.</p>",
   is_html: true
});
```

See [gmail/](./gmail/) for available functions.
