// apps/tenant-app/src/app/settings/subscription/subscription-client.tsx
// Phase 2: Subscription tier and usage display (blocked by Stripe integration)

"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  TrendingUp,
  Users,
  MapPin,
  Briefcase,
  HardDrive,
  AlertCircle,
  Crown,
  Zap,
  Rocket,
} from "lucide-react";

interface SubscriptionClientProps {
  orgId: string;
}

interface TierLimits {
  maxUsers: number;
  maxLocations: number;
  maxJobsPerMonth: number;
  storageGb: number;
}

interface CurrentUsage {
  activeUsers: number;
  activeLocations: number;
  jobsThisMonth: number;
  storageUsedGb: number;
}

interface SubscriptionData {
  tierKey: string;
  tierName: string;
  status: string;
  verticalKey: string;
  limits: TierLimits;
  usage: CurrentUsage;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string | null;
}

const TIER_INFO = {
  starter: {
    icon: Zap,
    color: "blue",
    description: "Perfect for small teams getting started",
  },
  professional: {
    icon: Crown,
    color: "purple",
    description: "For growing businesses with advanced needs",
  },
  enterprise: {
    icon: Rocket,
    color: "orange",
    description: "Unlimited power for large organizations",
  },
};

export function SubscriptionClient({ orgId }: SubscriptionClientProps) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [orgId]);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      } else {
        // Fallback to stub data for Phase 2 (blocked by [service] Stripe)
        setSubscription({
          tierKey: "professional",
          tierName: "Professional",
          status: "active",
          verticalKey: "field-service",
          limits: {
            maxUsers: 25,
            maxLocations: 5,
            maxJobsPerMonth: 500,
            storageGb: 50,
          },
          usage: {
            activeUsers: 8,
            activeLocations: 2,
            jobsThisMonth: 142,
            storageUsedGb: 12.4,
          },
          currentPeriodStart: new Date(
            Date.now() - 15 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          currentPeriodEnd: new Date(
            Date.now() + 15 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          trialEndsAt: null,
        });
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading subscription details...</div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Unable to load subscription information
        </p>
      </div>
    );
  }

  const tierInfo =
    TIER_INFO[subscription.tierKey as keyof typeof TIER_INFO] ||
    TIER_INFO.starter;
  const TierIcon = tierInfo.icon;

  const usagePercentages = {
    users:
      (subscription.usage.activeUsers / subscription.limits.maxUsers) * 100,
    locations:
      (subscription.usage.activeLocations / subscription.limits.maxLocations) *
      100,
    jobs:
      (subscription.usage.jobsThisMonth / subscription.limits.maxJobsPerMonth) *
      100,
    storage:
      (subscription.usage.storageUsedGb / subscription.limits.storageGb) * 100,
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div
        className={`bg-gradient-to-br from-${tierInfo.color}-50 to-${tierInfo.color}-100 dark:from-${tierInfo.color}-900/20 dark:to-${tierInfo.color}-800/20 border-2 border-${tierInfo.color}-200 dark:border-${tierInfo.color}-800 rounded-lg p-6`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 bg-${tierInfo.color}-500 rounded-xl`}>
              <TierIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-2xl font-bold text-${tierInfo.color}-900 dark:text-${tierInfo.color}-100`}
                >
                  {subscription.tierName} Plan
                </h2>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    subscription.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : subscription.status === "trial"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  }`}
                >
                  {subscription.status.toUpperCase()}
                </span>
              </div>
              <p
                className={`text-sm text-${tierInfo.color}-700 dark:text-${tierInfo.color}-300 mt-1`}
              >
                {tierInfo.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-medium">Current Period: </span>
                  {new Date(
                    subscription.currentPeriodStart,
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
            Manage Plan
          </button>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UsageCard
          icon={Users}
          label="Active Users"
          current={subscription.usage.activeUsers}
          limit={subscription.limits.maxUsers}
          percentage={usagePercentages.users}
          color="blue"
        />
        <UsageCard
          icon={MapPin}
          label="Locations"
          current={subscription.usage.activeLocations}
          limit={subscription.limits.maxLocations}
          percentage={usagePercentages.locations}
          color="green"
        />
        <UsageCard
          icon={Briefcase}
          label="Jobs This Month"
          current={subscription.usage.jobsThisMonth}
          limit={subscription.limits.maxJobsPerMonth}
          percentage={usagePercentages.jobs}
          color="purple"
        />
        <UsageCard
          icon={HardDrive}
          label="Storage"
          current={subscription.usage.storageUsedGb}
          limit={subscription.limits.storageGb}
          percentage={usagePercentages.storage}
          color="orange"
          unit="GB"
        />
      </div>

      {/* Tier Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Available Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TierCard
            tierKey="starter"
            name="Starter"
            price="$49"
            features={[
              "Up to 10 users",
              "1 location",
              "100 jobs/month",
              "10 GB storage",
              "Email support",
            ]}
            current={subscription.tierKey === "starter"}
          />
          <TierCard
            tierKey="professional"
            name="Professional"
            price="$199"
            features={[
              "Up to 25 users",
              "Up to 5 locations",
              "500 jobs/month",
              "50 GB storage",
              "Priority support",
              "Advanced reporting",
            ]}
            current={subscription.tierKey === "professional"}
            popular
          />
          <TierCard
            tierKey="enterprise"
            name="Enterprise"
            price="Custom"
            features={[
              "Unlimited users",
              "Unlimited locations",
              "Unlimited jobs",
              "Unlimited storage",
              "Dedicated support",
              "Custom integrations",
              "SLA guarantee",
            ]}
            current={subscription.tierKey === "enterprise"}
          />
        </div>
      </div>

      {/* Phase 2 Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Phase 2: Stub Implementation</p>
            <p>
              This page shows example subscription data. Upgrade/downgrade
              functionality is blocked by Stripe integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UsageCardProps {
  icon: any;
  label: string;
  current: number;
  limit: number;
  percentage: number;
  color: string;
  unit?: string;
}

function UsageCard({
  icon: Icon,
  label,
  current,
  limit,
  percentage,
  color,
  unit = "",
}: UsageCardProps) {
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}
        >
          <Icon
            className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`}
          />
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {label}
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {current} {unit} / {limit} {unit}
          </div>
        </div>
      </div>
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full rounded-full transition-all ${
            isCritical
              ? "bg-red-500"
              : isWarning
                ? "bg-yellow-500"
                : `bg-${color}-500`
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {percentage.toFixed(0)}% used
      </div>
    </div>
  );
}

interface TierCardProps {
  tierKey: string;
  name: string;
  price: string;
  features: string[];
  current?: boolean;
  popular?: boolean;
}

function TierCard({
  tierKey,
  name,
  price,
  features,
  current,
  popular,
}: TierCardProps) {
  return (
    <div
      className={`relative rounded-lg border-2 p-6 ${
        current
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
          Most Popular
        </div>
      )}
      {current && (
        <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
          Current Plan
        </div>
      )}
      <div className="text-center mb-6">
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {name}
        </h4>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {price}
        </div>
        {price !== "Custom" && (
          <div className="text-sm text-gray-600 dark:text-gray-400">/month</div>
        )}
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          current
            ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
        disabled={current}
      >
        {current
          ? "Current Plan"
          : price === "Custom"
            ? "Contact Sales"
            : "Upgrade"}
      </button>
    </div>
  );
}
