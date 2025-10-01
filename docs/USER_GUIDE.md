# StreamFlow User Guide

**Version**: 1.0.0-beta  
**Last Updated**: 2025-01-01

---

## 📚 TABLE OF CONTENTS

1. [Getting Started](#getting-started)
2. [Client Portal](#client-portal)
3. [Customer Portal](#customer-portal)
4. [Provider Portal](#provider-portal)
5. [AI Features](#ai-features)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 GETTING STARTED

### For Service Providers (Clients)

#### 1. Register Your Organization
1. Go to your StreamFlow instance
2. Click "Register"
3. Enter your email, password, and company name
4. You'll be automatically logged in as the OWNER

#### 2. Set Up Your Organization
1. Configure your vertical (industry)
2. Set AI power levels
3. Purchase AI credits
4. Add team members
5. Import customers

#### 3. Start Using AI
1. Enable AI agents you want to use
2. Set power levels (ECO/STANDARD/MAX)
3. Monitor credit usage
4. Review AI task results

### For Customers

#### 1. Get Your Access Token
Your service provider will give you an access token to log in to the customer portal.

#### 2. Access the Portal
1. Go to `/customer/login`
2. Enter your access token
3. Access your dashboard

#### 3. Use Self-Service Features
- View job history
- Request appointments
- Give feedback
- Track service status

---

## 💼 CLIENT PORTAL

### Dashboard
Your main hub for managing your field service business.

**Key Metrics**:
- Total jobs
- Completed jobs
- Upcoming appointments
- AI credit balance
- Adoption rate

### AI Power Management

#### Power Levels
- **ECO** (1×): Basic AI, lowest cost
- **STANDARD** (2×): Balanced performance and cost
- **MAX** (5×): Best AI, highest cost

#### Setting Power Levels
1. Go to AI Settings
2. Choose default power level
3. Set overrides for specific features
4. Configure role ceilings (employees limited to STANDARD)

### Credit Management

#### Purchasing Credits
1. Go to Credits page
2. Choose amount
3. Complete payment
4. Credits added instantly

#### Monitoring Usage
- View credit balance
- See usage history
- Track cost per AI task
- Get low balance alerts

### Job Management

#### Creating Jobs
1. Go to Jobs page
2. Click "Create Job"
3. Select customer
4. Choose service type
5. Set schedule
6. Assign crew

#### Using AI Automation
- AI can detect anomalies
- Smart scheduling suggestions
- Automated follow-ups
- Quality monitoring

### Team Management

#### Adding Users
1. Go to Team page
2. Click "Add User"
3. Enter email
4. Choose role (OWNER/MANAGER/STAFF/EMPLOYEE)
5. Send invitation

#### Roles & Permissions
- **OWNER**: Full access, billing
- **MANAGER**: Team management, reports
- **STAFF**: Job management, customers
- **EMPLOYEE**: Limited to assigned jobs

### Adoption Discounts

#### How It Works
- 10% discount per 10% team adoption
- Maximum 70% discount
- Adoption = AI active users / total users
- Automatic tier notifications

#### Increasing Adoption
1. Train team on AI features
2. Show value of AI automation
3. Make AI easy to use
4. Monitor adoption trends

---

## 👥 CUSTOMER PORTAL

### Dashboard
View your service history and upcoming appointments.

**Features**:
- Recent jobs
- Upcoming appointments
- Total/completed job stats
- Quick actions

### Requesting Appointments

#### How to Request
1. Click "Request Appointment"
2. Choose service type
3. Select preferred date/time
4. Add notes
5. Submit request

#### What Happens Next
1. Request sent to service provider
2. They'll contact you to confirm
3. Appointment scheduled
4. You'll see it in your dashboard

### Giving Feedback

#### How to Submit
1. Click "Give Feedback"
2. Rate your experience (1-5 stars)
3. Choose category
4. Add comments (optional)
5. Submit

#### Feedback Categories
- Service Quality
- Communication
- Work Quality
- Timeliness
- Other

### Viewing Job History
See all your past and current service jobs with status updates.

---

## 🔧 PROVIDER PORTAL

### Authentication
Provider portal uses dual-layer authentication:
- **Normal Mode**: Database-backed with 2FA
- **Recovery Mode**: Environment-backed (when DB is down)

### Domain Management
Manage custom domains for white-label deployments.

### Profitability Analytics
Track revenue, costs, and profit per tenant.

**Metrics**:
- Total revenue
- Total costs
- Profit margin
- Per-tenant breakdown

### AI Evaluation

#### Golden Datasets
Create test data for AI evaluation:
1. Add input/output pairs
2. Run evaluations
3. Track metrics (precision, recall, F1)

#### A/B Testing
Compare AI model performance:
1. Create model versions
2. Assign orgs to models
3. Compare results
4. Promote best model

### System Monitoring

#### Health Checks
- Database status
- Cache status
- Queue status
- System metrics

#### Metrics Dashboard
- API call metrics
- Database query metrics
- Cache hit rates
- Job queue stats
- Error rates

---

## 🤖 AI FEATURES

### 8 AI Agents

#### 1. Inbox Agent
- Email/SMS triage
- Auto-categorization
- Priority assignment
- Smart routing

#### 2. Estimate Agent
- Automated quote generation
- Price optimization
- Competitive analysis
- Win probability

#### 3. Collections Agent
- Payment follow-up
- Dunning automation
- Payment plan suggestions
- Success tracking

#### 4. Marketing Agent
- Campaign automation
- Audience segmentation
- Content generation
- Performance tracking

#### 5. Scheduling Agent
- Smart appointment booking
- Conflict resolution
- Route optimization
- Crew assignment

#### 6. Dispatch Agent
- Crew assignment optimization
- Real-time routing
- Workload balancing
- Emergency dispatch

#### 7. Quality Agent
- Service quality monitoring
- Issue detection
- Customer satisfaction tracking
- Improvement suggestions

#### 8. Analytics Agent
- Business intelligence
- Trend analysis
- Predictive insights
- Custom reports

### Using AI Agents

#### Basic Usage
1. Choose agent
2. Select action
3. Provide input
4. Review result
5. Monitor cost

#### Power Level Impact
- **ECO**: Basic AI, slower, cheaper
- **STANDARD**: Balanced performance
- **MAX**: Best AI, fastest, most expensive

#### Cost Control
- Set default power level
- Override per feature
- Monitor credit usage
- Set role ceilings

---

## ✅ BEST PRACTICES

### For Service Providers

#### 1. Start with Trials
- Use trial credits to test AI
- Evaluate which agents provide value
- Convert to paid when ready

#### 2. Optimize Power Levels
- Start with STANDARD
- Use ECO for non-critical tasks
- Reserve MAX for high-value tasks

#### 3. Monitor Adoption
- Track team AI usage
- Provide training
- Celebrate adoption milestones
- Earn discounts

#### 4. Manage Credits
- Keep buffer of credits
- Set up auto-recharge
- Monitor usage trends
- Optimize power levels

### For Customers

#### 1. Keep Information Updated
- Update contact info
- Provide accurate service details
- Respond to appointment confirmations

#### 2. Use Self-Service
- Request appointments online
- Track job status
- Give feedback
- Reduce phone calls

#### 3. Provide Feedback
- Rate your experience
- Share specific details
- Help improve service
- Build better relationship

---

## 🔍 TROUBLESHOOTING

### Common Issues

#### Can't Log In
- Check email/password
- Clear browser cache
- Try password reset
- Contact support

#### AI Task Failed
- Check credit balance
- Verify power level
- Review input data
- Check error message

#### Low Credit Balance
- Purchase more credits
- Reduce power levels
- Optimize AI usage
- Set up auto-recharge

#### Appointment Not Showing
- Refresh page
- Check status
- Verify confirmation
- Contact provider

### Getting Help

#### Documentation
- System Overview
- API Reference
- Deployment Guide
- This User Guide

#### Support Channels
- Email support
- In-app chat (coming soon)
- Knowledge base (coming soon)
- Video tutorials (coming soon)

---

## 📞 CONTACT & SUPPORT

### For Technical Issues
- Check documentation first
- Review error messages
- Try troubleshooting steps
- Contact your administrator

### For Feature Requests
- Submit feedback
- Describe use case
- Explain expected behavior
- Provide examples

### For Billing Questions
- Check credit balance
- Review usage history
- Verify payment method
- Contact billing support

---

## 🎓 TRAINING RESOURCES

### Video Tutorials (Coming Soon)
- Getting started
- AI agent overview
- Job management
- Team collaboration
- Customer portal

### Webinars (Coming Soon)
- Monthly product updates
- Best practices
- Advanced features
- Q&A sessions

### Knowledge Base (Coming Soon)
- How-to articles
- FAQs
- Tips & tricks
- Case studies

---

## 🚀 WHAT'S NEXT

### Upcoming Features
- Mobile app (iOS/Android)
- Advanced reporting
- Integrations (QuickBooks, Stripe)
- Email templates
- SMS notifications
- Webhook system
- AI concierge chat
- Invoice payment portal

### Stay Updated
- Follow release notes
- Join user community
- Attend webinars
- Subscribe to newsletter

---

**Welcome to StreamFlow! We're excited to help you transform your field service business with AI.** 🎉

