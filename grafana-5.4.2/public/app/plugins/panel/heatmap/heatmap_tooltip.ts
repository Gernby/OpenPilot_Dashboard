import * as d3 from 'd3';
import $ from 'jquery';
import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import { getValueBucketBound } from './heatmap_data_converter';

const TOOLTIP_PADDING_X = 30;
const TOOLTIP_PADDING_Y = 5;
const HISTOGRAM_WIDTH = 160;
const HISTOGRAM_HEIGHT = 40;

export class HeatmapTooltip {
  tooltip: any;
  scope: any;
  dashboard: any;
  panelCtrl: any;
  panel: any;
  heatmapPanel: any;
  mouseOverBucket: boolean;
  originalFillColor: any;

  constructor(elem, scope) {
    this.scope = scope;
    this.dashboard = scope.ctrl.dashboard;
    this.panelCtrl = scope.ctrl;
    this.panel = scope.ctrl.panel;
    this.heatmapPanel = elem;
    this.mouseOverBucket = false;
    this.originalFillColor = null;

    elem.on('mouseleave', this.onMouseLeave.bind(this));
  }

  onMouseLeave() {
    this.destroy();
  }

  onMouseMove(e) {
    if (!this.panel.tooltip.show) {
      return;
    }

    this.move(e);
  }

  add() {
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'heatmap-tooltip graph-tooltip grafana-tooltip');
  }

  destroy() {
    if (this.tooltip) {
      this.tooltip.remove();
    }

    this.tooltip = null;
  }

  show(pos, data) {
    if (!this.panel.tooltip.show || !data) {
      return;
    }
    // shared tooltip mode
    if (pos.panelRelY) {
      return;
    }

    const { xBucketIndex, yBucketIndex } = this.getBucketIndexes(pos, data);

    if (!data.buckets[xBucketIndex]) {
      this.destroy();
      return;
    }

    if (!this.tooltip) {
      this.add();
    }

    let boundBottom, boundTop, valuesNumber;
    const xData = data.buckets[xBucketIndex];
    // Search in special 'zero' bucket also
    const yData = _.find(xData.buckets, (bucket, bucketIndex) => {
      return bucket.bounds.bottom === yBucketIndex || bucketIndex === yBucketIndex.toString();
    });

    const tooltipTimeFormat = 'YYYY-MM-DD HH:mm:ss';
    const time = this.dashboard.formatDate(xData.x, tooltipTimeFormat);

    // Decimals override. Code from panel/graph/graph.ts
    let countValueFormatter, bucketBoundFormatter;
    if (_.isNumber(this.panel.tooltipDecimals)) {
      countValueFormatter = this.countValueFormatter(this.panel.tooltipDecimals, null);
      bucketBoundFormatter = this.panelCtrl.tickValueFormatter(this.panelCtrl.decimals, null);
    } else {
      // auto decimals
      // legend and tooltip gets one more decimal precision
      // than graph legend ticks
      const decimals = (this.panelCtrl.decimals || -1) + 1;
      countValueFormatter = this.countValueFormatter(decimals, this.panelCtrl.scaledDecimals + 2);
      bucketBoundFormatter = this.panelCtrl.tickValueFormatter(decimals, this.panelCtrl.scaledDecimals + 2);
    }

    let tooltipHtml = `<div class="graph-tooltip-time">${time}</div>
      <div class="heatmap-histogram"></div>`;

    if (yData) {
      if (yData.bounds) {
        if (data.tsBuckets) {
          // Use Y-axis labels
          const tickFormatter = valIndex => {
            return data.tsBucketsFormatted ? data.tsBucketsFormatted[valIndex] : data.tsBuckets[valIndex];
          };

          boundBottom = tickFormatter(yBucketIndex);
          boundTop = yBucketIndex < data.tsBuckets.length - 1 ? tickFormatter(yBucketIndex + 1) : '';
        } else {
          // Display 0 if bucket is a special 'zero' bucket
          const bottom = yData.y ? yData.bounds.bottom : 0;
          boundBottom = bucketBoundFormatter(bottom);
          boundTop = bucketBoundFormatter(yData.bounds.top);
        }
        valuesNumber = countValueFormatter(yData.count);
        tooltipHtml += `<div>
          bucket: <b>${boundBottom} - ${boundTop}</b> <br>
          count: <b>${valuesNumber}</b> <br>
        </div>`;
      } else {
        // currently no bounds for pre bucketed data
        tooltipHtml += `<div>count: <b>${yData.count}</b><br></div>`;
      }
    } else {
      if (!this.panel.tooltip.showHistogram) {
        this.destroy();
        return;
      }
      boundBottom = yBucketIndex;
      boundTop = '';
      valuesNumber = 0;
    }

    this.tooltip.html(tooltipHtml);

    if (this.panel.tooltip.showHistogram) {
      this.addHistogram(xData);
    }

    this.move(pos);
  }

  getBucketIndexes(pos, data) {
    const xBucketIndex = this.getXBucketIndex(pos.x, data);
    const yBucketIndex = this.getYBucketIndex(pos.y, data);
    return { xBucketIndex, yBucketIndex };
  }

  getXBucketIndex(x, data) {
    // First try to find X bucket by checking x pos is in the
    // [bucket.x, bucket.x + xBucketSize] interval
    const xBucket = _.find(data.buckets, bucket => {
      return x > bucket.x && x - bucket.x <= data.xBucketSize;
    });
    return xBucket ? xBucket.x : getValueBucketBound(x, data.xBucketSize, 1);
  }

  getYBucketIndex(y, data) {
    if (data.tsBuckets) {
      return Math.floor(y);
    }
    const yBucketIndex = getValueBucketBound(y, data.yBucketSize, this.panel.yAxis.logBase);
    return yBucketIndex;
  }

  getSharedTooltipPos(pos) {
    // get pageX from position on x axis and pageY from relative position in original panel
    pos.pageX = this.heatmapPanel.offset().left + this.scope.xScale(pos.x);
    pos.pageY = this.heatmapPanel.offset().top + this.scope.chartHeight * pos.panelRelY;
    return pos;
  }

  addHistogram(data) {
    const xBucket = this.scope.ctrl.data.buckets[data.x];
    const yBucketSize = this.scope.ctrl.data.yBucketSize;
    let min, max, ticks;
    if (this.scope.ctrl.data.tsBuckets) {
      min = 0;
      max = this.scope.ctrl.data.tsBuckets.length - 1;
      ticks = this.scope.ctrl.data.tsBuckets.length;
    } else {
      min = this.scope.ctrl.data.yAxis.min;
      max = this.scope.ctrl.data.yAxis.max;
      ticks = this.scope.ctrl.data.yAxis.ticks;
    }
    let histogramData = _.map(xBucket.buckets, bucket => {
      const count = bucket.count !== undefined ? bucket.count : bucket.values.length;
      return [bucket.bounds.bottom, count];
    });
    histogramData = _.filter(histogramData, d => {
      return d[0] >= min && d[0] <= max;
    });

    const scale = this.scope.yScale.copy();
    const histXScale = scale.domain([min, max]).range([0, HISTOGRAM_WIDTH]);

    let barWidth;
    if (this.panel.yAxis.logBase === 1) {
      barWidth = Math.floor(HISTOGRAM_WIDTH / (max - min) * yBucketSize * 0.9);
    } else {
      const barNumberFactor = yBucketSize ? yBucketSize : 1;
      barWidth = Math.floor(HISTOGRAM_WIDTH / ticks / barNumberFactor * 0.9);
    }
    barWidth = Math.max(barWidth, 1);

    // Normalize histogram Y axis
    const histogramDomain = _.reduce(_.map(histogramData, d => d[1]), (sum, val) => sum + val, 0);
    const histYScale = d3
      .scaleLinear()
      .domain([0, histogramDomain])
      .range([0, HISTOGRAM_HEIGHT]);

    const histogram = this.tooltip
      .select('.heatmap-histogram')
      .append('svg')
      .attr('width', HISTOGRAM_WIDTH)
      .attr('height', HISTOGRAM_HEIGHT);

    histogram
      .selectAll('.bar')
      .data(histogramData)
      .enter()
      .append('rect')
      .attr('x', d => {
        return histXScale(d[0]);
      })
      .attr('width', barWidth)
      .attr('y', d => {
        return HISTOGRAM_HEIGHT - histYScale(d[1]);
      })
      .attr('height', d => {
        return histYScale(d[1]);
      });
  }

  move(pos) {
    if (!this.tooltip) {
      return;
    }

    const elem = $(this.tooltip.node())[0];
    const tooltipWidth = elem.clientWidth;
    const tooltipHeight = elem.clientHeight;

    let left = pos.pageX + TOOLTIP_PADDING_X;
    let top = pos.pageY + TOOLTIP_PADDING_Y;

    if (pos.pageX + tooltipWidth + 40 > window.innerWidth) {
      left = pos.pageX - tooltipWidth - TOOLTIP_PADDING_X;
    }

    if (pos.pageY - window.pageYOffset + tooltipHeight + 20 > window.innerHeight) {
      top = pos.pageY - tooltipHeight - TOOLTIP_PADDING_Y;
    }

    return this.tooltip.style('left', left + 'px').style('top', top + 'px');
  }

  countValueFormatter(decimals, scaledDecimals = null) {
    const format = 'short';
    return value => {
      return kbn.valueFormats[format](value, decimals, scaledDecimals);
    };
  }
}
