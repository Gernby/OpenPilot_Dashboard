import React from 'react';
import { NavModel, NavModelItem } from 'app/types';
import classNames from 'classnames';
import appEvents from 'app/core/app_events';

export interface Props {
  model: NavModel;
}

const SelectNav = ({ main, customCss }: { main: NavModelItem; customCss: string }) => {
  const defaultSelectedItem = main.children.find(navItem => {
    return navItem.active === true;
  });

  const gotoUrl = evt => {
    const element = evt.target;
    const url = element.options[element.selectedIndex].value;
    appEvents.emit('location-change', { href: url });
  };

  return (
    <div className={`gf-form-select-wrapper width-20 ${customCss}`}>
      <label className={`gf-form-select-icon ${defaultSelectedItem.icon}`} htmlFor="page-header-select-nav" />
      {/* Label to make it clickable */}
      <select
        className="gf-select-nav gf-form-input"
        value={defaultSelectedItem.url}
        onChange={gotoUrl}
        id="page-header-select-nav"
      >
        {main.children.map((navItem: NavModelItem) => {
          if (navItem.hideFromTabs) {
            // TODO: Rename hideFromTabs => hideFromNav
            return null;
          }
          return (
            <option key={navItem.url} value={navItem.url}>
              {navItem.text}
            </option>
          );
        })}
      </select>
    </div>
  );
};

const Tabs = ({ main, customCss }: { main: NavModelItem; customCss: string }) => {
  return (
    <ul className={`gf-tabs ${customCss}`}>
      {main.children.map((tab, idx) => {
        if (tab.hideFromTabs) {
          return null;
        }

        const tabClasses = classNames({
          'gf-tabs-link': true,
          active: tab.active,
        });

        return (
          <li className="gf-tabs-item" key={tab.url}>
            <a className={tabClasses} target={tab.target} href={tab.url}>
              <i className={tab.icon} />
              {tab.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

const Navigation = ({ main }: { main: NavModelItem }) => {
  return (
    <nav>
      <SelectNav customCss="page-header__select-nav" main={main} />
      <Tabs customCss="page-header__tabs" main={main} />
    </nav>
  );
};

export default class PageHeader extends React.Component<Props, any> {
  constructor(props) {
    super(props);
  }

  shouldComponentUpdate() {
    //Hack to re-render on changed props from angular with the @observer decorator
    return true;
  }

  renderTitle(title: string, breadcrumbs: any[]) {
    if (!title && (!breadcrumbs || breadcrumbs.length === 0)) {
      return null;
    }

    if (!breadcrumbs || breadcrumbs.length === 0) {
      return <h1 className="page-header__title">{title}</h1>;
    }

    const breadcrumbsResult = [];
    for (let i = 0; i < breadcrumbs.length; i++) {
      const bc = breadcrumbs[i];
      if (bc.url) {
        breadcrumbsResult.push(
          <a className="text-link" key={i} href={bc.url}>
            {bc.title}
          </a>
        );
      } else {
        breadcrumbsResult.push(<span key={i}> / {bc.title}</span>);
      }
    }
    breadcrumbsResult.push(<span key={breadcrumbs.length + 1}> / {title}</span>);

    return <h1 className="page-header__title">{breadcrumbsResult}</h1>;
  }

  renderHeaderTitle(main) {
    return (
      <div className="page-header__inner">
        <span className="page-header__logo">
          {main.icon && <i className={`page-header__icon ${main.icon}`} />}
          {main.img && <img className="page-header__img" src={main.img} />}
        </span>

        <div className="page-header__info-block">
          {this.renderTitle(main.text, main.breadcrumbs)}
          {main.subTitle && <div className="page-header__sub-title">{main.subTitle}</div>}
          {main.subType && (
            <div className="page-header__stamps">
              <i className={main.subType.icon} />
              {main.subType.text}
            </div>
          )}
        </div>
      </div>
    );
  }

  render() {
    const { model } = this.props;

    if (!model) {
      return null;
    }

    const main = model.main;

    return (
      <div className="page-header-canvas">
        <div className="page-container">
          <div className="page-header">
            {this.renderHeaderTitle(main)}
            {main.children && <Navigation main={main} />}
          </div>
        </div>
      </div>
    );
  }
}
