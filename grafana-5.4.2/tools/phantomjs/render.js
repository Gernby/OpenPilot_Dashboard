(function() {
    'use strict';

    var page = require('webpage').create();
    var args = require('system').args;
    var params = {};
    var regexp = /^([^=]+)=([^$]+)/;

    args.forEach(function(arg) {
      var parts = arg.match(regexp);
      if (!parts) { return; }
      params[parts[1]] = parts[2];
    });

    var usage = "url=<url> png=<filename> width=<width> height=<height> renderKey=<key>";

    if (!params.url || !params.png ||  !params.renderKey || !params.domain) {
      console.log(usage);
      phantom.exit();
    }

    phantom.addCookie({
      'name': 'renderKey',
      'value': params.renderKey,
      'domain': params.domain,
    });

    page.viewportSize = {
      width: params.width || '800',
      height: params.height || '400'
    };

    var timeoutMs = (parseInt(params.timeout) || 10) * 1000;
    var waitBetweenReadyCheckMs = 50;
    var totalWaitMs = 0;

    page.open(params.url, function (status) {
      console.log('Loading a web page: ' + params.url + ' status: ' + status, timeoutMs);

      page.onError = function(msg, trace) {
        var msgStack = ['ERROR: ' + msg];
        if (trace && trace.length) {
          msgStack.push('TRACE:');
          trace.forEach(function(t) {
            msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
          });
        }
        console.error(msgStack.join('\n'));
      };

      function checkIsReady() {
        var panelsRendered = page.evaluate(function() {
          var panelCount = document.querySelectorAll('plugin-component').length;
          return window.panelsRendered >= panelCount;
        });

        if (panelsRendered || totalWaitMs > timeoutMs) {
          var bb = page.evaluate(function () {
            var container = document.getElementsByClassName("dashboard-container")
            if (container.length == 0) {
               container = document.getElementsByClassName("panel-container")
            }
            return container[0].getBoundingClientRect();
          });
          
          // reset viewport to render full page
          page.viewportSize = {
            width: bb.width,
            height: bb.height
          };

          page.render(params.png);
          phantom.exit();
        } else {
          totalWaitMs += waitBetweenReadyCheckMs;
          setTimeout(checkIsReady, waitBetweenReadyCheckMs);
        }
      }

      setTimeout(checkIsReady, waitBetweenReadyCheckMs);
    });
  })();
