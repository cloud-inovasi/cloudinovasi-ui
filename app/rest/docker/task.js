angular.module('portainer.rest')
.factory('Task', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider', function TaskFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
  'use strict';
  return $resource(API_ENDPOINT_ENDPOINTS + '/:endpointId/docker/tasks/:id/:action', {
    endpointId: EndpointProvider.endpointID
  },
  {
    get: { method: 'GET', params: {id: '@id'} },
    query: { method: 'GET', isArray: true, params: {filters: '@filters'} },
    logs: {
        method: 'GET',
        params: {
            action: 'logs',
            stdout: '@stdout',
            stderr: '@stderr',
            timestamps: '@timestamps',
            tail: '@tail'
        },
        transformResponse: genericHandler
    }
  });
}]);
