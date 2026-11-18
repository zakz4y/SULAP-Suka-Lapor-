// SULAP Types sesuai api-contract.md

export type Role = "resident" | "admin" | "developer";
export type MembershipStatus = "active" | "pending" | "rejected" | "inactive";

export type InternalStatusGroup =
  | "new"
  | "triaged"
  | "inspection"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened";

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
}

export interface ActiveRt {
  id: string;
  name: string;
  slug: string;
  role: Role;
}

export interface MeData {
  user: UserProfile;
  activeRt: ActiveRt | null;
  memberships: Array<{
    rtId: string;
    role: Role;
    status: MembershipStatus;
  }>;
}

export interface Capabilities {
  canCreateReport: boolean;
  canChangeStatus: boolean;
  canManageMembers: boolean;
  canManageCategories: boolean;
  canManageStatuses: boolean;
  canSoftDeleteReport: boolean;
  canViewAuditLog: boolean;
  canExport: boolean;
}

export interface Category {
  id: string;
  rtId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  order: number;
}

export interface StatusDefinition {
  id: string;
  rtId: string;
  key: string;
  label: string;
  group: InternalStatusGroup;
  color: string;
  order: number;
  isActive: boolean;
}

export interface Attachment {
  id: string;
  reportId?: string;
  url: string;
  thumbnailUrl: string;
  mimeType: string;
  sizeBytes: number;
  type?: "evidence" | "inspection" | "resolution";
}

export interface ReportLocation {
  lat: number;
  lng: number;
  accuracyMeters: number | null;
  source: "gps" | "manual";
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  reportId: string;
  actorName: string;
  actorRole: Role;
  eventType: "created" | "status_changed" | "inspection_added" | "reopened" | "note_added";
  fromStatus?: string | null;
  toStatus?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  publicNo: string;
  rtId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  statusId: string;
  statusKey: string;
  statusLabel: string;
  statusGroup: InternalStatusGroup;
  location: ReportLocation;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  version: number;
  reporter?: {
    id: string;
    displayName: string;
  } | null;
  inspections?: Array<{
    id: string;
    inspectorName: string;
    notes: string;
    inspectedAt: string;
    attachments: Attachment[];
  }>;
  timeline?: TimelineEvent[];
}

export interface AdminOverview {
  metrics: {
    newReportsCount: number;
    inProgressCount: number;
    resolvedCount: number;
    pendingInspectionCount: number;
    avgResolutionDays: number;
  };
  weeklyActivity: Array<{
    day: string;
    date: string;
    incoming: number;
    resolved: number;
  }>;
  pendingInspections: Array<{
    id: string;
    publicNo: string;
    title: string;
    addressNotes: string;
    reportedAt: string;
  }>;
  urgentReports: Report[];
}
