angular.module('monitor', [])
    .controller('MonitorController', ['$scope', '$http', '$filter', '$stateParams', '$document', 'Container',
        function ($scope, $http, $filter, $stateParams, $document, Container) {
            $scope.name = undefined;
            $scope.logs = "";
            $scope.range = {};
            $scope.auto = true;
            $scope.initialized = false;
            $scope.points = 30;

            setToAuto();

            $('#loadingViewSpinner').show();
            Container.get({id: $stateParams.id}, function (d) {
                $scope.container = d;
                $scope.name = $filter('trimcontainername')($scope.container.Name);

                // initial call
                // startLogStream();
                pullInterval();

                $('#loadingViewSpinner').hide();
            }, function (e) {
                $('#loadingViewSpinner').hide();
                Messages.error("Failure", e, "Unable to retrieve container info");
            });

            // Intervall called every x seconds to pull data from the backend.
            // It should only act as a filter for the 'auto mode' (if auto mode is not
            // enabled, then ignore the interval).
            function pullInterval() {
                if (!$scope.auto) {
                    return;
                }

                $scope.update();
            }

            function setToAuto() {
                $scope.auto = true;

                var d = new Date();
                d.setMinutes(d.getMinutes() - 6);
                $scope.range.from = d.toISOString();
                $scope.range.to = null;

                $scope.points = 30;

                if ($scope.initialized) {
                    pullInterval();
                }
            }

            $scope.setAuto = function (auto) {
                $scope.auto = auto;

                if (auto) {
                    $scope.fromSlider.disable();
                    $scope.toSlider.disable();

                    destroyCharts();
                    setToAuto();
                    createCharts();
                } else {
                    $scope.fromSlider.enable();
                    $scope.toSlider.enable();

                    $scope.range.to = new Date().toISOString();
                }
            };

            $scope.update = function () {
                if (!$scope.auto) {
                    // if the display is not on auto mode, destroy all previous displayed data
                    // in order to replace with the newly retrieved data.
                    $scope.logs = "";

                    // reset the silder to 0 delta.
                    $scope.prevFrom = 0;
                    $scope.prevTo = 0;
                    $scope.fromSlider.setValue(0);
                    $scope.toSlider.setValue(0);
                }

                // fix date ranges to objects for querying.
                $scope.range.from = new Date($scope.range.from).toISOString();
                if ($scope.range.to) {
                    $scope.range.to = new Date($scope.range.to).toISOString();
                } else {
                    $scope.range.to = null;
                }

                // update data.
                getLogs();
                getMetrics();
            };

            // TODO: not used yet.
            function startLogStream() {
                var source = new EventSource('/api/monitor/logstream?name=' + $scope.name);

                source.onmessage = function (e) {
                    $scope.logs = $scope.logs + e.data + "\n";
                    $scope.$apply();
                };
            }

            // Gets logs from the backend and updates them in the display.
            function getLogs() {
                var params = {
                    'name': $scope.name,
                    'from': $scope.range.from
                };

                // if the user specified a 'to' time, set as parameter.
                if ($scope.range.to) {
                    params['to'] = new Date($scope.range.to).toISOString();
                }

                $http({method: 'GET', url: "/api/monitor/logs", params: params})
                    .success(function (data, status, headers, config) {
                        // for each result, add it to the logs string.
                        angular.forEach(data.hits.hits, function (hit) {
                            $scope.logs += hit._source.message + "\n";
                        });
                    });
            }

            // Gets metrics from the backend and updates them in the display.
            function getMetrics() {
                var params = {
                    'db': 'statspout',
                    'name': $scope.name,
                    'from': $scope.range.from
                };

                if ($scope.range.to) {
                    params['to'] = new Date($scope.range.to).toISOString();
                }

                if (!$scope.auto) {
                    destroyCharts();
                }

                $http({method: 'GET', url: "/api/monitor/stats", params: jQuery.extend({}, params)})
                    .success(function (data, status, headers, config) {
                        if (!$scope.auto) {
                            $scope.points = data.length;
                            createCharts();
                        }

                        angular.forEach(data, function (value) {
                            updateCharts(value);
                        });
                    });
            }

            function getUTCTimeString(d) {
                var seconds = d.getUTCSeconds();
                var hours = d.getUTCHours();
                var minutes = d.getUTCMinutes();

                if (seconds < 10) {
                    seconds = "0" + seconds;
                }

                if (minutes < 10) {
                    minutes = "0" + minutes;
                }

                return hours + ":" + minutes + ":" + seconds + "Z";
            }

            function updateCharts(value) {
                var timeDate = new Date(value.timestamp);
                var fromDate = new Date($scope.range.from);

                if ($scope.auto && timeDate > fromDate) {
                    $scope.range.from = timeDate.toISOString();
                }

                var timestamp = getUTCTimeString(timeDate);

                $scope.cpuChart.removeData();
                $scope.cpuChart.addData([value.cpu_usage], timestamp);

                $scope.memChart.removeData();
                $scope.memChart.addData([value.mem_usage], timestamp);

                $scope.networkChart.removeData();
                $scope.networkChart.addData([value.rx_bytes, value.tx_bytes], timestamp);
            }

            // Destroy all charts without recreate.
            function destroyCharts() {
                // we have to destroy the element in order to dispose the stored data.
                $scope.cpuChart.destroy();
                $scope.memChart.destroy();
                $scope.networkChart.destroy();
            }

            function createCharts() {
                // charts configurations.
                var cpuLabels = [],
                    cpuData = [],
                    memoryLabels = [],
                    memoryData = [],
                    networkLabels = [],
                    networkRxData = [],
                    networkTxData = [];

                for (var i = 0; i < $scope.points; i++) {
                    cpuLabels.push('');
                    cpuData.push(0);
                    networkLabels.push('');
                    memoryLabels.push('');
                    memoryData.push(0);
                    networkRxData.push(0);
                    networkTxData.push(0);
                }

                var cpuDataset = {
                    fillColor: "rgba(151,187,205,0.5)",
                    strokeColor: "rgba(151,187,205,1)",
                    data: cpuData
                };

                var memoryDataset = {
                    fillColor: "rgba(151,187,205,0.5)",
                    strokeColor: "rgba(151,187,205,1)",
                    data: memoryData
                };

                var networkRxDataset = {
                    fillColor: "rgba(0, 0, 0, 0)",
                    strokeColor: "rgba(151,187,205,1)",
                    data: networkRxData
                };

                var networkTxDataset = {
                    fillColor: "rgba(0, 0, 0, 0)",
                    strokeColor: "rgba(51,87,05,1)",
                    data: networkTxData
                };

                var networkLegendData = [{
                    color: 'rgba(151,187,205,0.5)',
                    title: 'Rx Data'
                }, {
                    color: 'rgba(51,87,05,0.5)',
                    title: 'Tx Data'
                }];

                if (!$scope.initialized) {
                    legend($('#network-legend').get(0), networkLegendData);
                }

                $scope.cpuChart = new Chart($('#cpu-stats-chart').get(0).getContext("2d")).Line({
                    labels: cpuLabels,
                    datasets: [cpuDataset]
                }, {
                    responsive: true,
                    animation: false,
                    pointDot: false
                });

                $scope.memChart = new Chart($('#memory-stats-chart').get(0).getContext("2d")).Line({
                    labels: memoryLabels,
                    datasets: [memoryDataset]
                }, {
                    responsive: true,
                    animation: false,
                    pointDot: false
                });

                $scope.networkChart = new Chart($('#network-chart').get(0).getContext("2d")).Line({
                    labels: networkLabels,
                    datasets: [networkRxDataset, networkTxDataset]
                }, {
                    responsive: true,
                    animation: false,
                    pointDot: false
                });
            }

            $document.ready(function () {
                Chart.defaults.global.animationSteps = 30; // Lower from 60 to ease CPU load.
                createCharts();

                // Data fine tune slider. Works as a slider for relative adjustment of the from/to range
                // modifying each one with a delta in minutes. Note that this is intended as a fine tuning
                // search, as so, it only allows to adjust a restricted range.
                $scope.prevFrom = 0;
                $scope.prevTo = 0;

                $scope.fromSlider = $("#fromSlider").slider({ min: -30, max: 30, value: 0, focus: true, tooltip_position: 'bottom' }).data('slider');
                $scope.fromSlider.on('change', function (e) {
                    // get new value from the slider.
                    var current = $scope.fromSlider.getValue();

                    // calculate the delta relative to the previous update.
                    var deltaMin = current - $scope.prevFrom;

                    // store the new slider value for future delta.
                    $scope.prevFrom = current;

                    // move times and store them back to the range model.
                    var d = new Date($scope.range.from);
                    d.setMinutes(d.getMinutes() + deltaMin);
                    $scope.range.from = d.toISOString();

                    // force update the scope.
                    $scope.$apply();
                });

                $scope.toSlider = $("#toSlider").slider({ min: -30, max: 30, value: 0, focus: true, tooltip_position: 'bottom' }).data('slider');
                $scope.toSlider.on('change', function (e) {
                    // get new value from the slider.
                    var current = $scope.toSlider.getValue();

                    // calculate the delta relative to the previous update.
                    var deltaMin = current - $scope.prevTo;

                    // store the new slider value for future delta.
                    $scope.prevTo = current;

                    // move times and store them back to the range model.
                    var d = new Date($scope.range.to);
                    d.setMinutes(d.getMinutes() + deltaMin);
                    $scope.range.to = d.toISOString();

                    // force update the scope.
                    $scope.$apply();
                });

                // the slider should be disabled on 'auto mode'.
                $scope.fromSlider.disable();
                $scope.toSlider.disable();

                // Main interval to retrieve data.
                var pullIntervalId = window.setInterval(pullInterval, 10000);

                $scope.$on("$destroy", function () {
                    // clearing interval when view changes
                    clearInterval(pullIntervalId);
                });

                $scope.initialized = true;
            });
        }
    ]);