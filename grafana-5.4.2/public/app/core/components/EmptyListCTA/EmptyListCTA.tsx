import React, { Component } from 'react';

export interface Props {
  model: any;
}

class EmptyListCTA extends Component<Props, any> {
  render() {
    const {
      title,
      buttonIcon,
      buttonLink,
      buttonTitle,
      onClick,
      proTip,
      proTipLink,
      proTipLinkTitle,
      proTipTarget,
    } = this.props.model;
    return (
      <div className="empty-list-cta">
        <div className="empty-list-cta__title">{title}</div>
        <a onClick={onClick} href={buttonLink} className="empty-list-cta__button btn btn-xlarge btn-success">
          <i className={buttonIcon} />
          {buttonTitle}
        </a>
        <div className="empty-list-cta__pro-tip">
          <i className="fa fa-rocket" /> ProTip: {proTip}
          <a className="text-link empty-list-cta__pro-tip-link" href={proTipLink} target={proTipTarget}>
            {proTipLinkTitle}
          </a>
        </div>
      </div>
    );
  }
}

export default EmptyListCTA;
