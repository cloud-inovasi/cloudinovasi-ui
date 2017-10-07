angular.module('portainer')
.run(['$rootScope', '$state', 'Authentication', 'authManager', 'StateManager', 'EndpointProvider', 'Notifications', 'Analytics', function ($rootScope, $state, Authentication, authManager, StateManager, EndpointProvider, Notifications, Analytics) {
  'use strict';

  EndpointProvider.initialize();

  StateManager.initialize()
  .then(function success(state) {
    if (state.application.authentication) {
      initAuthentication(authManager, Authentication, $rootScope);
    }
    if (state.application.analytics) {
      initAnalytics(Analytics, $rootScope);
    }
  })
  .catch(function error(err) {
    Notifications.error('Failure', err, 'Unable to retrieve application settings');
  });

  $rootScope.$state = $state;
}]);


function initAuthentication(authManager, Authentication, $rootScope) {
  authManager.checkAuthOnRefresh();
  authManager.redirectWhenUnauthenticated();
  Authentication.init();
  $rootScope.$on('tokenHasExpired', function() {
    $state.go('auth', {error: 'Your session has expired'});
  });
}

function initAnalytics(Analytics, $rootScope) {
  Analytics.offline(false);
  Analytics.registerScriptTags();
  Analytics.registerTrackers();
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    Analytics.trackPage(toState.url);
    Analytics.pageView();
  });
}
