angular.module('endpointAccess', [])
.controller('EndpointAccessController', ['$q', '$scope', '$state', '$stateParams', '$filter', 'EndpointService', 'UserService', 'TeamService', 'Pagination', 'Notifications',
function ($q, $scope, $state, $stateParams, $filter, EndpointService, UserService, TeamService, Pagination, Notifications) {

  $scope.state = {
    pagination_count_accesses: Pagination.getPaginationCount('endpoint_access_accesses'),
    pagination_count_authorizedAccesses: Pagination.getPaginationCount('endpoint_access_authorizedAccesses')
  };

  $scope.sortTypeAccesses = 'Type';
  $scope.sortReverseAccesses = false;

  $scope.orderAccesses = function(sortType) {
    $scope.sortReverseAccesses = ($scope.sortTypeAccesses === sortType) ? !$scope.sortReverseAccesses : false;
    $scope.sortTypeAccesses = sortType;
  };

  $scope.changePaginationCountAccesses = function() {
    Pagination.setPaginationCount('endpoint_access_accesses', $scope.state.pagination_count_accesses);
  };

  $scope.sortTypeAuthorizedAccesses = 'Type';
  $scope.sortReverseAuthorizedAccesses = false;

  $scope.orderAuthorizedAccesses = function(sortType) {
    $scope.sortReverseAuthorizedAccesses = ($scope.sortTypeAuthorizedAccesses === sortType) ? !$scope.sortReverseAuthorizedAccesses : false;
    $scope.sortTypeAuthorizedAccesses = sortType;
  };

  $scope.changePaginationCountAuthorizedAccesses = function() {
    Pagination.setPaginationCount('endpoint_access_authorizedAccesses', $scope.state.pagination_count_authorizedAccesses);
  };

  $scope.authorizeAllAccesses = function() {
    var authorizedUsers = [];
    var authorizedTeams = [];
    angular.forEach($scope.authorizedAccesses, function (a) {
      if (a.Type === 'user') {
        authorizedUsers.push(a.Id);
      } else if (a.Type === 'team') {
        authorizedTeams.push(a.Id);
      }
    });
    angular.forEach($scope.accesses, function (a) {
      if (a.Type === 'user') {
        authorizedUsers.push(a.Id);
      } else if (a.Type === 'team') {
        authorizedTeams.push(a.Id);
      }
    });

    EndpointService.updateAccess($stateParams.id, authorizedUsers, authorizedTeams)
    .then(function success(data) {
      $scope.authorizedAccesses = $scope.authorizedAccesses.concat($scope.accesses);
      $scope.accesses = [];
      Notifications.success('Endpoint accesses successfully updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update endpoint accesses');
    });
  };

  $scope.unauthorizeAllAccesses = function() {
    EndpointService.updateAccess($stateParams.id, [], [])
    .then(function success(data) {
      $scope.accesses = $scope.accesses.concat($scope.authorizedAccesses);
      $scope.authorizedAccesses = [];
      Notifications.success('Endpoint accesses successfully updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update endpoint accesses');
    });
  };

  $scope.authorizeAccess = function(access) {
    var authorizedUsers = [];
    var authorizedTeams = [];
    angular.forEach($scope.authorizedAccesses, function (a) {
      if (a.Type === 'user') {
        authorizedUsers.push(a.Id);
      } else if (a.Type === 'team') {
        authorizedTeams.push(a.Id);
      }
    });

    if (access.Type === 'user') {
      authorizedUsers.push(access.Id);
    } else if (access.Type === 'team') {
      authorizedTeams.push(access.Id);
    }

    EndpointService.updateAccess($stateParams.id, authorizedUsers, authorizedTeams)
    .then(function success(data) {
      removeAccessFromArray(access, $scope.accesses);
      $scope.authorizedAccesses.push(access);
      Notifications.success('Endpoint accesses successfully updated', access.Name);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update endpoint accesses');
    });
  };

  $scope.unauthorizeAccess = function(access) {
    var authorizedUsers = [];
    var authorizedTeams = [];
    angular.forEach($scope.authorizedAccesses, function (a) {
      if (a.Type === 'user') {
        authorizedUsers.push(a.Id);
      } else if (a.Type === 'team') {
        authorizedTeams.push(a.Id);
      }
    });

    if (access.Type === 'user') {
      _.remove(authorizedUsers, function(n) {
        return n === access.Id;
      });
    } else if (access.Type === 'team') {
      _.remove(authorizedTeams, function(n) {
        return n === access.Id;
      });
    }

    EndpointService.updateAccess($stateParams.id, authorizedUsers, authorizedTeams)
    .then(function success(data) {
      removeAccessFromArray(access, $scope.authorizedAccesses);
      $scope.accesses.push(access);
      Notifications.success('Endpoint accesses successfully updated', access.Name);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update endpoint accesses');
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      endpoint: EndpointService.endpoint($stateParams.id),
      users: UserService.users(false),
      teams: TeamService.teams()
    })
    .then(function success(data) {
      $scope.endpoint = data.endpoint;
      $scope.accesses = [];
      var users = data.users.map(function (user) {
        return new EndpointAccessUserViewModel(user);
      });
      var teams = data.teams.map(function (team) {
        return new EndpointAccessTeamViewModel(team);
      });
      $scope.accesses = $scope.accesses.concat(users, teams);
      $scope.authorizedAccesses = [];
      angular.forEach($scope.endpoint.AuthorizedUsers, function(userID) {
        for (var i = 0, l = $scope.accesses.length; i < l; i++) {
          if ($scope.accesses[i].Type === 'user' && $scope.accesses[i].Id === userID) {
            $scope.authorizedAccesses.push($scope.accesses[i]);
            $scope.accesses.splice(i, 1);
            return;
          }
        }
      });
      angular.forEach($scope.endpoint.AuthorizedTeams, function(teamID) {
        for (var i = 0, l = $scope.accesses.length; i < l; i++) {
          if ($scope.accesses[i].Type === 'team' && $scope.accesses[i].Id === teamID) {
            $scope.authorizedAccesses.push($scope.accesses[i]);
            $scope.accesses.splice(i, 1);
            return;
          }
        }
      });
    })
    .catch(function error(err) {
      $scope.accesses = [];
      $scope.authorizedAccesses = [];
      Notifications.error('Failure', err, 'Unable to retrieve endpoint details');
    })
    .finally(function final(){
      $('#loadingViewSpinner').hide();
    });
  }

  function removeAccessFromArray(access, accesses) {
    for (var i = 0, l = accesses.length; i < l; i++) {
      if (access.Type === accesses[i].Type && access.Id === accesses[i].Id) {
        accesses.splice(i, 1);
        return;
      }
    }
  }

  initView();
}]);
