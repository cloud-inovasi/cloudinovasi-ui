angular.module('portainer.app')
.controller('CreateStackController', ['$scope', '$state', 'StackService', 'Authentication', 'Notifications', 'FormValidator', 'ResourceControlService', 'FormHelper', 'EndpointProvider',
function ($scope, $state, StackService, Authentication, Notifications, FormValidator, ResourceControlService, FormHelper, EndpointProvider) {

  $scope.formValues = {
    Name: '',
    StackFileContent: '',
    StackFile: null,
    RepositoryURL: '',
    RepositoryReferenceName: "",
    RepositoryUsername: '',
    RepositoryPassword: '',
    Env: [],
    ComposeFilePathInRepository: 'docker-compose.yml',
    AccessControlData: new AccessControlFormData(),  
    StachauthControlData: new StackAuthControlFormData(),     
    RepositoryAuthentication:false,
    stackAuthenticationControlEnabled:''
  }; 
  var stateChangeKey = false;
  $scope.formValues.generateNewKey =function(){
    StackService.setStackName($scope.formValues.Name);
    if($('#stack_name').val() !=""){
      $('#btngeneratekey').removeAttr("disabled")
      $('#warningStackname').hide();
    } else {
      $('#btngeneratekey').attr('disabled','disabled');
      $('#warningStackname').show();
    }
  } 

  $scope.formValues.authenticationEnable =function (vale){    
    $scope.formValues.stackAuthenticationControlEnabled = '1';
     stateChangeKey = vale;
  }

  $scope.state = {
    Method: 'editor',
    formValidationError: '',
    actionInProgress: false,
    StackType: null
  };

  $scope.addEnvironmentVariable = function() {
    $scope.formValues.Env.push({ name: '', value: ''});
  };

  $scope.removeEnvironmentVariable = function(index) {
    $scope.formValues.Env.splice(index, 1);
  };

  function validateForm(accessControlData, isAdmin) {
    $scope.state.formValidationError = '';
    var error = '';    
    error = FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      $scope.state.formValidationError = error;
      return false;
    }
    return true;
  }

  function createSwarmStack(name, method) {
    
    var env = FormHelper.removeInvalidEnvVars($scope.formValues.Env);
    var endpointId = EndpointProvider.endpointID();

    var StachauthControlData = $scope.formValues.StachauthControlData;

    if (method === 'editor') {
      var stackFileContent = $scope.formValues.StackFileContent;
      return StackService.createSwarmStackFromFileContent(name, stackFileContent, env, endpointId);
    } else if (method === 'upload') {
      var stackFile = $scope.formValues.StackFile;
      return StackService.createSwarmStackFromFileUpload(name, stackFile, env, endpointId);
    } else if (method === 'repository') {    
      
      var prKey = "";
      var pubKey =  "";
      
      if($scope.formValues.stackAuthenticationControlEnabled == 2){
        prKey = "";
        pubKey = ""
        
      } else if($scope.formValues.stackAuthenticationControlEnabled == 1) {
        prKey = StachauthControlData.GenrateSshkey['selected'].Privatekeypath;
        pubKey = StachauthControlData.GenrateSshkey['selected'].Publickeypath;
      } 

      var repositoryOptions = {
        RepositoryURL: $scope.formValues.RepositoryURL,
        RepositoryReferenceName: $scope.formValues.RepositoryReferenceName,
        ComposeFilePathInRepository: $scope.formValues.ComposeFilePathInRepository,
        RepositoryAuthentication : $scope.formValues.RepositoryAuthentication,
        stackAuthenticationControlEnabled : stateChangeKey,       
        RepositoryUsername: $scope.formValues.RepositoryUsername,
        RepositoryPassword: $scope.formValues.RepositoryPassword,
        RepositoryPrivatekeypath: prKey, 
        RepositoryPublickeypath: pubKey    

      };
      
      return StackService.createSwarmStackFromGitRepository(name, repositoryOptions, env, endpointId);
    }
  }

  function createComposeStack(name, method) {   
   
    var env = FormHelper.removeInvalidEnvVars($scope.formValues.Env);    
    var endpointId = EndpointProvider.endpointID();
    
    var StachauthControlData = $scope.formValues.StachauthControlData;    
        
    if (method === 'editor') {
      var stackFileContent = $scope.formValues.StackFileContent;
      return StackService.createComposeStackFromFileContent(name, stackFileContent, env, endpointId);
    } else if (method === 'upload') {
      var stackFile = $scope.formValues.StackFile;
      return StackService.createComposeStackFromFileUpload(name, stackFile, env, endpointId);
    } else if (method === 'repository') {   
      
      var prKey = "";
      var pubKey =  "";
      
      if($scope.formValues.stackAuthenticationControlEnabled == 2){
        prKey = "";
        pubKey = ""
        
      } else if($scope.formValues.stackAuthenticationControlEnabled == 1) {
        prKey = StachauthControlData.GenrateSshkey['selected'].Privatekeypath;
        pubKey = StachauthControlData.GenrateSshkey['selected'].Publickeypath;        
      } 
               
      var repositoryOptions = {
        RepositoryURL: $scope.formValues.RepositoryURL,
        RepositoryReferenceName: $scope.formValues.RepositoryReferenceName,
        ComposeFilePathInRepository: $scope.formValues.ComposeFilePathInRepository, 
        RepositoryAuthentication : $scope.formValues.RepositoryAuthentication,
        stackAuthenticationControlEnabled : stateChangeKey,              
        RepositoryUsername: $scope.formValues.RepositoryUsername,
        RepositoryPassword: $scope.formValues.RepositoryPassword,
        RepositoryPrivatekeypath: prKey, 
        RepositoryPublickeypath: pubKey       
      };    
      
      return StackService.createComposeStackFromGitRepository(name, repositoryOptions, env, endpointId);
    }
  }

  $scope.deployStack = function () {
    var name = $scope.formValues.Name;
    var method = $scope.state.Method;

    var accessControlData = $scope.formValues.AccessControlData;
    
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1;
    var userId = userDetails.ID;

    if (method === 'editor' && $scope.formValues.StackFileContent === '') {
      $scope.state.formValidationError = 'Stack file content must not be empty';
      return;
    }

    if (!validateForm(accessControlData, isAdmin)) {
      return;
    }

    var type = $scope.state.StackType;
    var action = createSwarmStack;
    if (type === 2) {
      action = createComposeStack;
    }
    $scope.state.actionInProgress = true;
    action(name, method)
    .then(function success() {
      return ResourceControlService.applyResourceControl('stack', name, userId, accessControlData, []);
    })
    .then(function success() {
      Notifications.success('Stack successfully deployed');
      $state.go('portainer.stacks');
    })
    .catch(function error(err) {
      Notifications.warning('Deployment error', type === 1 ? err.err.data.err : err.data.err);
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.editorUpdate = function(cm) {
    $scope.formValues.StackFileContent = cm.getValue();
  };

  function initView() {
    var endpointMode = $scope.applicationState.endpoint.mode;
    $scope.state.StackType = 2;
    
    if (endpointMode.provider === 'DOCKER_SWARM_MODE' && endpointMode.role === 'MANAGER') {
      $scope.state.StackType = 1;
    }
  }

  initView();
}]);
