import { ElasticResponse } from '../elastic_response';

describe('ElasticResponse', () => {
  let targets;
  let response;
  let result;

  describe('simple query and count', () => {
    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'count', id: '1' }],
          bucketAggs: [{ type: 'date_histogram', field: '@timestamp', id: '2' }],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '2': {
                buckets: [
                  {
                    doc_count: 10,
                    key: 1000,
                  },
                  {
                    doc_count: 15,
                    key: 2000,
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return 1 series', () => {
      expect(result.data.length).toBe(1);
      expect(result.data[0].target).toBe('Count');
      expect(result.data[0].datapoints.length).toBe(2);
      expect(result.data[0].datapoints[0][0]).toBe(10);
      expect(result.data[0].datapoints[0][1]).toBe(1000);
    });
  });

  describe('simple query count & avg aggregation', () => {
    let result;

    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'count', id: '1' }, { type: 'avg', field: 'value', id: '2' }],
          bucketAggs: [{ type: 'date_histogram', field: '@timestamp', id: '3' }],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '3': {
                buckets: [
                  {
                    '2': { value: 88 },
                    doc_count: 10,
                    key: 1000,
                  },
                  {
                    '2': { value: 99 },
                    doc_count: 15,
                    key: 2000,
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return 2 series', () => {
      expect(result.data.length).toBe(2);
      expect(result.data[0].datapoints.length).toBe(2);
      expect(result.data[0].datapoints[0][0]).toBe(10);
      expect(result.data[0].datapoints[0][1]).toBe(1000);

      expect(result.data[1].target).toBe('Average value');
      expect(result.data[1].datapoints[0][0]).toBe(88);
      expect(result.data[1].datapoints[1][0]).toBe(99);
    });
  });

  describe('single group by query one metric', () => {
    let result;

    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'count', id: '1' }],
          bucketAggs: [
            { type: 'terms', field: 'host', id: '2' },
            { type: 'date_histogram', field: '@timestamp', id: '3' },
          ],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '2': {
                buckets: [
                  {
                    '3': {
                      buckets: [{ doc_count: 1, key: 1000 }, { doc_count: 3, key: 2000 }],
                    },
                    doc_count: 4,
                    key: 'server1',
                  },
                  {
                    '3': {
                      buckets: [{ doc_count: 2, key: 1000 }, { doc_count: 8, key: 2000 }],
                    },
                    doc_count: 10,
                    key: 'server2',
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return 2 series', () => {
      expect(result.data.length).toBe(2);
      expect(result.data[0].datapoints.length).toBe(2);
      expect(result.data[0].target).toBe('server1');
      expect(result.data[1].target).toBe('server2');
    });
  });

  describe('single group by query two metrics', () => {
    let result;

    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'count', id: '1' }, { type: 'avg', field: '@value', id: '4' }],
          bucketAggs: [
            { type: 'terms', field: 'host', id: '2' },
            { type: 'date_histogram', field: '@timestamp', id: '3' },
          ],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '2': {
                buckets: [
                  {
                    '3': {
                      buckets: [
                        { '4': { value: 10 }, doc_count: 1, key: 1000 },
                        { '4': { value: 12 }, doc_count: 3, key: 2000 },
                      ],
                    },
                    doc_count: 4,
                    key: 'server1',
                  },
                  {
                    '3': {
                      buckets: [
                        { '4': { value: 20 }, doc_count: 1, key: 1000 },
                        { '4': { value: 32 }, doc_count: 3, key: 2000 },
                      ],
                    },
                    doc_count: 10,
                    key: 'server2',
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return 2 series', () => {
      expect(result.data.length).toBe(4);
      expect(result.data[0].datapoints.length).toBe(2);
      expect(result.data[0].target).toBe('server1 Count');
      expect(result.data[1].target).toBe('server1 Average @value');
      expect(result.data[2].target).toBe('server2 Count');
      expect(result.data[3].target).toBe('server2 Average @value');
    });
  });

  describe('with percentiles ', () => {
    let result;

    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'percentiles', settings: { percents: [75, 90] }, id: '1' }],
          bucketAggs: [{ type: 'date_histogram', field: '@timestamp', id: '3' }],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '3': {
                buckets: [
                  {
                    '1': { values: { '75': 3.3, '90': 5.5 } },
                    doc_count: 10,
                    key: 1000,
                  },
                  {
                    '1': { values: { '75': 2.3, '90': 4.5 } },
                    doc_count: 15,
                    key: 2000,
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return 2 series', () => {
      expect(result.data.length).toBe(2);
      expect(result.data[0].datapoints.length).toBe(2);
      expect(result.data[0].target).toBe('p75');
      expect(result.data[1].target).toBe('p90');
      expect(result.data[0].datapoints[0][0]).toBe(3.3);
      expect(result.data[0].datapoints[0][1]).toBe(1000);
      expect(result.data[1].datapoints[1][0]).toBe(4.5);
    });
  });

  describe('with extended_stats', () => {
    let result;

    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [
            {
              type: 'extended_stats',
              meta: { max: true, std_deviation_bounds_upper: true },
              id: '1',
            },
          ],
          bucketAggs: [{ type: 'terms', field: 'host', id: '3' }, { type: 'date_histogram', id: '4' }],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '3': {
                buckets: [
                  {
                    key: 'server1',
                    '4': {
                      buckets: [
                        {
                          '1': {
                            max: 10.2,
                            min: 5.5,
                            std_deviation_bounds: { upper: 3, lower: -2 },
                          },
                          doc_count: 10,
                          key: 1000,
                        },
                      ],
                    },
                  },
                  {
                    key: 'server2',
                    '4': {
                      buckets: [
                        {
                          '1': {
                            max: 10.2,
                            min: 5.5,
                            std_deviation_bounds: { upper: 3, lower: -2 },
                          },
                          doc_count: 10,
                          key: 1000,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return 4 series', () => {
      expect(result.data.length).toBe(4);
      expect(result.data[0].datapoints.length).toBe(1);
      expect(result.data[0].target).toBe('server1 Max');
      expect(result.data[1].target).toBe('server1 Std Dev Upper');

      expect(result.data[0].datapoints[0][0]).toBe(10.2);
      expect(result.data[1].datapoints[0][0]).toBe(3);
    });
  });

  describe('single group by with alias pattern', () => {
    let result;

    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'count', id: '1' }],
          alias: '{{term @host}} {{metric}} and {{not_exist}} {{@host}}',
          bucketAggs: [
            { type: 'terms', field: '@host', id: '2' },
            { type: 'date_histogram', field: '@timestamp', id: '3' },
          ],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '2': {
                buckets: [
                  {
                    '3': {
                      buckets: [{ doc_count: 1, key: 1000 }, { doc_count: 3, key: 2000 }],
                    },
                    doc_count: 4,
                    key: 'server1',
                  },
                  {
                    '3': {
                      buckets: [{ doc_count: 2, key: 1000 }, { doc_count: 8, key: 2000 }],
                    },
                    doc_count: 10,
                    key: 'server2',
                  },
                  {
                    '3': {
                      buckets: [{ doc_count: 2, key: 1000 }, { doc_count: 8, key: 2000 }],
                    },
                    doc_count: 10,
                    key: 0,
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return 2 series', () => {
      expect(result.data.length).toBe(3);
      expect(result.data[0].datapoints.length).toBe(2);
      expect(result.data[0].target).toBe('server1 Count and {{not_exist}} server1');
      expect(result.data[1].target).toBe('server2 Count and {{not_exist}} server2');
      expect(result.data[2].target).toBe('0 Count and {{not_exist}} 0');
    });
  });

  describe('histogram response', () => {
    let result;

    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'count', id: '1' }],
          bucketAggs: [{ type: 'histogram', field: 'bytes', id: '3' }],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '3': {
                buckets: [{ doc_count: 1, key: 1000 }, { doc_count: 3, key: 2000 }, { doc_count: 2, key: 1000 }],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return table with byte and count', () => {
      expect(result.data[0].rows.length).toBe(3);
      expect(result.data[0].columns).toEqual([{ text: 'bytes', filterable: true }, { text: 'Count' }]);
    });
  });

  describe('with two filters agg', () => {
    let result;

    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'count', id: '1' }],
          bucketAggs: [
            {
              id: '2',
              type: 'filters',
              settings: {
                filters: [{ query: '@metric:cpu' }, { query: '@metric:logins.count' }],
              },
            },
            { type: 'date_histogram', field: '@timestamp', id: '3' },
          ],
        },
      ];
      response = {
        responses: [
          {
            aggregations: {
              '2': {
                buckets: {
                  '@metric:cpu': {
                    '3': {
                      buckets: [{ doc_count: 1, key: 1000 }, { doc_count: 3, key: 2000 }],
                    },
                  },
                  '@metric:logins.count': {
                    '3': {
                      buckets: [{ doc_count: 2, key: 1000 }, { doc_count: 8, key: 2000 }],
                    },
                  },
                },
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return 2 series', () => {
      expect(result.data.length).toBe(2);
      expect(result.data[0].datapoints.length).toBe(2);
      expect(result.data[0].target).toBe('@metric:cpu');
      expect(result.data[1].target).toBe('@metric:logins.count');
    });
  });

  describe('with dropfirst and last aggregation', () => {
    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'avg', id: '1' }, { type: 'count' }],
          bucketAggs: [
            {
              id: '2',
              type: 'date_histogram',
              field: 'host',
              settings: { trimEdges: 1 },
            },
          ],
        },
      ];

      response = {
        responses: [
          {
            aggregations: {
              '2': {
                buckets: [
                  {
                    '1': { value: 1000 },
                    key: 1,
                    doc_count: 369,
                  },
                  {
                    '1': { value: 2000 },
                    key: 2,
                    doc_count: 200,
                  },
                  {
                    '1': { value: 2000 },
                    key: 3,
                    doc_count: 200,
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should remove first and last value', () => {
      expect(result.data.length).toBe(2);
      expect(result.data[0].datapoints.length).toBe(1);
    });
  });

  describe('No group by time', () => {
    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'avg', id: '1' }, { type: 'count' }],
          bucketAggs: [{ id: '2', type: 'terms', field: 'host' }],
        },
      ];

      response = {
        responses: [
          {
            aggregations: {
              '2': {
                buckets: [
                  {
                    '1': { value: 1000 },
                    key: 'server-1',
                    doc_count: 369,
                  },
                  {
                    '1': { value: 2000 },
                    key: 'server-2',
                    doc_count: 200,
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return table', () => {
      expect(result.data.length).toBe(1);
      expect(result.data[0].type).toBe('table');
      expect(result.data[0].rows.length).toBe(2);
      expect(result.data[0].rows[0][0]).toBe('server-1');
      expect(result.data[0].rows[0][1]).toBe(1000);
      expect(result.data[0].rows[0][2]).toBe(369);

      expect(result.data[0].rows[1][0]).toBe('server-2');
      expect(result.data[0].rows[1][1]).toBe(2000);
    });
  });

  describe('Multiple metrics of same type', () => {
    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'avg', id: '1', field: 'test' }, { type: 'avg', id: '2', field: 'test2' }],
          bucketAggs: [{ id: '2', type: 'terms', field: 'host' }],
        },
      ];

      response = {
        responses: [
          {
            aggregations: {
              '2': {
                buckets: [
                  {
                    '1': { value: 1000 },
                    '2': { value: 3000 },
                    key: 'server-1',
                    doc_count: 369,
                  },
                ],
              },
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should include field in metric name', () => {
      expect(result.data[0].type).toBe('table');
      expect(result.data[0].rows[0][1]).toBe(1000);
      expect(result.data[0].rows[0][2]).toBe(3000);
    });
  });

  describe('Raw documents query', () => {
    beforeEach(() => {
      targets = [
        {
          refId: 'A',
          metrics: [{ type: 'raw_document', id: '1' }],
          bucketAggs: [],
        },
      ];
      response = {
        responses: [
          {
            hits: {
              total: 100,
              hits: [
                {
                  _id: '1',
                  _type: 'type',
                  _index: 'index',
                  _source: { sourceProp: 'asd' },
                  fields: { fieldProp: 'field' },
                },
                {
                  _source: { sourceProp: 'asd2' },
                  fields: { fieldProp: 'field2' },
                },
              ],
            },
          },
        ],
      };

      result = new ElasticResponse(targets, response).getTimeSeries();
    });

    it('should return docs', () => {
      expect(result.data.length).toBe(1);
      expect(result.data[0].type).toBe('docs');
      expect(result.data[0].total).toBe(100);
      expect(result.data[0].datapoints.length).toBe(2);
      expect(result.data[0].datapoints[0].sourceProp).toBe('asd');
      expect(result.data[0].datapoints[0].fieldProp).toBe('field');
    });
  });
});
