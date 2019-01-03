export enum OrgRole {
  Viewer = 'Viewer',
  Editor = 'Editor',
  Admin = 'Admin',
}

export interface DashboardAclDTO {
  id?: number;
  dashboardId?: number;
  userId?: number;
  userLogin?: string;
  userEmail?: string;
  teamId?: number;
  team?: string;
  permission?: PermissionLevel;
  role?: OrgRole;
  icon?: string;
  inherited?: boolean;
}

export interface DashboardAclUpdateDTO {
  userId: number;
  teamId: number;
  role: OrgRole;
  permission: PermissionLevel;
}

export interface DashboardAcl {
  id?: number;
  dashboardId?: number;
  userId?: number;
  userLogin?: string;
  userEmail?: string;
  teamId?: number;
  team?: string;
  permission?: PermissionLevel;
  role?: OrgRole;
  icon?: string;
  name?: string;
  inherited?: boolean;
  sortRank?: number;
}

export interface DashboardPermissionInfo {
  value: PermissionLevel;
  label: string;
  description: string;
}

export interface NewDashboardAclItem {
  teamId: number;
  userId: number;
  role?: OrgRole;
  permission: PermissionLevel;
  type: AclTarget;
}

export enum PermissionLevel {
  View = 1,
  Edit = 2,
  Admin = 4,
}

export enum DataSourcePermissionLevel {
  Query = 1,
  Admin = 2,
}

export enum AclTarget {
  Team = 'Team',
  User = 'User',
  Viewer = 'Viewer',
  Editor = 'Editor',
}

export interface AclTargetInfo {
  value: AclTarget;
  text: string;
}

export const dataSourceAclLevels = [
  { value: DataSourcePermissionLevel.Query, label: 'Query', description: 'Can query data source.' },
];

export const dashboardAclTargets: AclTargetInfo[] = [
  { value: AclTarget.Team, text: 'Team' },
  { value: AclTarget.User, text: 'User' },
  { value: AclTarget.Viewer, text: 'Everyone With Viewer Role' },
  { value: AclTarget.Editor, text: 'Everyone With Editor Role' },
];

export const dashboardPermissionLevels: DashboardPermissionInfo[] = [
  { value: PermissionLevel.View, label: 'View', description: 'Can view dashboards.' },
  { value: PermissionLevel.Edit, label: 'Edit', description: 'Can add, edit and delete dashboards.' },
  {
    value: PermissionLevel.Admin,
    label: 'Admin',
    description: 'Can add/remove permissions and can add, edit and delete dashboards.',
  },
];
