angular.module('portainer.rbac').directive('authorization', [
  'Authentication',
  '$async',
  function (Authentication, $async) {
    async function linkAsync(scope, elem, attrs) {
      elem.hide();

      var authorizations = attrs.authorization.split(',');
      for (var i = 0; i < authorizations.length; i++) {
        authorizations[i] = authorizations[i].trim();
      }

      var hasAuthorizations = Authentication.hasAuthorizations(authorizations);

      if (hasAuthorizations) {
        elem.show();
      } else if (!hasAuthorizations && elem[0].tagName === 'A') {
        elem.show();
        elem.addClass('portainer-disabled-link');
      }
    }

    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        return $async(linkAsync, scope, elem, attrs);
      },
    };
  },
]);
