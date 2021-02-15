// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/*
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../common/common.js';  // eslint-disable-line no-unused-vars
import * as UI from '../ui/ui.js';

import {ConsoleView} from './ConsoleView.js';

let consolePanelInstance: ConsolePanel;

export class ConsolePanel extends UI.Panel.Panel {
  _view: ConsoleView;
  constructor() {
    super('console');
    this._view = ConsoleView.instance();
  }

  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): ConsolePanel {
    const {forceNew} = opts;
    if (!consolePanelInstance || forceNew) {
      consolePanelInstance = new ConsolePanel();
    }

    return consolePanelInstance;
  }

  static _updateContextFlavor(): void {
    const consoleView = ConsolePanel.instance()._view;
    UI.Context.Context.instance().setFlavor(ConsoleView, consoleView.isShowing() ? consoleView : null);
  }

  wasShown(): void {
    super.wasShown();
    const wrapper = wrapperViewInstance;
    if (wrapper && wrapper.isShowing()) {
      UI.InspectorView.InspectorView.instance().setDrawerMinimized(true);
    }
    this._view.show(this.element);
    ConsolePanel._updateContextFlavor();
  }

  willHide(): void {
    super.willHide();
    // The minimized drawer has 0 height, and showing Console inside may set
    // Console's scrollTop to 0. Unminimize before calling show to avoid this.
    UI.InspectorView.InspectorView.instance().setDrawerMinimized(false);
    if (wrapperViewInstance) {
      wrapperViewInstance._showViewInWrapper();
    }
    ConsolePanel._updateContextFlavor();
  }

  searchableView(): UI.SearchableView.SearchableView|null {
    return ConsoleView.instance().searchableView();
  }
}

let wrapperViewInstance: WrapperView|null = null;

export class WrapperView extends UI.Widget.VBox {
  _view: ConsoleView;

  private constructor() {
    super();
    this.element.classList.add('console-view-wrapper');

    this._view = ConsoleView.instance();
  }

  static instance(): WrapperView {
    if (!wrapperViewInstance) {
      wrapperViewInstance = new WrapperView();
    }
    return wrapperViewInstance;
  }

  wasShown(): void {
    if (!ConsolePanel.instance().isShowing()) {
      this._showViewInWrapper();
    } else {
      UI.InspectorView.InspectorView.instance().setDrawerMinimized(true);
    }
    ConsolePanel._updateContextFlavor();
  }

  willHide(): void {
    UI.InspectorView.InspectorView.instance().setDrawerMinimized(false);
    ConsolePanel._updateContextFlavor();
  }

  _showViewInWrapper(): void {
    this._view.show(this.element);
  }
}

let consoleRevealerInstance: ConsoleRevealer;

export class ConsoleRevealer implements Common.Revealer.Revealer {
  static instance(opts: {
    forceNew: boolean|null,
  } = {forceNew: null}): ConsoleRevealer {
    const {forceNew} = opts;
    if (!consoleRevealerInstance || forceNew) {
      consoleRevealerInstance = new ConsoleRevealer();
    }

    return consoleRevealerInstance;
  }

  async reveal(_object: Object): Promise<void> {
    const consoleView = ConsoleView.instance();
    if (consoleView.isShowing()) {
      consoleView.focus();
      return;
    }
    await UI.ViewManager.ViewManager.instance().showView('console-view');
  }
}