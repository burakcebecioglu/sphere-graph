import type { SphereGraphEdge, SphereGraphNode } from "../src/types";

/**
 * Showcase dataset (SG-45): a Jira-style task board. Groups are epics,
 * nodes are tasks with hand-written, realistic titles (not templated), and
 * edges are directed task dependencies, including cross-epic ones. Big
 * enough that SG-10's label budget and SG-11's collision rejection
 * visibly thin the label set, unlike the small book/citations demos.
 */

export const taskGroupLabels: Record<string, string> = {
  auth: "Authentication & Access",
  billing: "Billing & Subscriptions",
  search: "Search & Discovery",
  notify: "Notifications",
  platform: "Platform & Reliability",
  onboarding: "Onboarding & Activation",
};

export const taskGroupColors: Record<string, string> = {
  auth: "#0a84ff",
  billing: "#30d158",
  search: "#bf5af2",
  notify: "#ff9f0a",
  platform: "#ff453a",
  onboarding: "#64d2ff",
};

const TASKS: Record<string, string[]> = {
  auth: [
    "Add rate limiting to the login endpoint",
    "Support SSO via SAML for enterprise tenants",
    "Add SCIM provisioning for enterprise user sync",
    "Enforce MFA for admin accounts",
    "Rotate refresh tokens on password change",
    "Add passwordless magic-link sign-in",
    "Audit log for permission changes",
    "Design a pluggable auth provider interface",
    "Fix session not expiring after logout on mobile Safari",
    "Add IP allowlisting for enterprise workspaces",
    "Support Google Workspace as an identity provider",
    "Add granular role-based access control",
    "Deprecate legacy API keys in favor of OAuth tokens",
    "Add a device management page for active sessions",
    "Investigate brute-force lockout false positives",
  ],
  billing: [
    "Add per-seat billing for team plans",
    "Support annual billing with a discount",
    "Migrate legacy invoices to the new billing engine",
    "Add usage-based overage charges for API calls",
    "Build a self-serve plan downgrade flow",
    "Fix proration bug on mid-cycle upgrades",
    "Add EU VAT handling for European customers",
    "Support multiple payment methods per account",
    "Add dunning emails for failed payments",
    "Build an internal admin tool for manual refunds",
    "Add Stripe webhook retries with exponential backoff",
    "Support pausing a subscription instead of cancelling",
    "Add a billing history export to CSV",
    "Reconcile the Stripe balance with the internal ledger nightly",
    "Add sales-tax calculation for US states",
  ],
  search: [
    "Add typo-tolerant fuzzy search",
    "Index custom fields for filtering",
    "Add saved search views per user",
    "Improve search relevance ranking with click data",
    "Add keyboard shortcuts for search navigation",
    "Support boolean operators in the search bar",
    "Add search result highlighting for matched terms",
    "Cache popular queries to reduce search latency",
    "Add faceted filters for search results",
    "Support searching across archived items",
    "Add a command palette for quick navigation",
    "Fix the search index falling behind on bulk imports",
    "Add autocomplete suggestions while typing",
    "Support search-as-you-type with debouncing",
    "Add an analytics dashboard for top search queries",
  ],
  notify: [
    "Add digest emails summarizing daily activity",
    "Support per-channel notification preferences",
    "Add an in-app notification center with unread counts",
    "Deduplicate notifications for bulk updates",
    "Add a Slack integration for task assignments",
    "Support quiet hours for push notifications",
    "Add mobile push notifications for mentions",
    "Batch notification delivery to avoid spam",
    "Add unsubscribe links to all email notifications",
    "Support notification snoozing",
    "Add webhook support for external integrations",
    "Fix duplicate emails sent on retry",
    "Add a notification preview in settings",
    "Support Microsoft Teams as a notification channel",
    "Add read receipts for critical alerts",
  ],
  platform: [
    "Add distributed tracing across services",
    "Reduce p95 API latency under load",
    "Add circuit breakers for downstream dependencies",
    "Migrate background jobs to a new queue system",
    "Add automated failover for the primary database",
    "Improve cold-start time for serverless functions",
    "Add structured logging with correlation IDs",
    "Set up canary deployments for risky releases",
    "Add rate limiting at the API gateway",
    "Reduce memory usage in the ingestion pipeline",
    "Add chaos testing for the payments service",
    "Fix intermittent timeouts under high concurrency",
    "Add read replicas to scale read-heavy workloads",
    "Set up blue-green deployments for zero downtime",
    "Add a capacity planning dashboard for infra costs",
  ],
  onboarding: [
    "Build an interactive product tour for new users",
    "Add a checklist for first-time workspace setup",
    "Reduce time-to-first-value in the signup flow",
    "Add sample data for new workspaces",
    "Build an in-app guide for inviting teammates",
    "Add progress tracking for onboarding steps",
    "Personalize onboarding based on the selected use case",
    "Add a welcome email series for new signups",
    "Simplify the workspace creation form",
    "Add contextual tooltips for key features",
    "Build a demo mode with pre-populated content",
    "Add an onboarding survey to capture user goals",
    "Reduce signup form fields to improve conversion",
    "Add a getting-started video walkthrough",
    "Track drop-off points in the onboarding funnel",
  ],
};

export const taskNodes: SphereGraphNode[] = Object.entries(TASKS).flatMap(([epic, titles]) =>
  titles.map((title, i) => ({
    id: `${epic}-${i + 1}`,
    label: title,
    group: epic,
  })),
);

const DEPENDS_ON: Array<[string, string]> = [
  // Auth: pluggable provider interface underpins the concrete providers.
  ["auth-2", "auth-8"],
  ["auth-11", "auth-8"],
  ["auth-3", "auth-2"],
  ["auth-4", "auth-12"],
  ["auth-6", "auth-8"],
  ["auth-13", "auth-12"],
  ["auth-14", "auth-6"],
  ["auth-10", "auth-2"],
  ["auth-1", "auth-9"],

  // Billing: the new engine and RBAC gate most of the rest.
  ["billing-3", "billing-11"],
  ["billing-1", "auth-12"],
  ["billing-2", "billing-1"],
  ["billing-4", "billing-3"],
  ["billing-5", "billing-1"],
  ["billing-6", "billing-2"],
  ["billing-7", "billing-3"],
  ["billing-9", "billing-11"],
  ["billing-10", "auth-12"],
  ["billing-12", "billing-5"],
  ["billing-13", "billing-3"],
  ["billing-15", "billing-7"],

  // Search: indexing and the command palette are load-bearing.
  ["search-3", "auth-12"],
  ["search-4", "search-2"],
  ["search-6", "search-1"],
  ["search-8", "search-4"],
  ["search-9", "search-2"],
  ["search-12", "search-2"],
  ["search-13", "search-1"],
  ["search-14", "search-13"],
  ["search-11", "search-6"],
  ["search-15", "search-4"],

  // Notifications: the notification center + webhooks are foundational.
  ["notify-1", "notify-3"],
  ["notify-2", "notify-3"],
  ["notify-5", "notify-11"],
  ["notify-6", "notify-2"],
  ["notify-7", "notify-2"],
  ["notify-8", "notify-3"],
  ["notify-10", "notify-3"],
  ["notify-12", "notify-1"],
  ["notify-14", "notify-11"],
  ["notify-13", "notify-2"],
  ["notify-4", "billing-4"],

  // Platform: tracing/queue/gateway are prerequisites for most reliability work.
  ["platform-2", "platform-1"],
  ["platform-3", "platform-1"],
  ["platform-4", "notify-5"],
  ["platform-6", "platform-4"],
  ["platform-8", "platform-4"],
  ["platform-9", "auth-1"],
  ["platform-11", "platform-9"],
  ["platform-12", "platform-9"],
  ["platform-13", "platform-5"],
  ["platform-14", "platform-8"],
  ["platform-15", "platform-1"],
  ["notify-11", "platform-9"],

  // Onboarding: depends on product surfaces from other epics being ready.
  ["onboarding-1", "search-11"],
  ["onboarding-2", "onboarding-9"],
  ["onboarding-3", "onboarding-9"],
  ["onboarding-5", "notify-2"],
  ["onboarding-6", "onboarding-1"],
  ["onboarding-7", "onboarding-12"],
  ["onboarding-8", "onboarding-9"],
  ["onboarding-10", "onboarding-1"],
  ["onboarding-11", "onboarding-4"],
  ["onboarding-13", "onboarding-9"],
  ["onboarding-14", "onboarding-1"],
  ["onboarding-15", "onboarding-2"],
];

export const taskEdges: SphereGraphEdge[] = DEPENDS_ON.map(([source, target]) => ({
  source,
  target,
  kind: "depends-on",
  directed: true,
}));

export const taskEdgeKinds = ["depends-on"] as const;
