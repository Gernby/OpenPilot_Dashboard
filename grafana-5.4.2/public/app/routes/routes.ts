import './dashboard_loaders';
import './ReactContainer';
import { applyRouteRegistrationHandlers } from './registry';

import ServerStats from 'app/features/admin/ServerStats';
import AlertRuleList from 'app/features/alerting/AlertRuleList';
import TeamPages from 'app/features/teams/TeamPages';
import TeamList from 'app/features/teams/TeamList';
import ApiKeys from 'app/features/api-keys/ApiKeysPage';
import PluginListPage from 'app/features/plugins/PluginListPage';
import FolderSettingsPage from 'app/features/folders/FolderSettingsPage';
import FolderPermissions from 'app/features/folders/FolderPermissions';
import DataSourcesListPage from 'app/features/datasources/DataSourcesListPage';
import NewDataSourcePage from '../features/datasources/NewDataSourcePage';
import UsersListPage from 'app/features/users/UsersListPage';
import DataSourceDashboards from 'app/features/datasources/DataSourceDashboards';
import OrgDetailsPage from '../features/org/OrgDetailsPage';

/** @ngInject */
export function setupAngularRoutes($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider
    .when('/', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'LoadDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/d/:uid/:slug', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'LoadDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/d/:uid', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'LoadDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/dashboard/:type/:slug', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'LoadDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/d-solo/:uid/:slug', {
      templateUrl: 'public/app/features/panel/partials/soloPanel.html',
      controller: 'SoloPanelCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/dashboard-solo/:type/:slug', {
      templateUrl: 'public/app/features/panel/partials/soloPanel.html',
      controller: 'SoloPanelCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/dashboard/new', {
      templateUrl: 'public/app/partials/dashboard.html',
      controller: 'NewDashboardCtrl',
      reloadOnSearch: false,
      pageClass: 'page-dashboard',
    })
    .when('/dashboard/import', {
      templateUrl: 'public/app/features/dashboard/partials/dashboard_import.html',
      controller: 'DashboardImportCtrl',
      controllerAs: 'ctrl',
    })
    .when('/datasources', {
      template: '<react-container />',
      resolve: {
        component: () => DataSourcesListPage,
      },
    })
    .when('/datasources/edit/:id', {
      templateUrl: 'public/app/features/plugins/partials/ds_edit.html',
      controller: 'DataSourceEditCtrl',
      controllerAs: 'ctrl',
    })
    .when('/datasources/edit/:id/dashboards', {
      template: '<react-container />',
      resolve: {
        component: () => DataSourceDashboards,
      },
    })
    .when('/datasources/new', {
      template: '<react-container />',
      resolve: {
        component: () => NewDataSourcePage,
      },
    })
    .when('/dashboards', {
      templateUrl: 'public/app/features/manage-dashboards/partials/dashboard_list.html',
      controller: 'DashboardListCtrl',
      controllerAs: 'ctrl',
    })
    .when('/dashboards/folder/new', {
      templateUrl: 'public/app/features/dashboard/partials/create_folder.html',
      controller: 'CreateFolderCtrl',
      controllerAs: 'ctrl',
    })
    .when('/dashboards/f/:uid/:slug/permissions', {
      template: '<react-container />',
      resolve: {
        component: () => FolderPermissions,
      },
    })
    .when('/dashboards/f/:uid/:slug/settings', {
      template: '<react-container />',
      resolve: {
        component: () => FolderSettingsPage,
      },
    })
    .when('/dashboards/f/:uid/:slug', {
      templateUrl: 'public/app/features/dashboard/partials/folder_dashboards.html',
      controller: 'FolderDashboardsCtrl',
      controllerAs: 'ctrl',
    })
    .when('/dashboards/f/:uid', {
      templateUrl: 'public/app/features/dashboard/partials/folder_dashboards.html',
      controller: 'FolderDashboardsCtrl',
      controllerAs: 'ctrl',
    })
    .when('/explore', {
      template: '<react-container />',
      reloadOnSearch: false,
      resolve: {
        roles: () => ['Editor', 'Admin'],
        component: () => import(/* webpackChunkName: "explore" */ 'app/features/explore/Wrapper'),
      },
    })
    .when('/org', {
      template: '<react-container />',
      resolve: {
        component: () => OrgDetailsPage,
      },
    })
    .when('/org/new', {
      templateUrl: 'public/app/features/org/partials/newOrg.html',
      controller: 'NewOrgCtrl',
    })
    .when('/org/users', {
      template: '<react-container />',
      resolve: {
        component: () => UsersListPage,
      },
    })
    .when('/org/users/invite', {
      templateUrl: 'public/app/features/org/partials/invite.html',
      controller: 'UserInviteCtrl',
      controllerAs: 'ctrl',
    })
    .when('/org/apikeys', {
      template: '<react-container />',
      resolve: {
        roles: () => ['Editor', 'Admin'],
        component: () => ApiKeys,
      },
    })
    .when('/org/teams', {
      template: '<react-container />',
      resolve: {
        roles: () => ['Editor', 'Admin'],
        component: () => TeamList,
      },
    })
    .when('/org/teams/new', {
      templateUrl: 'public/app/features/teams/partials/create_team.html',
      controller: 'CreateTeamCtrl',
      controllerAs: 'ctrl',
    })
    .when('/org/teams/edit/:id/:page?', {
      template: '<react-container />',
      resolve: {
        roles: () => ['Admin'],
        component: () => TeamPages,
      },
    })
    .when('/profile', {
      templateUrl: 'public/app/features/profile/partials/profile.html',
      controller: 'ProfileCtrl',
      controllerAs: 'ctrl',
    })
    .when('/profile/password', {
      templateUrl: 'public/app/features/profile/partials/change_password.html',
      controller: 'ChangePasswordCtrl',
    })
    .when('/profile/select-org', {
      templateUrl: 'public/app/features/org/partials/select_org.html',
      controller: 'SelectOrgCtrl',
    })
    // ADMIN
    .when('/admin', {
      templateUrl: 'public/app/features/admin/partials/admin_home.html',
      controller: 'AdminHomeCtrl',
      controllerAs: 'ctrl',
    })
    .when('/admin/settings', {
      templateUrl: 'public/app/features/admin/partials/settings.html',
      controller: 'AdminSettingsCtrl',
      controllerAs: 'ctrl',
    })
    .when('/admin/users', {
      templateUrl: 'public/app/features/admin/partials/users.html',
      controller: 'AdminListUsersCtrl',
      controllerAs: 'ctrl',
    })
    .when('/admin/users/create', {
      templateUrl: 'public/app/features/admin/partials/new_user.html',
      controller: 'AdminEditUserCtrl',
    })
    .when('/admin/users/edit/:id', {
      templateUrl: 'public/app/features/admin/partials/edit_user.html',
      controller: 'AdminEditUserCtrl',
    })
    .when('/admin/orgs', {
      templateUrl: 'public/app/features/admin/partials/orgs.html',
      controller: 'AdminListOrgsCtrl',
      controllerAs: 'ctrl',
    })
    .when('/admin/orgs/edit/:id', {
      templateUrl: 'public/app/features/admin/partials/edit_org.html',
      controller: 'AdminEditOrgCtrl',
      controllerAs: 'ctrl',
    })
    .when('/admin/stats', {
      template: '<react-container />',
      resolve: {
        component: () => ServerStats,
      },
    })
    // LOGIN / SIGNUP
    .when('/login', {
      templateUrl: 'public/app/partials/login.html',
      controller: 'LoginCtrl',
      pageClass: 'login-page sidemenu-hidden',
    })
    .when('/invite/:code', {
      templateUrl: 'public/app/partials/signup_invited.html',
      controller: 'InvitedCtrl',
      pageClass: 'sidemenu-hidden',
    })
    .when('/signup', {
      templateUrl: 'public/app/partials/signup_step2.html',
      controller: 'SignUpCtrl',
      pageClass: 'sidemenu-hidden',
    })
    .when('/user/password/send-reset-email', {
      templateUrl: 'public/app/partials/reset_password.html',
      controller: 'ResetPasswordCtrl',
      pageClass: 'sidemenu-hidden',
    })
    .when('/user/password/reset', {
      templateUrl: 'public/app/partials/reset_password.html',
      controller: 'ResetPasswordCtrl',
      pageClass: 'sidemenu-hidden',
    })
    .when('/dashboard/snapshots', {
      templateUrl: 'public/app/features/manage-dashboards/partials/snapshot_list.html',
      controller: 'SnapshotListCtrl',
      controllerAs: 'ctrl',
    })
    .when('/plugins', {
      template: '<react-container />',
      resolve: {
        component: () => PluginListPage,
      },
    })
    .when('/plugins/:pluginId/edit', {
      templateUrl: 'public/app/features/plugins/partials/plugin_edit.html',
      controller: 'PluginEditCtrl',
      controllerAs: 'ctrl',
    })
    .when('/plugins/:pluginId/page/:slug', {
      templateUrl: 'public/app/features/plugins/partials/plugin_page.html',
      controller: 'AppPageCtrl',
      controllerAs: 'ctrl',
    })
    .when('/styleguide/:page?', {
      controller: 'StyleGuideCtrl',
      controllerAs: 'ctrl',
      templateUrl: 'public/app/features/admin/partials/styleguide.html',
    })
    .when('/alerting', {
      redirectTo: '/alerting/list',
    })
    .when('/alerting/list', {
      template: '<react-container />',
      reloadOnSearch: false,
      resolve: {
        component: () => AlertRuleList,
      },
    })
    .when('/alerting/notifications', {
      templateUrl: 'public/app/features/alerting/partials/notifications_list.html',
      controller: 'AlertNotificationsListCtrl',
      controllerAs: 'ctrl',
    })
    .when('/alerting/notification/new', {
      templateUrl: 'public/app/features/alerting/partials/notification_edit.html',
      controller: 'AlertNotificationEditCtrl',
      controllerAs: 'ctrl',
    })
    .when('/alerting/notification/:id/edit', {
      templateUrl: 'public/app/features/alerting/partials/notification_edit.html',
      controller: 'AlertNotificationEditCtrl',
      controllerAs: 'ctrl',
    })
    .otherwise({
      templateUrl: 'public/app/partials/error.html',
      controller: 'ErrorCtrl',
    });

  applyRouteRegistrationHandlers($routeProvider);
}
