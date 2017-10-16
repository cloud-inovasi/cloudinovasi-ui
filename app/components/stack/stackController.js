angular.module('stack', [])
.controller('StackController', ['$q', '$scope', '$state', '$stateParams', '$document', 'StackService', 'NodeService', 'ServiceService', 'TaskService', 'ServiceHelper', 'CodeMirrorService', 'Notifications',
function ($q, $scope, $state, $stateParams, $document, StackService, NodeService, ServiceService, TaskService, ServiceHelper, CodeMirrorService, Notifications) {

  $scope.deployStack = function () {
    $('#createResourceSpinner').show();

    // The codemirror editor does not work with ng-model so we need to retrieve
    // the value directly from the editor.
    var stackFile = $scope.editor.getValue();

    StackService.updateStack($scope.stack.Id, stackFile)
    .then(function success(data) {
      Notifications.success('Stack successfully deployed');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create stack');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    var stackId = $stateParams.id;

    StackService.stack(stackId)
    .then(function success(data) {
      var stack = data;
      $scope.stack = stack;

      var serviceFilters = {
        label: ['com.docker.stack.namespace=' + stack.Name]
      };

      return $q.all({
        stackFile: StackService.getStackFile(stackId),
        services: ServiceService.services(serviceFilters),
        tasks: TaskService.tasks(serviceFilters),
        nodes: NodeService.nodes()
      });
    })
    .then(function success(data) {
      $scope.stackFileContent = data.stackFile;

      $document.ready(function() {
        var webEditorElement = $document[0].getElementById('web-editor');
        if (webEditorElement) {
          $scope.editor = CodeMirrorService.applyCodeMirrorOnElement(webEditorElement);
        }
      });

      $scope.nodes = data.nodes;

      var services = data.services;

      var tasks = data.tasks;
      $scope.tasks = tasks;

      for (var i = 0; i < services.length; i++) {
        var service = services[i];
        ServiceHelper.associateTasksToService(service, tasks);
      }

      $scope.services = services;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve tasks details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
