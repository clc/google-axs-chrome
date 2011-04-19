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
 * @fileoverview Script that runs on the background page.
 *
 * @author dmazzoni@google.com (Dominic Mazzoni)
 */

goog.provide('cvox.ChromeVoxBackground');

goog.require('cvox.BuildConfig');

goog.require('cvox.ChromeVox');
goog.require('cvox.ChromeVoxAccessibilityApiHandler');
goog.require('cvox.ChromeVoxChromeOsTtsEngine');
goog.require('cvox.ChromeVoxEarcons');
goog.require('cvox.ChromeVoxEmacspeakTtsServerEngine');
goog.require('cvox.ChromeVoxExtensionTtsEngine');
goog.require('cvox.ChromeVoxLocalTtsServerEngine');
goog.require('cvox.ExtensionBridge');
goog.require('cvox.LocalEarconsManager');
goog.require('cvox.LocalTtsManager');



/**
 * This object manages the global and persistent state for ChromeVox.
 * It listens for messages from the content scripts on pages and
 * interprets them.
 * @constructor
 */
cvox.ChromeVoxBackground = function() {
};


/**
 * Initialize the background page: set up TTS and bridge listeners.
 */
cvox.ChromeVoxBackground.prototype.init = function() {
  var stkyKey = cvox.ChromeVox.stickyKeyStr;
  var stkyKeyCode = cvox.ChromeVox.stickyKeyCode;
  var mod1 = cvox.ChromeVox.modKeyStr;

  // TODO (clchen): Implement the options page - but make sure the default
  // is set on the background page, because the options page doesn't actually
  // load unless the user opens it.
  var keyMap = {};
  // Stop TTS
  keyMap['Ctrl+'] = ['stopSpeech', 'Stop speaking']; // Ctrl
  keyMap['Cvox+'] = ['stopSpeech', 'Stop speaking']; // Ctrl

  // Double tap Modifier#1
  keyMap[(stkyKey + '>' + stkyKey + '+')] =
      ['toggleStickyMode', 'Enable/Disable sticky mode'];

  // TAB/Shift+TAB
  keyMap['#9'] = ['handleTab', 'Jump to next focusable item']; // Tab
  keyMap['Shift+#9'] = ['handleTab', 'Jump to previous focusable item'];

  // Basic navigation
  keyMap[(mod1 + '+#38')] = ['backward', 'Navigate backward'];
  keyMap[(mod1 + '+#40')] = ['forward', 'Navigate forward'];
  keyMap[(mod1 + '+#37')] =
      ['previousGranularity', 'Decrease navigation granularity'];
  keyMap[(mod1 + '+#39')] =
      ['nextGranularity', 'Increase navigation granularity'];
  keyMap['#13'] = ['actOnCurrentItem', 'Take action on current item']; // ENTER
  keyMap[(mod1 + '+#32')] =
      ['forceClickOnCurrentItem', 'Click on current item']; // SPACE

  // General commands
  keyMap[(mod1 + '+#190')] = ['showPowerKey', 'Show ChromeVox help']; // '.'
  keyMap[(mod1)] = ['hidePowerKey', 'Hide ChromeVox help']; // modifier
  keyMap[(mod1 + '+H')] = ['help', 'Open ChromeVox help documentation'];
  keyMap[(mod1 + '+#191')] =
      ['toggleSearchWidget', 'Toggle search widget'];    // '/'
  keyMap[(mod1 + '+O>B')] = ['showBookmarkManager', 'Open bookmark manager'];
  keyMap[(mod1 + '+O>W')] = ['showOptionsPage', 'Open options page'];
  keyMap[(mod1 + '+O>K')] = ['showKbExplorerPage', 'Open keyboard explorer'];
  keyMap[(mod1 + '+N>A')] = ['nextTtsEngine', 'Switch to next TTS engine'];
  keyMap[(mod1 + '+#189')] =
      ['decreaseTtsRate', 'Decrease rate of speech']; // '-'
  keyMap[(mod1 + '+#187')] =
      ['increaseTtsRate', 'Increase rate of speech']; // '='
  keyMap[(mod1 + '+#186')] = ['decreaseTtsPitch', 'Decrease pitch']; // ';'
  keyMap[(mod1 + '+#222')] = ['increaseTtsPitch', 'Increase pitch']; // '''
  keyMap[(mod1 + '+#219')] =
      ['decreaseTtsVolume', 'Decrease speech volume']; // '['
  keyMap[(mod1 + '+#221')] =
      ['increaseTtsVolume', 'Increase speech volume']; // ']'

  // Mode commands
  keyMap[(mod1 + '+T>E')] = ['enterTable', 'Enter table']; //'T' > 'E'
  keyMap[(mod1 + '+T>#8')] = ['exitTable', 'Exit table']; // ']' > 'Backspace'

  keyMap[(mod1 + '+T>I')] =
      ['previousRow', 'Previous table row']; // 'T' > 'I'
  keyMap[(mod1 + '+T>M')] = ['nextRow', 'Next table row']; // 'T' > 'M'
  keyMap[(mod1 + '+T>J')] =
      ['previousCol', 'Previous table column']; // 'T' > 'J'
  keyMap[(mod1 + '+T>K')] =
      ['nextCol', 'Next table column']; // 'T' > 'K'

  keyMap[(mod1 + '+T>#38')] =
      ['previousRow', 'Previous table row']; // 'T' > Up
  keyMap[(mod1 + '+T>#40')] = ['nextRow', 'Next table row']; // 'T' > Down
  keyMap[(mod1 + '+T>#37')] =
      ['previousCol', 'Previous table column']; // 'T' > Left
  keyMap[(mod1 + '+T>#39')] =
      ['nextCol', 'Next table column']; // 'T' > Right

  keyMap[(mod1 + '+T>W')] =
      ['previousRow', 'Previous table row']; // 'T' > 'W'
  keyMap[(mod1 + '+T>S')] = ['nextRow', 'Next table row']; // 'T' > 'S'
  keyMap[(mod1 + '+T>A')] =
      ['previousCol', 'Previous table column']; // 'T' > 'A'
  keyMap[(mod1 + '+T>D')] =
      ['nextCol', 'Next table column']; // 'T' > 'D'

  keyMap[(mod1 + '+T>H')] =
      ['announceHeaders', 'Announce the headers of the current cell']; // T > H
  keyMap[(mod1 + '+T>L')] =
      ['speakTableLocation', 'Announce the current table location']; // T > L

  keyMap[(mod1 + '+T>R')] =
      ['guessRowHeader', 'Make a guess at the row header of the current cell'];
  // T > R
  keyMap[(mod1 + '+T>C')] = ['guessColHeader',
    'Make a guess at the column header of the current cell']; // T > L

  keyMap[(mod1 + '+T>#219')] =
      ['skipToBeginning', 'Go to beginning of table']; // 'T' > '['
  keyMap[(mod1 + '+T>#221')] =
      ['skipToEnd', 'Go to end of table']; // 'T' > ']'

  keyMap[(mod1 + '+T>#186')] =
      ['skipToRowBeginning', 'Go to beginning of the current row']; // 'T' > ';'
  keyMap[(mod1 + '+T>#222')] =
      ['skipToRowEnd', 'Go to end of the current row']; // 'T' > '''

  keyMap[(mod1 + '+T>#188')] =
      ['skipToColBeginning', 'Go to beginning of the current column'];
  keyMap[(mod1 + '+T>#190')] =
      ['skipToColEnd', 'Go to end of the current column']; // 'T' > '.'

  // Jump commands
  keyMap[(mod1 + '+N>1')] = ['nextHeading1', 'Next level 1 heading'];
  keyMap[(mod1 + '+P>1')] = ['previousHeading1', 'Previous level 1 heading'];
  keyMap[(mod1 + '+N>2')] = ['nextHeading2', 'Next level 2 heading'];
  keyMap[(mod1 + '+P>2')] = ['previousHeading2', 'Previous level 2 heading'];
  keyMap[(mod1 + '+N>3')] = ['nextHeading3', 'Next level 3 heading'];
  keyMap[(mod1 + '+P>3')] = ['previousHeading3', 'Previous level 3 heading'];
  keyMap[(mod1 + '+N>4')] = ['nextHeading4', 'Next level 4 heading'];
  keyMap[(mod1 + '+P>4')] = ['previousHeading4', 'Previous level 4 heading'];
  keyMap[(mod1 + '+N>5')] = ['nextHeading5', 'Next level 5 heading'];
  keyMap[(mod1 + '+P>5')] = ['previousHeading5', 'Previous level 5 heading'];
  keyMap[(mod1 + '+N>6')] = ['nextHeading6', 'Next level 6 heading'];
  keyMap[(mod1 + '+P>6')] = ['previousHeading6', 'Previous level 6 heading'];
  keyMap[(mod1 + '+N>C')] = ['nextComboBox', 'Next combo box'];
  keyMap[(mod1 + '+P>C')] = ['previousComboBox', 'Previous combo box'];
  keyMap[(mod1 + '+N>E')] = ['nextEditText', 'Next editable text area'];
  keyMap[(mod1 + '+P>E')] = ['previousEditText', 'Previous editable text area'];
  keyMap[(mod1 + '+N>F')] = ['nextFormField', 'Next form field'];
  keyMap[(mod1 + '+P>F')] = ['previousFormField', 'Previous form field'];
  keyMap[(mod1 + '+N>G')] = ['nextGraphic', 'Next graphic'];
  keyMap[(mod1 + '+P>G')] = ['previousGraphic', 'Previous graphic'];
  keyMap[(mod1 + '+N>H')] = ['nextHeading', 'Next heading'];
  keyMap[(mod1 + '+P>H')] = ['previousHeading', 'Previous heading'];
  keyMap[(mod1 + '+N>I')] = ['nextListItem', 'Next list item'];
  keyMap[(mod1 + '+P>I')] = ['previousListItem', 'Previous list item'];
  keyMap[(mod1 + '+N>L')] = ['nextLink', 'Next link'];
  keyMap[(mod1 + '+P>L')] = ['previousLink', 'Previous link'];
  keyMap[(mod1 + '+N>O')] = ['nextList', 'Next list'];
  keyMap[(mod1 + '+P>O')] = ['previousList', 'Previous list'];
  keyMap[(mod1 + '+N>Q')] = ['nextBlockquote', 'Next block quote'];
  keyMap[(mod1 + '+P>Q')] = ['previousBlockquote', 'Previous block quote'];
  keyMap[(mod1 + '+N>R')] = ['nextRadio', 'Next radio button'];
  keyMap[(mod1 + '+P>R')] = ['previousRadio', 'Previous radio button'];
  keyMap[(mod1 + '+N>S')] = ['nextSlider', 'Next slider'];
  keyMap[(mod1 + '+P>S')] = ['previousSlider', 'Previous slider'];
  keyMap[(mod1 + '+N>T')] = ['nextTable', 'Next table'];
  keyMap[(mod1 + '+P>T')] = ['previousTable', 'Previous table'];
  keyMap[(mod1 + '+N>U')] = ['nextButton', 'Next button'];
  keyMap[(mod1 + '+P>U')] = ['previousButton', 'Previous button'];
  keyMap[(mod1 + '+N>X')] = ['nextCheckbox', 'Next checkbox'];
  keyMap[(mod1 + '+P>X')] = ['previousCheckbox', 'Previous checkbox'];

  localStorage['keyBindings'] = JSON.stringify(keyMap);

  this.ttsManager = this.createTtsManager();
  this.earconsManager = this.createEarconsManager(this.ttsManager);
  this.addBridgeListener();

  cvox.ChromeVoxAccessibilityApiHandler.init(this.ttsManager,
      this.earconsManager);
};


/**
 * @return {cvox.AbstractTtsManager} New initialized TTS manager.
 */
cvox.ChromeVoxBackground.prototype.createTtsManager = function() {
  var ttsEngines = [cvox.ChromeVoxChromeOsTtsEngine,
    cvox.ChromeVoxEmacspeakTtsServerEngine];
  return new cvox.LocalTtsManager(ttsEngines, null);
};


/**
 * @param {cvox.AbstractTtsManager} ttsManager A TTS Manager.
 * @return {Object} New initialized earcons manager.
 */
cvox.ChromeVoxBackground.prototype.createEarconsManager = function(ttsManager) {
  return new cvox.LocalEarconsManager([cvox.ChromeVoxEarcons], ttsManager);
};


/**
 * Send all of the settings to all active tabs.
 */
cvox.ChromeVoxBackground.prototype.sendSettingsToActiveTab = function() {
  cvox.ExtensionBridge.send({'keyBindings':
        JSON.parse(localStorage['keyBindings'])});
};


/**
 * Send all of the settings over the specified port.
 * @param {Port} port The port representing the connection to a content script.
 */
cvox.ChromeVoxBackground.prototype.sendSettingsToPort = function(port) {
  port.postMessage({'keyBindings':
        JSON.parse(localStorage['keyBindings'])});
};


/**
 * Called when a TTS message is received from a page content script.
 * @param {Object} msg The TTS message.
 */
cvox.ChromeVoxBackground.prototype.onTtsMessage = function(msg) {
  if (msg.action == 'speak') {
    this.ttsManager.speak(msg.text, msg.queueMode, msg.properties);
  } else if (msg.action == 'stop') {
    this.ttsManager.stop();
  } else if (msg.action == 'nextEngine') {
    this.ttsManager.nextTtsEngine(true);
  } else if (msg.action == 'increaseRate') {
    this.ttsManager.increaseProperty(
        cvox.AbstractTtsManager.TTS_PROPERTY_RATE, msg.modifier);
  } else if (msg.action == 'decreaseRate') {
    this.ttsManager.decreaseProperty(
        cvox.AbstractTtsManager.TTS_PROPERTY_RATE, msg.modifier);
  } else if (msg.action == 'increasePitch') {
    this.ttsManager.increaseProperty(
        cvox.AbstractTtsManager.TTS_PROPERTY_PITCH, msg.modifier);
  } else if (msg.action == 'decreasePitch') {
    this.ttsManager.decreaseProperty(
        cvox.AbstractTtsManager.TTS_PROPERTY_PITCH, msg.modifier);
  } else if (msg.action == 'increaseVolume') {
    this.ttsManager.increaseProperty(
        cvox.AbstractTtsManager.TTS_PROPERTY_VOLUME, msg.modifier);
  } else if (msg.action == 'decreaseVolume') {
    this.ttsManager.decreaseProperty(
        cvox.AbstractTtsManager.TTS_PROPERTY_VOLUME, msg.modifier);
  }
};


/**
 * Called when an earcon message is received from a page content script.
 * @param {Object} msg The earcon message.
 */
cvox.ChromeVoxBackground.prototype.onEarconMessage = function(msg) {
  if (msg.action == 'play') {
    this.earconsManager.playEarcon(msg.earcon);
  } else if (msg.action == 'nextEarcons') {
    this.earconsManager.nextEarcons();
  }
};


/**
 * Listen for connections from our content script bridges, and dispatch the
 * messages to the proper destination.
 */
cvox.ChromeVoxBackground.prototype.addBridgeListener = function() {
  var context = this;
  cvox.ExtensionBridge.addMessageListener(function(msg, port) {
    if (msg.target == 'BookmarkManager') {
      var createDataObj = new Object();
      createDataObj.url = 'chromevox/background/bookmark_manager.html';
      chrome.windows.create(createDataObj);
    } else if (msg.target == 'KbExplorer') {
      var explorerPage = new Object();
      explorerPage.url = 'chromevox/background/kbexplorer.html';
      chrome.tabs.create(explorerPage);
    } else if (msg.target == 'HelpDocs') {
      var helpPage = new Object();
      helpPage.url = 'http://google-axs-chrome.googlecode.com/svn/trunk/' +
          'chromevox/tutorial/index.html';
      chrome.tabs.create(helpPage);
    } else if (msg.target == 'Options') {
      if (msg.action == 'getSettings') {
        context.sendSettingsToActiveTab();
      } else if (msg.action == 'open') {
        var optionsPage = new Object();
        optionsPage.url = 'chromevox/background/options.html';
        chrome.tabs.create(optionsPage);
      }
    } else if (msg.target == 'TTS') {
      context.onTtsMessage(msg);
    } else if (msg.target == 'EARCON') {
      context.onEarconMessage(msg);
    } else if (msg.target == 'KeyBindings') {
      if (msg.action == 'getBindings') {
        context.sendSettingsToPort(port);
      }
    }
  });
};

var background = new cvox.ChromeVoxBackground();
background.init();

