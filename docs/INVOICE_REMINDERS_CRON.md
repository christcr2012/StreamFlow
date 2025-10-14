# Invoice Reminders Cron Setup

This document describes how to set up automatic invoice reminders using cron jobs or scheduled tasks.

## Overview

The invoice reminder system sends automatic email notifications to customers when invoices become overdue. The system supports three reminder types:

- **3-Day Overdue**: Sent 3 days after the invoice due date
- **7-Day Overdue**: Sent 7 days after the invoice due date
- **14-Day Overdue**: Sent 14 days after the invoice due date

## Manual Reminders

Manual reminders can be sent from the invoice detail page using the "Send Reminder" button. The system automatically determines the appropriate reminder type based on how many days past due the invoice is.

## Automatic Reminders (Future Implementation)

To enable automatic reminders, you need to create a cron job or scheduled task that:

1. Queries for overdue invoices
2. Checks if reminders have already been sent
3. Calls the reminder API endpoint for each invoice

### Recommended Approach

Create a server-side script that runs daily and processes overdue invoices:

```typescript
// scripts/send-invoice-reminders.ts
import { prisma } from '../apps/tenant-app/src/lib/prisma';

async function sendInvoiceReminders() {
  const now = new Date();
  
  // Find all unpaid invoices with due dates
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { not: 'paid' },
      dueDate: { lt: now },
    },
    include: {
      reminders: true,
      customer: {
        select: {
          primaryEmail: true,
        },
      },
    },
  });

  for (const invoice of overdueInvoices) {
    if (!invoice.customer?.primaryEmail) continue;

    const daysPastDue = Math.floor(
      (now.getTime() - invoice.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine which reminders to send
    const shouldSend3Day = daysPastDue >= 3 && !invoice.reminders.some(r => r.reminderType === 'overdue_3days');
    const shouldSend7Day = daysPastDue >= 7 && !invoice.reminders.some(r => r.reminderType === 'overdue_7days');
    const shouldSend14Day = daysPastDue >= 14 && !invoice.reminders.some(r => r.reminderType === 'overdue_14days');

    if (shouldSend3Day || shouldSend7Day || shouldSend14Day) {
      // Call the reminder API endpoint
      await fetch(`${process.env.APP_URL}/api/invoices/${invoice.id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      });
    }
  }
}

sendInvoiceReminders().catch(console.error);
```

### Cron Job Setup

#### Linux/macOS (crontab)

```bash
# Run daily at 9:00 AM
0 9 * * * cd /path/to/cortiware && node scripts/send-invoice-reminders.js
```

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create a new task
3. Set trigger to daily at 9:00 AM
4. Set action to run: `node C:\path\to\cortiware\scripts\send-invoice-reminders.js`

#### Vercel Cron Jobs

If deploying to Vercel, you can use Vercel Cron Jobs:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-invoice-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Then create the API route:

```typescript
// apps/tenant-app/src/app/api/cron/send-invoice-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run reminder logic here
  // ...

  return NextResponse.json({ success: true });
}
```

## Security Considerations

1. **Authentication**: Protect the cron endpoint with a secret token
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Logging**: Log all reminder attempts for audit purposes
4. **Error Handling**: Implement retry logic for failed email sends

## Testing

Test the reminder system manually before enabling automatic cron jobs:

1. Create a test invoice with a past due date
2. Navigate to the invoice detail page
3. Click "Send Reminder" button
4. Verify the email is sent and reminder is logged

## Monitoring

Monitor reminder delivery:

1. Check the "Reminder History" section on invoice detail pages
2. Review failed reminders and error messages
3. Monitor email service logs for delivery issues

## Future Enhancements

- Configurable reminder schedules per organization
- Custom reminder templates
- SMS reminders (using existing Twilio integration)
- Reminder escalation (CC manager after X days)
- Automatic late fees

