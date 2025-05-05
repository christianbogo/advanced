import React from 'react';
import { useFilterContext } from './filter/FilterContext';
import Meets from './window/meets/Meets';
import './styles/layout.css';
import './styles/resizable-panels.css';
import Teams from './window/teams/Teams';
import Seasons from './window/seasons/Seasons';
import Athletes from './window/athletes/Athletes';
import Persons from './window/persons/Persons';
import Results from './window/results/Results';
import Events from './window/events/Events';
import FormViewportContainer from './form/FormViewportContainer';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function App() {
  const { state: filterState } = useFilterContext();
  const shouldRenderAthletes =
    filterState.superSelected.team.length > 0 ||
    filterState.superSelected.season.length > 0;

  const panelCommonProps = {
    style: { overflow: 'hidden' },
    minSizePercentage: 5,
  };

  const horizontalHandleProps = {
    className: 'resize-handle horizontal',
  };
  const verticalHandleProps = {
    className: 'resize-handle vertical',
  };

  return (
    <div className="app">
      <PanelGroup
        direction="horizontal"
        className="resizable-main-group"
        autoSaveId="appMainLayout-Horizontal-v1"
      >
        <Panel {...panelCommonProps} defaultSize={25} order={1}>
          <PanelGroup
            direction="vertical"
            className="nested-vertical-group"
            autoSaveId="appCol1Layout-Vertical-v1"
          >
            <Panel {...panelCommonProps} defaultSize={33} order={1}>
              <div className="panel-content-container">
                <Teams />
              </div>
            </Panel>
            <PanelResizeHandle {...verticalHandleProps}>
              <div className="resize-handle-inner vertical" />
            </PanelResizeHandle>
            <Panel {...panelCommonProps} defaultSize={34} order={2}>
              <div className="panel-content-container">
                <Seasons />
              </div>
            </Panel>
            <PanelResizeHandle {...verticalHandleProps}>
              <div className="resize-handle-inner vertical" />
            </PanelResizeHandle>
            <Panel {...panelCommonProps} defaultSize={33} order={3}>
              <div className="panel-content-container">
                <Meets />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle {...horizontalHandleProps}>
          <div className="resize-handle-inner horizontal" />
        </PanelResizeHandle>
        <Panel {...panelCommonProps} defaultSize={25} order={2}>
          <PanelGroup
            direction="vertical"
            className="nested-vertical-group"
            autoSaveId="appCol2Layout-Vertical-v1"
          >
            {shouldRenderAthletes && (
              <>
                <Panel {...panelCommonProps} defaultSize={50} order={1}>
                  <div className="panel-content-container">
                    <Athletes />
                  </div>
                </Panel>
                <PanelResizeHandle {...verticalHandleProps}>
                  <div className="resize-handle-inner vertical" />
                </PanelResizeHandle>
              </>
            )}
            <Panel
              {...panelCommonProps}
              defaultSize={shouldRenderAthletes ? 50 : 100}
              order={2}
            >
              <div className="panel-content-container">
                <Persons />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle {...horizontalHandleProps}>
          <div className="resize-handle-inner horizontal" />
        </PanelResizeHandle>
        <Panel {...panelCommonProps} defaultSize={25} order={3}>
          <PanelGroup
            direction="vertical"
            className="nested-vertical-group"
            autoSaveId="appCol3Layout-Vertical-v1"
          >
            <Panel {...panelCommonProps} defaultSize={25} order={1}>
              <div className="panel-content-container">
                <Results />
              </div>
            </Panel>
            <PanelResizeHandle {...verticalHandleProps}>
              <div className="resize-handle-inner vertical" />
            </PanelResizeHandle>
            <Panel {...panelCommonProps} defaultSize={25} order={2}>
              <div className="panel-content-container placeholder">
                Imports Window
              </div>
            </Panel>
            <PanelResizeHandle {...verticalHandleProps}>
              <div className="resize-handle-inner vertical" />
            </PanelResizeHandle>
            <Panel {...panelCommonProps} defaultSize={25} order={3}>
              <div className="panel-content-container placeholder">
                Bests Window
              </div>
            </Panel>
            <PanelResizeHandle {...verticalHandleProps}>
              <div className="resize-handle-inner vertical" />
            </PanelResizeHandle>
            <Panel {...panelCommonProps} defaultSize={25} order={4}>
              <div className="panel-content-container">
                <Events />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle {...horizontalHandleProps}>
          <div className="resize-handle-inner horizontal" />
        </PanelResizeHandle>
        <Panel {...panelCommonProps} defaultSize={25} order={4}>
          <div className="form-viewport panel-content-container">
            <FormViewportContainer />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

export default App;
