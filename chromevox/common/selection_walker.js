// Copyright 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A JavaScript class for walking the page using WebKit
 * selection.
 * @author clchen@google.com (Charles L. Chen)
 */


goog.provide('cvox.SelectionWalker');

goog.require('cvox.SelectionUtil');
goog.require('cvox.TraverseContent');

/**
 * @constructor
 */
cvox.SelectionWalker = function() {
  this.traverseContent = new cvox.TraverseContent();
  this.currentGranularity = 0;
};

/**
 * @type {Object}
 */
cvox.SelectionWalker.GRANULARITY_LEVELS = new Array(
    'sentence', 'word', 'character');

/**
 * Decreases the granularity. Also modifies the selection.
 * @param {boolean} forwards True if the selection is moving forwards.
 * @return {boolean} Returns true if the granularity was changed successfully.
 * Returns false if we are already at the least granular setting.
 */
cvox.SelectionWalker.prototype.lessGranular = function(forwards) {
  var success = this.changeGranularity(false);
  if (!success) {
    return false;
  }
  if (forwards) {
    cvox.SelectionUtil.collapseToStart(this.traverseContent.currentDomObj);
    this.next();
  } else {
    cvox.SelectionUtil.collapseToEnd(this.traverseContent.currentDomObj);
    this.previous();
  }
  return true;
};

/**
 * Increases the granularity. Also modifies the selection.
 * @param {boolean} forwards True if the selection is moving forwards.
 * @return {boolean} Returns true if the granularity was changed successfully.
 * Returns false if we are already at the most granular setting.
 */
cvox.SelectionWalker.prototype.moreGranular = function(forwards) {
  var success = this.changeGranularity(true);
  if (!success) {
    return false;
  }
  if (forwards) {
    cvox.SelectionUtil.collapseToStart(this.traverseContent.currentDomObj);
    this.next();
  } else {
    cvox.SelectionUtil.collapseToEnd(this.traverseContent.currentDomObj);
    this.previous();
  }
  return true;
};

/**
 * Moves selection to the next item.
 * @return {boolean} Returns true if the selection was moved successfully.
 */
cvox.SelectionWalker.prototype.next = function() {
  var status = this.traverseContent.nextElement(
      cvox.SelectionWalker.GRANULARITY_LEVELS[this.currentGranularity]);
  return !!status;
};

/**
 * Moves selection to the previous item.
 * @return {boolean} Returns true if the selection was moved successfully.
 */
cvox.SelectionWalker.prototype.previous = function() {
  var status = this.traverseContent.prevElement(
      cvox.SelectionWalker.GRANULARITY_LEVELS[this.currentGranularity]);
  return !!status;
};

/**
 * Returns the current granularity setting.
 * @return {string} The granularity setting.
 */
cvox.SelectionWalker.prototype.getGranularity = function() {
  return cvox.SelectionWalker.GRANULARITY_LEVELS[this.currentGranularity];
};

/**
 * Changes the granularity level.
 * @param {boolean} moreGranular True if we want to be more granular. False if
 * we want to be less granular.
 * @return {boolean} True if the granularity was changed successfully. If
 * moreGranular is true but we are already at the most granular setting or if
 * moreGranular is false but we are already at the least granular setting, the
 * granularity setting will remain the same.
 */
cvox.SelectionWalker.prototype.changeGranularity = function(moreGranular) {
  if (moreGranular) {
    var max = cvox.SelectionWalker.GRANULARITY_LEVELS.length - 1;
    if (this.currentGranularity == max) {
      return false;
    } else {
      this.currentGranularity = this.currentGranularity + 1;
      return true;
    }
  } else {
    if (this.currentGranularity == 0) {
      return false;
    } else {
      this.currentGranularity = this.currentGranularity - 1;
      return true;
    }
  }
};

/**
 * Sets the node that the SelectionWalker should be moving through.
 * @param {Node} currentNode The node to set the SelectionWalker to.
 */
cvox.SelectionWalker.prototype.setCurrentNode = function(currentNode) {
  if (currentNode != this.traverseContent.currentDomObj) {
    this.traverseContent = new cvox.TraverseContent(currentNode);
    this.traverseContent.reset();
  }
};

/**
 * Returns a description of the navigation to the current element.
 * @param {Array.<Node>} ancestorsArray An array of ancestor nodes.
 * @return {cvox.NavDescription} The description of the navigation.
 */
cvox.SelectionWalker.prototype.getCurrentDescription = function(
    ancestorsArray) {
  var description = cvox.DomUtil.getDescriptionFromAncestors(ancestorsArray,
      true, cvox.ChromeVox.verbosity);
  description.text = cvox.SelectionUtil.getText();
  return description;
};
