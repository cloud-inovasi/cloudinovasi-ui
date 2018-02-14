angular.module('portainer.app')
.factory('RegistryManifests', ['$resource', 'API_ENDPOINT_REGISTRIES', function RegistryManifestsFactory($resource, API_ENDPOINT_REGISTRIES) {
  'use strict';
  return $resource(API_ENDPOINT_REGISTRIES + '/:id/v2/:repository/manifests/:tag', {}, {
    get: {
      method: 'GET',
      params: { id: '@id', repository: '@repository', tag: '@tag' },
      transformResponse: function(data, headers){
        var response = {};
        try {
          response.data = JSON.parse(data);
        } catch (e) {
          response.data = data;
        }
        response.headers = headers();
        return response;
      }
    },
    delete: { method: 'DELETE', params: { id: '@id', repository: '@repository', tag: '@tag' } }
  });
}]);
