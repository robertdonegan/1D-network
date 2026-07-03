// All real SVG assets, imported so Vite bundles them (no CDN, no expiry).
import logo from "./assets/logo.svg";
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

import load1d from "./assets/load-1d-nwrk.svg";
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
import labelsColor from "./assets/labels-color.svg";
import rulesColor from "./assets/rules-color.svg";
import settingsColor from "./assets/settings-color.svg";

import cursorSelect from "./assets/cursor-select.svg";
import calcPointWeir from "./assets/calc-point-weir.svg";
import lhs0 from "./assets/lhs-0.svg";
import lhs1 from "./assets/lhs-1.svg";
import lhs2 from "./assets/lhs-2.svg";
import lhs3 from "./assets/lhs-3.svg";
import rectangleSelect from "./assets/rectangle-select.svg";
import measureTool from "./assets/measure-tool.svg";
import pointQuery from "./assets/point-query.svg";
import pan from "./assets/pan.svg";
import zoomTool from "./assets/zoom-tool.svg";
import edit from "./assets/edit.svg";
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

export const A = {
  logo, search, add, check, minimise, dock, cancel, layers,
  keyDown, keyUp, refresh, userProfile, hierarchyLine, network, labelFilter,
  load1d, crossSection, interpolate, circularArch, flowTime, normalDepth,
  broadWeir, superBridge, spill, openJunction, blockage,
  labelsColor, rulesColor, settingsColor,
  cursorSelect, calcPointWeir, lhs0, lhs1, lhs2, lhs3,
  rectangleSelect, measureTool, pointQuery, pan, zoomTool, edit, northStar, comment,
  placeholder,
  homeLoadFile, homeExpand, homeAddBookmark, homeNote, homeMarker, homeAddGis,
  homeGoToMap, homeMapView, homeFathom, homeOpenProject, homeNewProject,
  mouseLeft, mouseScroll, mouseRight, mouseLeftDrag, mouseLeftDrag2,
  ribbonActiveArea, ribbonBoundaryCondition, ribbonDefineTopo, ribbon1dEmbed, ribbon1d2dLink,
  ribbonPolyline, ribbonZmod, ribbonGenImesh, ribbonModImesh, ribbonImport, ribbonPolygon,
  ribbonPoint, ribbonTools, ribbonSwmm1dLink, ribbonSwmm2dLink, ribbonViewLabels,
  ribbonEditNode, ribbonSelectionMode, ribbonAddLink, ribbonSwmmNode,
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
