import angular from 'angular';
import { Terminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';

class KubectlShellController {
  constructor($window, $async, $scope, $state, Notifications, EndpointProvider, LocalStorage, KubernetesConfigService) {
    this.$scope = $scope;
    this.$state = $state;
    this.$async = $async;
    this.$window = $window;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.LocalStorage = LocalStorage;
    this.KubernetesConfigService = KubernetesConfigService;

    this.onInit = this.onInit.bind(this);
  }

  disconnect() {
    this.$scope.checked = false;
    this.$scope.icon = 'fas fa-window-minimize';
    this.state.socket.close();
    this.state.term.dispose();
    this.state.connected = false;
  }

  screenclear() {
    this.state.term.clear();
  }

  mini_restore() {
    if (this.$scope.css === 'mini') {
      this.$scope.css = 'normal';
      this.$scope.icon = 'fas fa-window-minimize';
    } else {
      this.$scope.css = 'mini';
      this.$scope.icon = 'fas fa-window-restore';
    }
  }

  configureSocketAndTerminal(socket, term) {
    socket.onopen = function () {
      const terminal_container = document.getElementById('terminal-container');
      term.open(terminal_container);
      term.setOption('cursorBlink', true);
      term.focus();
      term.fit();
    };

    term.on('data', function (data) {
      socket.send(data);
    });

    this.$window.onresize = function () {
      term.fit();
    };

    socket.onmessage = function (msg) {
      term.write(msg.data);
    };

    socket.onerror = function (err) {
      this.disconnect();
      this.Notifications.error('Failure', err, 'Websocket connection error');
    }.bind(this);

    this.state.socket.onclose = function () {
      this.disconnect();
    }.bind(this);

    this.state.connected = true;
  }

  connectConsole() {
    this.$scope.checked = true;

    const params = {
      token: this.LocalStorage.getJWT(),
      endpointId: this.EndpointProvider.endpointID(),
    };

    let url =
      window.location.href.split('#')[0] +
      'api/websocket/kubernetes-shell?' +
      Object.keys(params)
        .map((k) => k + '=' + params[k])
        .join('&');
    if (url.indexOf('https') > -1) {
      url = url.replace('https://', 'wss://');
    } else {
      url = url.replace('http://', 'ws://');
    }

    Terminal.applyAddon(fit);
    this.state.socket = new WebSocket(url);
    this.state.term = new Terminal();

    this.configureSocketAndTerminal(this.state.socket, this.state.term);
  }

  async downloadKubeconfig() {
    await this.KubernetesConfigService.downloadConfig();
  }

  async onInit() {
    this.$scope.css = 'normal';
    this.$scope.checked = false;
    this.$scope.icon = 'fa-window-minimize';
    this.$scope.isHTTPS = this.$window.location.protocol === 'https:';

    this.state = {
      connected: false,
      socket: null,
      term: null,
    };
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubectlShellController;
angular.module('portainer.kubernetes').controller('KubectlShellController', KubectlShellController);