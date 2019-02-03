// Libaries
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

// Utils & Services
import { appEvents } from 'app/core/app_events';

// State
import { updateLocation } from 'app/core/actions';

// Types
import { DashboardModel } from '../../state/DashboardModel';

export interface Props {
  dashboard: DashboardModel | null;
  editview: string;
  isEditing: boolean;
  isFullscreen: boolean;
  updateLocation: typeof updateLocation;
}

export class DashNav extends PureComponent<Props> {
  onOpenSearch = () => {
    appEvents.emit('show-dash-search');
  };

  onAddPanel = () => {};
  onOpenSettings = () => {
    this.props.updateLocation({
      query: {
        editview: 'settings',
      },
      partial: true,
    })
  };

  renderLoadingState() {
    return (
      <div className="navbar">
        <div>
          <a className="navbar-page-btn" onClick={this.onOpenSearch}>
            <i className="gicon gicon-dashboard" />
            Loading...
            <i className="fa fa-caret-down" />
          </a>
        </div>
      </div>
    );
  }

  render() {
    let { dashboard } = this.props;

    if (!dashboard) {
      return this.renderLoadingState();
    }

    const haveFolder = dashboard.meta.folderId > 0;
    const { canEdit, canSave, folderTitle, showSettings } = dashboard.meta;

    return (
      <div className="navbar">
        <div>
          <a className="navbar-page-btn" onClick={this.onOpenSearch}>
            <i className="gicon gicon-dashboard" />
            {haveFolder && <span className="navbar-page-btn--folder">{folderTitle} / </span>}
            {dashboard.title}
            <i className="fa fa-caret-down" />
          </a>
        </div>

        <div className="navbar__spacer" />
        {/*
        <div class="navbar-buttons navbar-buttons--playlist" ng-if="ctrl.playlistSrv.isPlaying">
          <a class="navbar-button navbar-button--tight" ng-click="ctrl.playlistSrv.prev()"><i class="fa fa-step-backward"></i></a>
          <a class="navbar-button navbar-button--tight" ng-click="ctrl.playlistSrv.stop()"><i class="fa fa-stop"></i></a>
          <a class="navbar-button navbar-button--tight" ng-click="ctrl.playlistSrv.next()"><i class="fa fa-step-forward"></i></a>
        </div>
        */}

        <div className="navbar-buttons navbar-buttons--actions">
          {canEdit && (
            <button className="btn navbar-button navbar-button--add-panel" title="Add panel" onClick={this.onAddPanel}>
              <i className="gicon gicon-add-panel" />
            </button>
          )}

          {showSettings && (
            <button
              className="btn navbar-button navbar-button--settings"
              onClick={this.onOpenSettings}
              title="Dashboard Settings"
            >
              <i className="fa fa-cog" />
            </button>
          )}

          {
            // 	<button class="btn navbar-button navbar-button--star" ng-show="::ctrl.dashboard.meta.canStar" ng-click="ctrl.starDashboard()" bs-tooltip="'Mark as favorite'" data-placement="bottom">
              // 		<i class="fa" ng-class="{'fa-star-o': !ctrl.dashboard.meta.isStarred, 'fa-star': ctrl.dashboard.meta.isStarred}"></i>
              // 	</button>
            //
            //   <button class="btn navbar-button navbar-button--share" ng-show="::ctrl.dashboard.meta.canShare" ng-click="ctrl.shareDashboard(0)" bs-tooltip="'Share dashboard'" data-placement="bottom">
              // 		<i class="fa fa-share-square-o"></i></a>
            // 	</button>
          //
          //   <button class="btn navbar-button navbar-button--save" ng-show="ctrl.dashboard.meta.canSave" ng-click="ctrl.saveDashboard()" bs-tooltip="'Save dashboard <br> CTRL+S'" data-placement="bottom">
              // 		<i class="fa fa-save"></i>
              // 	</button>
            //
            // 	<a class="btn navbar-button navbar-button--snapshot-origin" ng-if="::ctrl.dashboard.snapshot.originalUrl" href="{{ctrl.dashboard.snapshot.originalUrl}}" bs-tooltip="'Open original dashboard'" data-placement="bottom">
              // 		<i class="fa fa-link"></i>
              // 	</a>
            //
            // 	<button class="btn navbar-button navbar-button--settings" ng-click="ctrl.toggleSettings()" bs-tooltip="'Dashboard Settings'" data-placement="bottom" ng-show="ctrl.dashboard.meta.showSettings">
              // 		<i class="fa fa-cog"></i>
              // 	</button>
            // </div>
          //
          // <div class="navbar-buttons navbar-buttons--tv">
            //   <button class="btn navbar-button navbar-button--tv" ng-click="ctrl.toggleViewMode()" bs-tooltip="'Cycle view mode'" data-placement="bottom">
              //     <i class="fa fa-desktop"></i>
              //   </button>
            // </div>
          //
          // <gf-time-picker class="gf-timepicker-nav" dashboard="ctrl.dashboard" ng-if="!ctrl.dashboard.timepicker.hidden"></gf-time-picker>
          //
          // <div class="navbar-buttons navbar-buttons--close">
            // 	<button class="btn navbar-button navbar-button--primary" ng-click="ctrl.close()" bs-tooltip="'Back to dashboard'" data-placement="bottom">
            // 		<i class="fa fa-reply"></i>
            // 	</button>
            // </div>
          }
        </div>
      </div>
    );
  }
}

const mapStateToProps = () => ({
});

const mapDispatchToProps = {
  updateLocation
};

export default connect(mapStateToProps, mapDispatchToProps)(DashNav);
