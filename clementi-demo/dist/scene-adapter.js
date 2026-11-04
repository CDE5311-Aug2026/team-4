/* Presents the Clementi simulation through Downstairs' retained Three.js scene API. */
(function (root) {
  'use strict';
  const plotIds = root.CM_DATA.plots.map(p=>p.id);
  let sceneState = { plots: new Array(plotIds.length).fill(null), unlocked: plotIds.length-1, flags: {} };
  let currentState = null, currentOptions = {}, lastModel = null;
  let completedAt = Object.create(null);

  function getSelection() {
    const selected = root.CM_APP && root.CM_APP.getSelection ? root.CM_APP.getSelection() : null;
    if (typeof selected === 'string') return selected;
    return selected && (selected.selectingCard || selected.selecting || selected.selected) || null;
  }
  function cardList() {
    return (root.CM_DATA && root.CM_DATA.cards || []).map(function (c) { return { id: c.id, name: c.title }; });
  }
  function sync(state, opts) {
    if (!state) state = root.CM_APP && root.CM_APP.getState ? root.CM_APP.getState() : currentState;
    if (!state) return;
    currentOptions = Object.assign({}, currentOptions, opts || {});
    if (lastModel !== state) {
      lastModel = state;
      completedAt = Object.create(null);
      sceneState = { plots: new Array(plotIds.length).fill(null), unlocked: plotIds.length-1, flags: {} };
    }
    currentState = state;
    sceneState.flags = state.flags || {};
    sceneState.groups = state.groups || {};
    sceneState.events = state.events || [];
    sceneState.projects = state.projects || [];
    sceneState.issues = state.issues || [];
    sceneState.simTime = state.time || 0;
    sceneState.plots = plotIds.map(function (id, index) {
      if (root.CM_DATA.plots[index].kind==='locked') return null;
      const p = state.plots && state.plots[id];
      if (!p || !p.cardId || p.status === 'available' || p.status === 'locked') return null;
      const project = (state.projects || []).find(function (project) { return project.plotId === id && project.cardId === p.cardId; });
      const building = p.status === 'building';
      const key = id + ':' + p.cardId;
      if (!building && completedAt[key] == null) completedAt[key] = state.time || 0;
      return {
        cardId: p.cardId,
        placement: p.placement || project && project.placement || {x:0,z:0,rotation:0},
        status: building ? 'building' : 'complete',
        progress: building && project ? Math.max(0, Math.min(1, 1 - project.remaining / Math.max(1, project.total))) : building ? 0 : 1,
        builtRound: building ? null : p.completedAt == null ? completedAt[key] : p.completedAt
      };
    });
    root.Downstairs.cards = cardList();
    const selected = Object.prototype.hasOwnProperty.call(currentOptions, 'selectingCard') ? currentOptions.selectingCard : getSelection();
    const c = (root.CM_DATA && root.CM_DATA.cards || []).find(function (card) { return card.id === selected; });
    if (root.HDBScene && root.HDBScene.ready) {
      root.HDBScene.sync(sceneState, {
        placed: true,
        landIndex: 0,
        view: root.HDBScene.view || 'neighborhood',
        selected: selected || null,
        selectedPlot: currentOptions.selectedPlot || null,
        showLand: currentOptions.showLand !== false,
        validPlots: !selected ? [] : Array.isArray(currentOptions.validPlots) ? currentOptions.validPlots : root.CM_ENGINE?.eligiblePlots?.(state,selected) || c?.land || [],
        issues: (Array.isArray(currentOptions.issues) ? currentOptions.issues : (state.issues || []).filter(function (issue) { return issue.status === 'open'; })).filter(function(issue){return (issue.channel || root.CM_DATA.issueChannels[issue.id])==='world';}),
        focusIssue: currentOptions.focusIssue || null,
        language: currentOptions.language || 'zh',
        paused: currentOptions.paused !== false,
        simTime: Number.isFinite(currentOptions.simTime) ? currentOptions.simTime : state.time || 0,
        placement: currentOptions.placement || {x:0,z:0,rotation:0},
        tab: 'facility'
      });
    }
  }
  root.Downstairs = { cards: cardList() };
  root.DownstairsUI = {
    scenePlot: function (index) {
      const id = plotIds[index];
      if (id && root.CM_APP && root.CM_APP.showPlot) root.CM_APP.showPlot(id);
    },
    sceneResident: function (id) {
      if (root.CM_APP && root.CM_APP.showResident) root.CM_APP.showResident(id);
    },
    sceneBuilding: function () {
      if (root.HDBScene && root.HDBScene.view === 'overview') { root.HDBScene.showNeighborhood(); return; }
      if (root.CM_APP && root.CM_APP.showResidents) root.CM_APP.showResidents();
      else if (root.CM_APP && root.CM_APP.showResident) root.CM_APP.showResident('chen');
    },
    sceneLand: function () { if (root.HDBScene) root.HDBScene.showNeighborhood(); },
    sceneHover: function (text) {
      const element = document.getElementById('world-hover');
      if (!element) return;
      element.textContent = text || '';
      element.hidden = !text;
    },
    appSceneReady: function () { sync(currentState || (root.CM_APP && root.CM_APP.getState && root.CM_APP.getState()), currentOptions); }
  };
  root.CM_SCENE = {
    sync: sync,
    focusIssue: function (id) { return root.HDBScene && root.HDBScene.focusIssue ? root.HDBScene.focusIssue(id) : false; },
    focusPlot: function (id) { return root.HDBScene?.focusPlot?.(id) || false; },
    celebrate: function (event) { return root.HDBScene?.celebrate?.(event) || false; },
    plotIds: plotIds.slice(),
    diagnostics: function () { return root.HDBScene && root.HDBScene.diagnostics ? root.HDBScene.diagnostics() : { ready: false }; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
