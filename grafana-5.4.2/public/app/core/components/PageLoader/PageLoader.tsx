import React, { SFC } from 'react';

interface Props {
  pageName: string;
}

const PageLoader: SFC<Props> = ({ pageName }) => {
  const loadingText = `Loading ${pageName}...`;
  return (
    <div className="page-loader-wrapper">
      <i className="page-loader-wrapper__spinner fa fa-spinner fa-spin" />
      <div className="page-loader-wrapper__text">{loadingText}</div>
    </div>
  );
};

export default PageLoader;
