// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* eslint-disable rulesdir/no_underscored_properties */

import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';

import * as Root from '../../core/root/root.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as Sources from '../../panels/sources/sources.js';

const UIStrings = {
  /**
  *@description Text that refers to the main target.
  */
  nevermore: 'Mission Control',
};

const str_ = i18n.i18n.registerUIStrings('entrypoints/nevermore_app/NevermoreMain.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);

let nevermoreMainImplInstance: NevermoreMainImpl;

export class NevermoreMainImpl extends Common.ObjectWrapper.ObjectWrapper implements Common.Runnable.Runnable {
  static instance(opts: {forceNew: boolean|null} = {forceNew: null}): NevermoreMainImpl {
    const {forceNew} = opts;
    if (!nevermoreMainImplInstance || forceNew) {
      nevermoreMainImplInstance = new NevermoreMainImpl();
    }

    return nevermoreMainImplInstance;
  }

  async run(): Promise<void> {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.ConnectToNodeJSDirectly);
    SDK.Connections.initMainConnection(async () => {
      const target = SDK.TargetManager.TargetManager.instance().createTarget(
          'main', i18nString(UIStrings.nevermore), SDK.Target.Type.Node, null);
      target.runtimeAgent().invoke_runIfWaitingForDebugger();
    }, Components.TargetDetachedDialog.TargetDetachedDialog.webSocketConnectionLost);
  }
}

let loadedSourcesModule: (typeof Sources|undefined);

async function loadHelpModule(): Promise<typeof Sources> {
  if (!loadedSourcesModule) {
    // Side-effect import resources in module.json
    await Root.Runtime.Runtime.instance().loadModulePromise('sources');
    loadedSourcesModule = await import('../../panels/sources/sources.js');
  }
  return loadedSourcesModule;
}

UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.NAVIGATOR_VIEW,
  id: 'navigator-network',
  title: i18nLazyString(UIStrings.nevermore),
  commandPrompt: i18nLazyString(UIStrings.nevermore),
  order: 2,
  persistence: UI.ViewManager.ViewPersistence.PERMANENT,
  async loadView() {
    const Sources = await loadHelpModule();
    return Sources.SourcesNavigator.NetworkNavigatorView.instance();
  },
});

Common.Runnable.registerEarlyInitializationRunnable(NevermoreMainImpl.instance);
