import { rawResponse } from 'Kubernetes/rest/response/transform';

angular.module('portainer.kubernetes')
  .factory('KubernetesPersistentVolumeClaims', ['$resource', 'API_ENDPOINT_ENDPOINTS', 'EndpointProvider',
    function KubernetesPersistentVolumeClaimsFactory($resource, API_ENDPOINT_ENDPOINTS, EndpointProvider) {
      'use strict';
      return function (namespace) {
        const url = API_ENDPOINT_ENDPOINTS + '/:endpointId/kubernetes/api/v1'
          + (namespace ? '/namespaces/:namespace' : '') + '/persistentvolumeclaims/:id/:action';
        return $resource(url,
          {
            endpointId: EndpointProvider.endpointID,
            namespace: namespace
          },
          {
            get: { method: 'GET', timeout: 15000 },
            getYaml: {
              method: 'GET',
              headers: {
                'Accept': 'application/yaml'
              },
              transformResponse: rawResponse
            },
            create: { method: 'POST' },
            update: { method: 'PUT', params: { id: '@metadata.name' } },
            delete: { method: 'DELETE' }
          }
        );
      };
    }
  ]);