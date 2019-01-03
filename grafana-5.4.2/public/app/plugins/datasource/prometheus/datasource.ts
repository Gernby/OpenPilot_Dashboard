import _ from 'lodash';

import $ from 'jquery';
import kbn from 'app/core/utils/kbn';
import * as dateMath from 'app/core/utils/datemath';
import PrometheusMetricFindQuery from './metric_find_query';
import { ResultTransformer } from './result_transformer';
import PrometheusLanguageProvider from './language_provider';
import { BackendSrv } from 'app/core/services/backend_srv';

import addLabelToQuery from './add_label_to_query';
import { getQueryHints } from './query_hints';
import { expandRecordingRules } from './language_utils';

export function alignRange(start, end, step) {
  const alignedEnd = Math.ceil(end / step) * step;
  const alignedStart = Math.floor(start / step) * step;
  return {
    end: alignedEnd,
    start: alignedStart,
  };
}

export function extractRuleMappingFromGroups(groups: any[]) {
  return groups.reduce(
    (mapping, group) =>
      group.rules.filter(rule => rule.type === 'recording').reduce(
        (acc, rule) => ({
          ...acc,
          [rule.name]: rule.query,
        }),
        mapping
      ),
    {}
  );
}

export function prometheusRegularEscape(value) {
  if (typeof value === 'string') {
    return value.replace(/'/g, "\\\\'");
  }
  return value;
}

export function prometheusSpecialRegexEscape(value) {
  if (typeof value === 'string') {
    return prometheusRegularEscape(value.replace(/\\/g, '\\\\\\\\').replace(/[$^*{}\[\]+?.()]/g, '\\\\$&'));
  }
  return value;
}

export class PrometheusDatasource {
  type: string;
  editorSrc: string;
  name: string;
  ruleMappings: { [index: string]: string };
  url: string;
  directUrl: string;
  basicAuth: any;
  withCredentials: any;
  metricsNameCache: any;
  interval: string;
  queryTimeout: string;
  httpMethod: string;
  languageProvider: PrometheusLanguageProvider;
  resultTransformer: ResultTransformer;

  /** @ngInject */
  constructor(instanceSettings, private $q, private backendSrv: BackendSrv, private templateSrv, private timeSrv) {
    this.type = 'prometheus';
    this.editorSrc = 'app/features/prometheus/partials/query.editor.html';
    this.name = instanceSettings.name;
    this.url = instanceSettings.url;
    this.directUrl = instanceSettings.directUrl;
    this.basicAuth = instanceSettings.basicAuth;
    this.withCredentials = instanceSettings.withCredentials;
    this.interval = instanceSettings.jsonData.timeInterval || '15s';
    this.queryTimeout = instanceSettings.jsonData.queryTimeout;
    this.httpMethod = instanceSettings.jsonData.httpMethod || 'GET';
    this.resultTransformer = new ResultTransformer(templateSrv);
    this.ruleMappings = {};
    this.languageProvider = new PrometheusLanguageProvider(this);
  }

  init() {
    this.loadRules();
  }

  _request(url, data?, options?: any) {
    options = _.defaults(options || {}, {
      url: this.url + url,
      method: this.httpMethod,
    });

    if (options.method === 'GET') {
      if (!_.isEmpty(data)) {
        options.url =
          options.url +
          '?' +
          _.map(data, (v, k) => {
            return encodeURIComponent(k) + '=' + encodeURIComponent(v);
          }).join('&');
      }
    } else {
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      options.transformRequest = data => {
        return $.param(data);
      };
      options.data = data;
    }

    if (this.basicAuth || this.withCredentials) {
      options.withCredentials = true;
    }

    if (this.basicAuth) {
      options.headers = {
        Authorization: this.basicAuth,
      };
    }

    return this.backendSrv.datasourceRequest(options);
  }

  // Use this for tab completion features, wont publish response to other components
  metadataRequest(url) {
    return this._request(url, null, { method: 'GET', silent: true });
  }

  interpolateQueryExpr(value, variable, defaultFormatFn) {
    // if no multi or include all do not regexEscape
    if (!variable.multi && !variable.includeAll) {
      return prometheusRegularEscape(value);
    }

    if (typeof value === 'string') {
      return prometheusSpecialRegexEscape(value);
    }

    const escapedValues = _.map(value, prometheusSpecialRegexEscape);
    return escapedValues.join('|');
  }

  targetContainsTemplate(target) {
    return this.templateSrv.variableExists(target.expr);
  }

  query(options) {
    const start = this.getPrometheusTime(options.range.from, false);
    const end = this.getPrometheusTime(options.range.to, true);

    const queries = [];
    const activeTargets = [];

    options = _.clone(options);

    for (const target of options.targets) {
      if (!target.expr || target.hide) {
        continue;
      }

      activeTargets.push(target);
      queries.push(this.createQuery(target, options, start, end));
    }

    // No valid targets, return the empty result to save a round trip.
    if (_.isEmpty(queries)) {
      return this.$q.when({ data: [] });
    }

    const allQueryPromise = _.map(queries, query => {
      if (!query.instant) {
        return this.performTimeSeriesQuery(query, query.start, query.end);
      } else {
        return this.performInstantQuery(query, end);
      }
    });

    return this.$q.all(allQueryPromise).then(responseList => {
      let result = [];

      _.each(responseList, (response, index) => {
        if (response.status === 'error') {
          const error = {
            index,
            ...response.error,
          };
          throw error;
        }

        // Keeping original start/end for transformers
        const transformerOptions = {
          format: activeTargets[index].format,
          step: queries[index].step,
          legendFormat: activeTargets[index].legendFormat,
          start: queries[index].start,
          end: queries[index].end,
          query: queries[index].expr,
          responseListLength: responseList.length,
          refId: activeTargets[index].refId,
          valueWithRefId: activeTargets[index].valueWithRefId,
        };
        const series = this.resultTransformer.transform(response, transformerOptions);
        result = [...result, ...series];
      });

      return { data: result };
    });
  }

  createQuery(target, options, start, end) {
    const query: any = {
      hinting: target.hinting,
      instant: target.instant,
    };
    const range = Math.ceil(end - start);

    let interval = kbn.interval_to_seconds(options.interval);
    // Minimum interval ("Min step"), if specified for the query. or same as interval otherwise
    const minInterval = kbn.interval_to_seconds(
      this.templateSrv.replace(target.interval, options.scopedVars) || options.interval
    );
    const intervalFactor = target.intervalFactor || 1;
    // Adjust the interval to take into account any specified minimum and interval factor plus Prometheus limits
    const adjustedInterval = this.adjustInterval(interval, minInterval, range, intervalFactor);
    let scopedVars = { ...options.scopedVars, ...this.getRangeScopedVars() };
    // If the interval was adjusted, make a shallow copy of scopedVars with updated interval vars
    if (interval !== adjustedInterval) {
      interval = adjustedInterval;
      scopedVars = Object.assign({}, options.scopedVars, {
        __interval: { text: interval + 's', value: interval + 's' },
        __interval_ms: { text: interval * 1000, value: interval * 1000 },
        ...this.getRangeScopedVars(),
      });
    }
    query.step = interval;

    let expr = target.expr;

    // Apply adhoc filters
    const adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    expr = adhocFilters.reduce((acc, filter) => {
      const { key, operator } = filter;
      let { value } = filter;
      if (operator === '=~' || operator === '!~') {
        value = prometheusSpecialRegexEscape(value);
      }
      return addLabelToQuery(acc, key, value, operator);
    }, expr);

    // Only replace vars in expression after having (possibly) updated interval vars
    query.expr = this.templateSrv.replace(expr, scopedVars, this.interpolateQueryExpr);
    query.requestId = options.panelId + target.refId;

    // Align query interval with step
    const adjusted = alignRange(start, end, query.step);
    query.start = adjusted.start;
    query.end = adjusted.end;

    return query;
  }

  adjustInterval(interval, minInterval, range, intervalFactor) {
    // Prometheus will drop queries that might return more than 11000 data points.
    // Calibrate interval if it is too small.
    if (interval !== 0 && range / intervalFactor / interval > 11000) {
      interval = Math.ceil(range / intervalFactor / 11000);
    }
    return Math.max(interval * intervalFactor, minInterval, 1);
  }

  performTimeSeriesQuery(query, start, end) {
    if (start > end) {
      throw { message: 'Invalid time range' };
    }

    const url = '/api/v1/query_range';
    const data = {
      query: query.expr,
      start: start,
      end: end,
      step: query.step,
    };
    if (this.queryTimeout) {
      data['timeout'] = this.queryTimeout;
    }
    return this._request(url, data, { requestId: query.requestId });
  }

  performInstantQuery(query, time) {
    const url = '/api/v1/query';
    const data = {
      query: query.expr,
      time: time,
    };
    if (this.queryTimeout) {
      data['timeout'] = this.queryTimeout;
    }
    return this._request(url, data, { requestId: query.requestId });
  }

  performSuggestQuery(query, cache = false) {
    const url = '/api/v1/label/__name__/values';

    if (cache && this.metricsNameCache && this.metricsNameCache.expire > Date.now()) {
      return this.$q.when(
        _.filter(this.metricsNameCache.data, metricName => {
          return metricName.indexOf(query) !== 1;
        })
      );
    }

    return this.metadataRequest(url).then(result => {
      this.metricsNameCache = {
        data: result.data.data,
        expire: Date.now() + 60 * 1000,
      };
      return _.filter(result.data.data, metricName => {
        return metricName.indexOf(query) !== 1;
      });
    });
  }

  metricFindQuery(query) {
    if (!query) {
      return this.$q.when([]);
    }

    const scopedVars = {
      __interval: { text: this.interval, value: this.interval },
      __interval_ms: { text: kbn.interval_to_ms(this.interval), value: kbn.interval_to_ms(this.interval) },
      ...this.getRangeScopedVars(),
    };
    const interpolated = this.templateSrv.replace(query, scopedVars, this.interpolateQueryExpr);
    const metricFindQuery = new PrometheusMetricFindQuery(this, interpolated, this.timeSrv);
    return metricFindQuery.process();
  }

  getRangeScopedVars() {
    const range = this.timeSrv.timeRange();
    const msRange = range.to.diff(range.from);
    const sRange = Math.round(msRange / 1000);
    const regularRange = kbn.secondsToHms(msRange / 1000);
    return {
      __range_ms: { text: msRange, value: msRange },
      __range_s: { text: sRange, value: sRange },
      __range: { text: regularRange, value: regularRange },
    };
  }

  annotationQuery(options) {
    const annotation = options.annotation;
    const expr = annotation.expr || '';
    let tagKeys = annotation.tagKeys || '';
    const titleFormat = annotation.titleFormat || '';
    const textFormat = annotation.textFormat || '';

    if (!expr) {
      return this.$q.when([]);
    }

    const step = annotation.step || '60s';
    const start = this.getPrometheusTime(options.range.from, false);
    const end = this.getPrometheusTime(options.range.to, true);
    // Unsetting min interval
    const queryOptions = {
      ...options,
      interval: '0s',
    };
    const query = this.createQuery({ expr, interval: step }, queryOptions, start, end);

    const self = this;
    return this.performTimeSeriesQuery(query, query.start, query.end).then(results => {
      const eventList = [];
      tagKeys = tagKeys.split(',');

      _.each(results.data.data.result, series => {
        const tags = _.chain(series.metric)
          .filter((v, k) => {
            return _.includes(tagKeys, k);
          })
          .value();

        for (const value of series.values) {
          const valueIsTrue = value[1] === '1'; // e.g. ALERTS
          if (valueIsTrue || annotation.useValueForTime) {
            const event = {
              annotation: annotation,
              title: self.resultTransformer.renderTemplate(titleFormat, series.metric),
              tags: tags,
              text: self.resultTransformer.renderTemplate(textFormat, series.metric),
            };

            if (annotation.useValueForTime) {
              event['time'] = Math.floor(parseFloat(value[1]));
            } else {
              event['time'] = Math.floor(parseFloat(value[0])) * 1000;
            }

            eventList.push(event);
          }
        }
      });

      return eventList;
    });
  }

  testDatasource() {
    const now = new Date().getTime();
    return this.performInstantQuery({ expr: '1+1' }, now / 1000).then(response => {
      if (response.data.status === 'success') {
        return { status: 'success', message: 'Data source is working' };
      } else {
        return { status: 'error', message: response.error };
      }
    });
  }

  getExploreState(targets: any[]) {
    let state = {};
    if (targets && targets.length > 0) {
      const queries = targets.map(t => ({
        query: this.templateSrv.replace(t.expr, {}, this.interpolateQueryExpr),
        format: t.format,
      }));
      state = {
        ...state,
        queries,
        datasource: this.name,
      };
    }
    return state;
  }

  getQueryHints(query: string, result: any[]) {
    return getQueryHints(query, result, this);
  }

  loadRules() {
    this.metadataRequest('/api/v1/rules')
      .then(res => res.data || res.json())
      .then(body => {
        const groups = _.get(body, ['data', 'groups']);
        if (groups) {
          this.ruleMappings = extractRuleMappingFromGroups(groups);
        }
      })
      .catch(e => {
        console.log('Rules API is experimental. Ignore next error.');
        console.error(e);
      });
  }

  modifyQuery(query: string, action: any): string {
    switch (action.type) {
      case 'ADD_FILTER': {
        return addLabelToQuery(query, action.key, action.value);
      }
      case 'ADD_HISTOGRAM_QUANTILE': {
        return `histogram_quantile(0.95, sum(rate(${query}[5m])) by (le))`;
      }
      case 'ADD_RATE': {
        return `rate(${query}[5m])`;
      }
      case 'ADD_SUM': {
        return `sum(${query.trim()}) by ($1)`;
      }
      case 'EXPAND_RULES': {
        if (action.mapping) {
          return expandRecordingRules(query, action.mapping);
        }
      }
      default:
        return query;
    }
  }

  getPrometheusTime(date, roundUp) {
    if (_.isString(date)) {
      date = dateMath.parse(date, roundUp);
    }
    return Math.ceil(date.valueOf() / 1000);
  }

  getTimeRange(): { start: number; end: number } {
    const range = this.timeSrv.timeRange();
    return {
      start: this.getPrometheusTime(range.from, false),
      end: this.getPrometheusTime(range.to, true),
    };
  }

  getOriginalMetricName(labelData) {
    return this.resultTransformer.getOriginalMetricName(labelData);
  }
}
