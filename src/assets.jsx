// All real SVG assets, imported so Vite bundles them (no CDN, no expiry).
import logo from "./assets/logo.svg";
import runFailed from "./assets/run-failed.svg";
import search from "./assets/search.svg";
import add from "./assets/add.svg";
import check from "./assets/check.svg";
import minimise from "./assets/minimise.svg";
import dock from "./assets/dock.svg";
import cancel from "./assets/cancel.svg";
import layers from "./assets/layers.svg";
import keyDown from "./assets/key-down.svg";
import keyUp from "./assets/key-up.svg";
import refresh from "./assets/refresh.svg";
import userProfile from "./assets/user-profile.svg";
import hierarchyLine from "./assets/hierarchy-line.svg";
import network from "./assets/network.svg";
import labelFilter from "./assets/label-filter.svg";
import filesFolder from "./assets/files-folder.svg";
import arrowLeft from "./assets/arrow-left.svg";
import arrowRight from "./assets/arrow-right.svg";
import panelGlossary from "./assets/panel-glossary.svg";
import panelTimesteps from "./assets/panel-timesteps.svg";
import panelSwmmNetwork from "./assets/panel-swmm-network.svg";
import panel2dResults from "./assets/panel-2d-results.svg";
import panelTextEditor from "./assets/panel-text-editor.svg";
import panelDiagnostics from "./assets/panel-diagnostics.svg";
import tuflowEstry1d from "./assets/tuflow-estry-1d.svg";
import tuflowAddModel from "./assets/tuflow-add-model.svg";
import tuflowImportLayers from "./assets/tuflow-import-layers.svg";
import tuflowTools from "./assets/tuflow-tools.svg";
import fm2d1d2dLinkGenerator from "./assets/fm2d-1d2d-link-generator.svg";
import fm2d1dLevelLink from "./assets/fm2d-1d-level-link.svg";
import fm2d1dFlowLink from "./assets/fm2d-1d-flow-link.svg";
import fm2d1dWeirLink from "./assets/fm2d-1d-weir-link.svg";
import fm2dTopoPolygon from "./assets/fm2d-topo-polygon.svg";
import fm2dTopoPolyline from "./assets/fm2d-topo-polyline.svg";
import fm2dTopoPoints from "./assets/fm2d-topo-points.svg";
import fm2dLoadShapefileTopo from "./assets/fm2d-load-shapefile-topo.svg";
import fm2dLoadGroundElev from "./assets/fm2d-load-ground-elev.svg";
import fm2dDefineTopo from "./assets/fm2d-define-topo.svg";
import fm2dRainfallPolygon from "./assets/fm2d-rainfall-polygon.svg";
import fm2dInfiltrationPolygon from "./assets/fm2d-infiltration-polygon.svg";
import fm2dLoadRainInfilShapefile from "./assets/fm2d-load-rain-infil-shapefile.svg";
import fm2dZlinePolyline from "./assets/fm2d-zline-polyline.svg";
import fm2dZlinePolylineImport from "./assets/fm2d-zline-polyline-import.svg";
import fm2dZlinePoints from "./assets/fm2d-zline-points.svg";
import fm2dZlinePointsImport from "./assets/fm2d-zline-points-import.svg";
import homeDownloadFathomData from "./assets/home-download-fathom-data.svg";
import homeLoadFathomData from "./assets/home-load-fathom-data.svg";
import hydroCalcPoints from "./assets/hydro-calc-points.svg";
import simLoad from "./assets/sim-load.svg";

import crossSection from "./assets/cross-section-node.svg";
import interpolate from "./assets/interpolate-node.svg";
import circularArch from "./assets/circular-arch.svg";
import flowTime from "./assets/flow-time.svg";
import normalDepth from "./assets/normal-depth.svg";
import broadWeir from "./assets/broad-crested-weir.svg";
import superBridge from "./assets/super-bridge.svg";
import spill from "./assets/spill.svg";
import openJunction from "./assets/open-junction.svg";
import blockage from "./assets/blockage.svg";
import cesSection from "./assets/ces-section.svg";
import muskingum from "./assets/muskingum.svg";
import muskingumR from "./assets/muskingum-r.svg";
import muskingumV from "./assets/muskingum-v.svg";
import muskingumX from "./assets/muskingum-x.svg";
import refh2 from "./assets/refh2.svg";
import connectorGaugeV2 from "./assets/connector-gauge-v2.svg";
import toolboxChevronCollapsed from "./assets/toolbox-chevron-collapsed.svg";
import toolboxChevronExpanded from "./assets/toolbox-chevron-expanded.svg";
import toolboxTool from "./assets/toolbox-tool.svg";
import toolboxToolDisabled from "./assets/toolbox-tool-disabled.svg";
import toolboxHeaderIcon from "./assets/toolbox-header-icon.svg";
import toolboxUndock from "./assets/toolbox-undock.svg";
import loadRiverNetwork from "./assets/load-1d-network.svg";
import newRiverNetwork from "./assets/new-1d-network.svg";
import saveRiverNetwork from "./assets/save-1d-network.svg";
import saveAsRiverNetwork from "./assets/save-as-1d-network.svg";
import floodplain from "./assets/floodplain.svg";
import onlinePond from "./assets/online-pond.svg";
import reservoir from "./assets/reservoir.svg";
import usbprBridge from "./assets/usbpr-bridge.svg";
import archBridge from "./assets/arch-bridge.svg";
import pierLossBridge from "./assets/pier-loss-bridge.svg";
import breach from "./assets/breach.svg";
import pump from "./assets/pump.svg";
import generalLoss from "./assets/general-loss.svg";
import labelsColor from "./assets/labels-color.svg";
import rulesColor from "./assets/rules-color.svg";
import settingsColor from "./assets/settings-color.svg";
import fm1dTools from "./assets/fm1d-tools.svg";

import conduitFullArch from "./assets/conduit-full-arch.svg";
import conduitSprungArch from "./assets/conduit-sprung-arch.svg";
import conduitRectangular from "./assets/conduit-rectangular.svg";
import conduitSymmetrical from "./assets/conduit-symmetrical.svg";
import conduitAsymmetrical from "./assets/conduit-asymmetrical.svg";
import orifice from "./assets/orifice.svg";
import invertedSyphon from "./assets/inverted-syphon.svg";
import outfall from "./assets/outfall.svg";
import floodReliefArch from "./assets/flood-relief-arch.svg";
import culvertBend from "./assets/culvert-bend.svg";
import culvertInlet from "./assets/culvert-inlet.svg";
import culvertOutlet from "./assets/culvert-outlet.svg";
import radialSluice from "./assets/radial-sluice.svg";
import verticalSluice from "./assets/vertical-sluice.svg";
import bernoulliLoss from "./assets/bernoulli-loss.svg";
import leakyDam from "./assets/leaky-dam.svg";
import crumpWeir from "./assets/crump-weir.svg";
import flowHeadControl from "./assets/flow-head-control.svg";
import flatVWeir from "./assets/flat-v-weir.svg";
import gatedWeir from "./assets/gated-weir.svg";
import labyrinthWeir from "./assets/labyrinth-weir.svg";
import notionalWeir from "./assets/notional-weir.svg";
import sharpCrestedWeir from "./assets/sharp-crested-weir.svg";
import syphonWeir from "./assets/syphon-weir.svg";
import generalWeir from "./assets/general-weir.svg";

import replicateNode from "./assets/replicate-node.svg";
import boundaryHeadtime from "./assets/boundary-headtime.svg";
import boundaryRainfallEvap from "./assets/boundary-rainfall-evap.svg";
import boundaryAbstraction from "./assets/boundary-abstraction.svg";
import boundaryTidal from "./assets/boundary-tidal.svg";
import boundaryFlowHead from "./assets/boundary-flow-head.svg";
import hydrographGenRainfall from "./assets/hydrograph-gen-rainfall.svg";
import hydrographFeh from "./assets/hydrograph-feh.svg";
import hydrographRefh from "./assets/hydrograph-refh.svg";
import hydrographFrqsim from "./assets/hydrograph-frqsim.svg";
import hydrographFssr from "./assets/hydrograph-fssr.svg";
import connectorEnergyJunction from "./assets/connector-energy-junction.svg";
import connectorLateral from "./assets/connector-lateral.svg";
import connectorManhole from "./assets/connector-manhole.svg";
import connectorGauge from "./assets/connector-gauge.svg";
import fm2dPolyline from "./assets/fm2d-polyline.svg";
import fm2dPolyArea from "./assets/fm2d-poly-area.svg";
import guiPolyPoint from "./assets/gui-poly-point.svg";
import zmodPolygon from "./assets/zmod-polygon.svg";
import zmodPolyline from "./assets/zmod-polyline.svg";
import zmodPoints from "./assets/zmod-points.svg";
import zmodVertice from "./assets/zmod-vertice.svg";
import settingsOutline from "./assets/settings-outline.svg";
import swmmJunction from "./assets/swmm-junction.svg";
import swmmOutfall from "./assets/swmm-outfall.svg";
import swmmRaingauge from "./assets/swmm-raingauge.svg";
import swmmStorage from "./assets/swmm-storage.svg";
import swmmSubcatchment from "./assets/swmm-subcatchment.svg";
import mergeUnion from "./assets/merge-union.svg";
import mergeDivide from "./assets/merge-divide.svg";
import mergeSubtract from "./assets/merge-subtract.svg";
import sim1dRiver from "./assets/sim-1d-river.svg";
import simTuflow from "./assets/sim-tuflow.svg";
import simEstry from "./assets/sim-estry.svg";
import resultEmbeddedStructures from "./assets/result-embedded-structures.svg";
import hydroLoadHplus from "./assets/hydro-load-hplus.svg";
import hydroRefh from "./assets/hydro-refh.svg";
import hydroFsuPortal from "./assets/hydro-fsu-portal.svg";
import hydroRiverStations from "./assets/hydro-river-stations.svg";
import hydroCatchDesc from "./assets/hydro-catch-desc.svg";
import simQuality from "./assets/sim-quality.svg";
import simNew2d from "./assets/sim-new-2d.svg";
import simBuilder from "./assets/sim-builder.svg";
import simRun from "./assets/sim-run.svg";
import simRunBatch from "./assets/sim-run-batch.svg";
import results1d from "./assets/results-1d.svg";
import results1dFloodMap from "./assets/results-1d-flood-map.svg";
import resultsTabularCsv from "./assets/results-tabular-csv.svg";
import results2d from "./assets/results-2d.svg";
import results2dFloodMap from "./assets/results-2d-flood-map.svg";
import resultsDamageCalculator from "./assets/results-damage-calculator.svg";
import resultsComments from "./assets/results-comments.svg";
import favStar from "./assets/fav-star.svg";
import chartAnalytics from "./assets/chart-analytics.svg";

import cursorSelect from "./assets/cursor-select.svg";
import calcPointWeir from "./assets/calc-point-weir.svg";
import lhs0 from "./assets/lhs-0.svg";
import lhs1 from "./assets/lhs-1.svg";
import lhs2 from "./assets/lhs-2.svg";
import lhs3 from "./assets/lhs-3.svg";
import lhsList from "./assets/lhs-list.svg";
import lhsFm2d from "./assets/lhs-fm2d.svg";
import lhsDataLibrary from "./assets/lhs-data-library.svg";
import lhsChevronRight from "./assets/lhs-chevron-right.svg";
import lhsChevronDown from "./assets/lhs-chevron-down.svg";
import simChevron from "./assets/sim-chevron.svg";
import lhsPlus from "./assets/lhs-plus.svg";
import lhsMinus from "./assets/lhs-minus.svg";
import lhsRaster from "./assets/lhs-raster.svg";
import lhsRasterHide from "./assets/lhs-raster-hide.svg";
import lhsTxtFile from "./assets/lhs-txt-file.svg";
import lhsPolygon from "./assets/lhs-polygon.svg";
import lhsLink from "./assets/lhs-link.svg";
import lhsPolyline from "./assets/lhs-polyline.svg";
import rectangleSelect from "./assets/rectangle-select.svg";
import ellipticalSelect from "./assets/elliptical-select.svg";
import freeformSelect from "./assets/freeform-select.svg";
import measureTool from "./assets/measure-tool.svg";
import pointQuery from "./assets/point-query.svg";
import pan from "./assets/pan.svg";
import zoomTool from "./assets/zoom-tool.svg";
import edit from "./assets/edit.svg";
import editStop from "./assets/edit-stop.svg";
import editPenTool from "./assets/edit-pen-tool.svg";
import editAddVertex from "./assets/edit-add-vertex.svg";
import editMovePolygon from "./assets/edit-move-polygon.svg";
import editSnapPoint from "./assets/edit-snap-point.svg";
import editLayers from "./assets/edit-layers.svg";
import editViewAttribute from "./assets/edit-view-attribute.svg";
import editSave from "./assets/edit-save.svg";
import editSaveAs from "./assets/edit-save-as.svg";
import editUndo from "./assets/edit-undo.svg";
import editRedo from "./assets/edit-redo.svg";
import editRevert from "./assets/edit-revert.svg";
import editMoveVertex from "./assets/edit-move-vertex.svg";
import editDeleteVertex from "./assets/edit-delete-vertex.svg";
import editRotateShape from "./assets/edit-rotate-shape.svg";
import editReverseShape from "./assets/edit-reverse-shape.svg";
import editDeleteShape from "./assets/edit-delete-shape.svg";
import editSnapLine from "./assets/edit-snap-line.svg";
import editSnapPointLine from "./assets/edit-snap-point-line.svg";
import editSnapMapGrid from "./assets/edit-snap-map-grid.svg";
import editTraceLine from "./assets/edit-trace-line.svg";
import editSnapSettings from "./assets/edit-snap-settings.svg";
import northStar from "./assets/north-star.svg";
import comment from "./assets/comment.svg";
import placeholder from "./assets/placeholder.svg";

import homeLoadFile from "./assets/home-load-file.svg";
import homeExpand from "./assets/home-expand.svg";
import homeAddBookmark from "./assets/home-add-bookmark.svg";
import homeNote from "./assets/home-note.svg";
import homeMarker from "./assets/home-marker.svg";
import homeAddGis from "./assets/home-add-gis.svg";
import homeGoToMap from "./assets/home-go-to-map.svg";
import homeMapView from "./assets/home-map-view.svg";
import homeFathom from "./assets/home-fathom.svg";
import homeOpenProject from "./assets/home-open-project.svg";
import homeNewProject from "./assets/home-new-project.svg";
import homeTextBox from "./assets/home-text-box.svg";
import homeHighlighter from "./assets/home-highlighter.svg";
import homeArrowTool from "./assets/home-arrow-tool.svg";
import toggleOffX from "./assets/toggle-off-x.svg";
import flowLinesIcon from "./assets/flow-lines.svg";
import globalAnimatorIcon from "./assets/global-animator.svg";
import toggleOnCheck from "./assets/toggle-on-check.svg";

import mouseLeft from "./assets/mouse-left.svg";
import mouseScroll from "./assets/mouse-scroll.svg";
import mouseRight from "./assets/mouse-right.svg";
import mouseLeftDrag from "./assets/mouse-left-drag.svg";
import mouseLeftDrag2 from "./assets/mouse-left-drag2.svg";

import ribbonActiveArea from "./assets/ribbon-active-area.svg";
import ribbonBoundaryCondition from "./assets/ribbon-boundary-condition.svg";
import ribbonDefineTopo from "./assets/ribbon-define-topo.svg";
import ribbon1dEmbed from "./assets/ribbon-1d-embed.svg";
import ribbon1d2dLink from "./assets/ribbon-1d2d-link.svg";
import fm2dNew2dModel from "./assets/fm2d-new-2d-model.svg";
import fm2dRoughness from "./assets/fm2d-roughness.svg";
import fm2dRainInfiltration from "./assets/fm2d-rain-infiltration.svg";
import fm2dInputConverter from "./assets/fm2d-input-converter.svg";
import ribbonPolyline from "./assets/ribbon-polyline.svg";
import ribbonZmod from "./assets/ribbon-zmod.svg";
import ribbonGenImesh from "./assets/ribbon-gen-imesh.svg";
import ribbonModImesh from "./assets/ribbon-mod-imesh.svg";
import ribbonImport from "./assets/ribbon-import.svg";
import ribbonPolygon from "./assets/ribbon-polygon.svg";
import ribbonPoint from "./assets/ribbon-point.svg";
import ribbonTools from "./assets/ribbon-tools.svg";
import ribbonSwmm1dLink from "./assets/ribbon-swmm-1d-link.svg";
import ribbonSwmm2dLink from "./assets/ribbon-swmm-2d-link.svg";
import ribbonViewLabels from "./assets/ribbon-view-labels.svg";
import ribbonEditNode from "./assets/ribbon-edit-node.svg";
import ribbonSelectionMode from "./assets/ribbon-selection-mode.svg";
import ribbonAddLink from "./assets/ribbon-add-link.svg";
import ribbonSwmmNode from "./assets/ribbon-swmm-node.svg";

// Dropdown-item icons pulled from the Flood-Icons repo (robertdonegan/Flood-Icons)
// to replace "placeholder" entries in ModeRibbon.jsx's submenus.
import worldTiltRotation from "./assets/world-tilt-rotation.svg";
import moduleLibrary from "./assets/module-library.svg";
import worldMapView2 from "./assets/world-map-view-2.svg";
import generalEdit from "./assets/general-edit.svg";
import filesTxtFile from "./assets/files-txt-file.svg";
import editorColorLens from "./assets/editor-color-lens.svg";
import generalToolboxIcon from "./assets/general-toolbox-icon.svg";
import swmmDivider from "./assets/swmm-divider.svg";
import filesLink from "./assets/files-link.svg";
import generalInvisible from "./assets/general-invisible.svg";
import guiCombineShape from "./assets/gui-combine-shape.svg";
import guiIntersectShape from "./assets/gui-intersect-shape.svg";
import chartsReportLine from "./assets/charts-report-line.svg";
import chartsReportFilled from "./assets/charts-report-filled.svg";
import chartsVisTrendDashed from "./assets/charts-vis-trend-dashed.svg";
import fm2dLine from "./assets/fm2d-line.svg";
import filesRaster from "./assets/files-raster.svg";
import hydroNewHplus from "./assets/hydro-new-hplus.svg";
import swmmNew from "./assets/swmm-new.svg";
import swmmLoad from "./assets/swmm-load.svg";
import swmmSave from "./assets/swmm-save.svg";
import swmmSaveAs from "./assets/swmm-save-as.svg";
import swmmSelection from "./assets/swmm-selection.svg";

// Second Figma sync pass (Modes & Ribbons node 1-1071 / Dropdowns node 3619-76488) —
// icons pulled from the fuller robertdonegan/Flood-Icons source tree (flood-icons/icons/,
// not the smaller published dist/api snapshot, which lags behind).
import hydroStormDuration from "./assets/hydro-storm-duration.svg";
import fm1dResGen from "./assets/fm1d-res-gen.svg";
import fm1dSpillGen from "./assets/fm1d-spill-gen.svg";
import fm1dCrossSectionGen from "./assets/fm1d-cross-section-gen.svg";
import resultsTinShapefile from "./assets/results-tin-shapefile.svg";
import resultsTinCrossSection from "./assets/results-tin-cross-section.svg";
import resultsAdd1dTin from "./assets/results-add-1d-tin.svg";
import results2dUpload from "./assets/results-2d-upload.svg";
import resultsGlobalPlayer from "./assets/results-global-player.svg";
import resultsMultiPlayer from "./assets/results-multi-player.svg";
import fm2dNewModel from "./assets/fm2d-new-model.svg";
import fm2dLoadModel from "./assets/fm2d-load-model.svg";
import fm2dSaveModel from "./assets/fm2d-save-model.svg";
import fm2dSaveAsModel from "./assets/fm2d-save-as-model.svg";
import fm2dShapefileActiveArea from "./assets/fm2d-shapefile-active-area.svg";
import fm2dBoundaryCond from "./assets/fm2d-boundary-cond.svg";
import fm2dShapefileBoundLine from "./assets/fm2d-shapefile-bound-line.svg";
import fm2dDepthVaryPoly from "./assets/fm2d-depth-vary-poly.svg";
import fm2dLandUsePolygon from "./assets/fm2d-land-use-polygon.svg";
import fm2dLoadRoughShapefile from "./assets/fm2d-load-rough-shapefile.svg";
import fm2dBoundaryPoints from "./assets/fm2d-boundary-points.svg";
import fm2dBoundaryPolygon from "./assets/fm2d-boundary-polygon.svg";
import fm2dEmbed1dOrifice from "./assets/fm2d-embed-1d-orifice.svg";
import fm2dEmbed1dCulvert from "./assets/fm2d-embed-1d-culvert.svg";
import fm2dEmbed1dWeir from "./assets/fm2d-embed-1d-weir.svg";
import fm2dLoadEmbed1dStructure from "./assets/fm2d-load-embed-1d-structure.svg";
import fm2dEmbed1dGeneric from "./assets/fm2d-embed-1d-generic.svg";
import fm2dEmbed1dCrumpWeir from "./assets/fm2d-embed-1d-crump-weir.svg";
import fm2dEmbed1dSharpCrestWeir from "./assets/fm2d-embed-1d-sharp-crest-weir.svg";
import fm2dEmbed1dRoundNoseWeir from "./assets/fm2d-embed-1d-round-nose-weir.svg";
import fm2d1dManualLink from "./assets/fm2d-1d-manual-link.svg";
import tuflowAdd from "./assets/tuflow-add.svg";
import tuflowLoad from "./assets/tuflow-load.svg";
import tuflowSave from "./assets/tuflow-save.svg";
import tuflowSaveAs from "./assets/tuflow-save-as.svg";
import tuflow1dNodes from "./assets/tuflow-1d-nodes.svg";
import swmmEditNode from "./assets/swmm-edit-node.svg";
import swmmEditLink from "./assets/swmm-edit-link.svg";
import swmmMultiEdit from "./assets/swmm-multi-edit.svg";
import hydroReportBuilder from "./assets/hydro-report-builder.svg";
import hydroSaveHplus from "./assets/hydro-save-hplus.svg";
import hydroZoomToHplus from "./assets/hydro-zoom-to-hplus.svg";
import hydroHplusProjectDetails from "./assets/hydro-hplus-project-details.svg";
import hydroImportHplus from "./assets/hydro-import-hplus.svg";
import hydroExportHplus from "./assets/hydro-export-hplus.svg";
import hydroStationEa from "./assets/hydro-station-ea.svg";
import hydroStationEaLevel from "./assets/hydro-station-ea-level.svg";
import hydroStationEaFlow from "./assets/hydro-station-ea-flow.svg";
import hydroStationNrfa from "./assets/hydro-station-nrfa.svg";
import hydroStationNrfaQmed from "./assets/hydro-station-nrfa-qmed.svg";
import hydroStationNrfaPooling from "./assets/hydro-station-nrfa-pooling.svg";
import hydroStationShowKey from "./assets/hydro-station-show-key.svg";
import hydroDownloadCatchDesc from "./assets/hydro-download-catch-desc.svg";
import hydroCatchDescTable from "./assets/hydro-catch-desc-table.svg";
import hydroImportCatchDesc from "./assets/hydro-import-catch-desc.svg";
import hydroViewCalcPoint from "./assets/hydro-view-calc-point.svg";
import hydroCalcPointTable from "./assets/hydro-calc-point-table.svg";
import simNewSwmm from "./assets/sim-new-swmm.svg";
import favListSave from "./assets/fav-list-save.svg";
import fm2dZPolygonImport from "./assets/fm2d-z-polygon-import.svg";
import fm2dZPolylineImport from "./assets/fm2d-z-polyline-import.svg";
import fm2dZPointsImport from "./assets/fm2d-z-points-import.svg";

export const A = {
  logo, search, add, check, minimise, dock, cancel, runFailed, layers,
  keyDown, keyUp, refresh, userProfile, hierarchyLine, network, labelFilter,
  filesFolder, arrowLeft, arrowRight,
  panelGlossary, panelTimesteps, panelSwmmNetwork, panel2dResults, panelTextEditor, panelDiagnostics,
  tuflowEstry1d, tuflowAddModel, tuflowImportLayers, tuflowTools, hydroCalcPoints, simLoad,
  fm2d1d2dLinkGenerator, fm2d1dLevelLink, fm2d1dFlowLink, fm2d1dWeirLink,
  fm2dTopoPolygon, fm2dTopoPolyline, fm2dTopoPoints, fm2dLoadShapefileTopo, fm2dLoadGroundElev, fm2dDefineTopo,
  fm2dRainfallPolygon, fm2dInfiltrationPolygon, fm2dLoadRainInfilShapefile,
  fm2dZlinePolyline, fm2dZlinePolylineImport, fm2dZlinePoints, fm2dZlinePointsImport,
  homeDownloadFathomData, homeLoadFathomData,
  crossSection, interpolate, circularArch, flowTime, normalDepth,
  broadWeir, superBridge, spill, openJunction, blockage,
  floodplain, onlinePond, reservoir, usbprBridge, archBridge, pierLossBridge, breach, pump, generalLoss,
  loadRiverNetwork, newRiverNetwork, saveRiverNetwork, saveAsRiverNetwork,
  cesSection, muskingum, muskingumR, muskingumV, muskingumX, refh2, connectorGaugeV2,
  toolboxChevronCollapsed, toolboxChevronExpanded, toolboxTool, toolboxToolDisabled, toolboxHeaderIcon, toolboxUndock,
  labelsColor, rulesColor, settingsColor, fm1dTools,
  conduitFullArch, conduitSprungArch, conduitRectangular, conduitSymmetrical, conduitAsymmetrical,
  orifice, invertedSyphon, outfall, floodReliefArch,
  culvertBend, culvertInlet, culvertOutlet,
  radialSluice, verticalSluice, bernoulliLoss, leakyDam,
  crumpWeir, flowHeadControl, flatVWeir, gatedWeir, labyrinthWeir, notionalWeir,
  sharpCrestedWeir, syphonWeir, generalWeir,
  replicateNode,
  boundaryHeadtime, boundaryRainfallEvap, boundaryAbstraction, boundaryTidal, boundaryFlowHead,
  hydrographGenRainfall, hydrographFeh, hydrographRefh, hydrographFrqsim, hydrographFssr,
  connectorEnergyJunction, connectorLateral, connectorManhole, connectorGauge,
  fm2dPolyline, fm2dPolyArea, guiPolyPoint,
  zmodPolygon, zmodPolyline, zmodPoints, zmodVertice, settingsOutline,
  swmmJunction, swmmOutfall, swmmRaingauge, swmmStorage, swmmSubcatchment,
  mergeUnion, mergeDivide, mergeSubtract,
  sim1dRiver, simTuflow, simEstry,
  resultEmbeddedStructures,
  hydroLoadHplus, hydroRefh, hydroFsuPortal, hydroRiverStations, hydroCatchDesc,
  simQuality, simNew2d, simBuilder, simRun, simRunBatch,
  results1d, results1dFloodMap, resultsTabularCsv, results2d, results2dFloodMap,
  resultsDamageCalculator, resultsComments, favStar, chartAnalytics,
  cursorSelect, calcPointWeir, lhs0, lhs1, lhs2, lhs3, lhsList, lhsFm2d, lhsDataLibrary,
  lhsChevronRight, lhsChevronDown, lhsPlus, lhsTxtFile, lhsPolygon, lhsLink, lhsPolyline,
  lhsMinus, lhsRaster, lhsRasterHide, simChevron,
  rectangleSelect, ellipticalSelect, freeformSelect, measureTool, pointQuery, pan, zoomTool, edit, editStop, northStar, comment,
  editPenTool, editAddVertex, editMovePolygon, editSnapPoint, editLayers, editViewAttribute, editSave, editSaveAs,
  editUndo, editRedo, editRevert, editMoveVertex, editDeleteVertex, editRotateShape, editReverseShape, editDeleteShape,
  editSnapLine, editSnapPointLine, editSnapMapGrid, editTraceLine, editSnapSettings,
  placeholder,
  homeLoadFile, homeExpand, homeAddBookmark, homeNote, homeMarker, homeAddGis,
  homeGoToMap, homeMapView, homeFathom, homeOpenProject, homeNewProject,
  homeTextBox, homeHighlighter, homeArrowTool,
  toggleOffX, toggleOnCheck, flowLinesIcon, globalAnimatorIcon,
  mouseLeft, mouseScroll, mouseRight, mouseLeftDrag, mouseLeftDrag2,
  ribbonActiveArea, ribbonBoundaryCondition, ribbonDefineTopo, ribbon1dEmbed, ribbon1d2dLink,
  fm2dNew2dModel, fm2dRoughness, fm2dRainInfiltration, fm2dInputConverter,
  ribbonPolyline, ribbonZmod, ribbonGenImesh, ribbonModImesh, ribbonImport, ribbonPolygon,
  ribbonPoint, ribbonTools, ribbonSwmm1dLink, ribbonSwmm2dLink, ribbonViewLabels,
  ribbonEditNode, ribbonSelectionMode, ribbonAddLink, ribbonSwmmNode,
  worldTiltRotation, moduleLibrary, worldMapView2, generalEdit, filesTxtFile, editorColorLens, generalToolboxIcon, swmmDivider, filesLink,
  generalInvisible, guiCombineShape, guiIntersectShape, chartsReportLine, chartsReportFilled,
  chartsVisTrendDashed, fm2dLine, filesRaster, hydroNewHplus,
  swmmNew, swmmLoad, swmmSave, swmmSaveAs, swmmSelection,
  hydroStormDuration, fm1dResGen, fm1dSpillGen, fm1dCrossSectionGen,
  resultsTinShapefile, resultsTinCrossSection, resultsAdd1dTin, results2dUpload,
  resultsGlobalPlayer, resultsMultiPlayer,
  fm2dNewModel, fm2dLoadModel, fm2dSaveModel, fm2dSaveAsModel,
  fm2dShapefileActiveArea, fm2dBoundaryCond, fm2dShapefileBoundLine,
  fm2dDepthVaryPoly, fm2dLandUsePolygon, fm2dLoadRoughShapefile,
  fm2dBoundaryPoints, fm2dBoundaryPolygon,
  fm2dEmbed1dOrifice, fm2dEmbed1dCulvert, fm2dEmbed1dWeir, fm2dLoadEmbed1dStructure,
  fm2dEmbed1dGeneric, fm2dEmbed1dCrumpWeir, fm2dEmbed1dSharpCrestWeir, fm2dEmbed1dRoundNoseWeir,
  fm2d1dManualLink,
  tuflowAdd, tuflowLoad, tuflowSave, tuflowSaveAs, tuflow1dNodes,
  swmmEditNode, swmmEditLink, swmmMultiEdit,
  hydroReportBuilder, hydroSaveHplus, hydroZoomToHplus, hydroHplusProjectDetails,
  hydroImportHplus, hydroExportHplus,
  hydroStationEa, hydroStationEaLevel, hydroStationEaFlow,
  hydroStationNrfa, hydroStationNrfaQmed, hydroStationNrfaPooling,
  hydroStationShowKey, hydroDownloadCatchDesc, hydroCatchDescTable, hydroImportCatchDesc,
  hydroViewCalcPoint, hydroCalcPointTable,
  simNewSwmm,
  fm2dZPolygonImport, fm2dZPolylineImport, fm2dZPointsImport,
  favListSave,
};

// Small helper for a fixed-size icon <img>
export function Icon({ src, size = 16, style, alt = "" }) {
  return (
    <img
      src={src} alt={alt} draggable={false}
      style={{ width: size, height: size, display: "block", flexShrink: 0, ...style }}
    />
  );
}
