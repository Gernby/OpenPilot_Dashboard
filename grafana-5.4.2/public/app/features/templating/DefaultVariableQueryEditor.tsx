import React, { PureComponent } from 'react';
import { VariableQueryProps } from 'app/types/plugins';

export default class DefaultVariableQueryEditor extends PureComponent<VariableQueryProps, any> {
  constructor(props) {
    super(props);
    this.state = { value: props.query };
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleBlur(event) {
    this.props.onChange(event.target.value, event.target.value);
  }

  render() {
    return (
      <div className="gf-form">
        <span className="gf-form-label width-10">Query</span>
        <input
          type="text"
          className="gf-form-input"
          value={this.state.value}
          onChange={e => this.handleChange(e)}
          onBlur={e => this.handleBlur(e)}
          placeholder="metric name or tags query"
          required
        />
      </div>
    );
  }
}
