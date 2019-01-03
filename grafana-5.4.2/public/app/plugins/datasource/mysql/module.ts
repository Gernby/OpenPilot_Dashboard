import { MysqlDatasource } from './datasource';
import { MysqlQueryCtrl } from './query_ctrl';

class MysqlConfigCtrl {
  static templateUrl = 'partials/config.html';
}

const defaultQuery = `SELECT
    UNIX_TIMESTAMP(<time_column>) as time_sec,
    <text_column> as text,
    <tags_column> as tags
  FROM <table name>
  WHERE $__timeFilter(time_column)
  ORDER BY <time_column> ASC
  LIMIT 100
  `;

class MysqlAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';

  annotation: any;

  /** @ngInject */
  constructor() {
    this.annotation.rawQuery = this.annotation.rawQuery || defaultQuery;
  }
}

export {
  MysqlDatasource,
  MysqlDatasource as Datasource,
  MysqlQueryCtrl as QueryCtrl,
  MysqlConfigCtrl as ConfigCtrl,
  MysqlAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};
