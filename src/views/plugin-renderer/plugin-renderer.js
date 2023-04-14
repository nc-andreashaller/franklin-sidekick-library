/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { LitElement, html, css } from 'lit';
import { createRef, ref } from 'lit/directives/ref.js';
import { createTag } from '../../utils/dom.js';
import { EventBus } from '../../events/eventbus.js';
import {
  DISPLAY_LOADER,
  HIDE_LOADER,
  PLUGIN_LOADED, PLUGIN_UNLOADED, SEARCH_UPDATED, TOAST,
} from '../../events/events.js';
import AppModel from '../../models/app-model.js';

export class PluginRenderer extends LitElement {
  progressContainer = createRef();

  static styles = css`
    sp-sidenav {
      width: 100%;
    }

    .progress-container {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      top: 0;
      align-items: center;
      justify-content: center;
      display: none;
    }

    .progress-container.visible {
      display: flex;
    }

    .plugin-root {
      height: 100%;
      overflow-y: auto;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    EventBus.instance.addEventListener(PLUGIN_LOADED, () => {
      const root = createTag('div', { class: 'plugin-root', 'data-testid': 'plugin-root' });
      this.renderRoot.prepend(root);

      this.loadPluginStylesheet();

      root.addEventListener(DISPLAY_LOADER, this.displayLoader.bind(this));

      AppModel.appStore.activePlugin.decorate(root, AppModel.appStore.pluginData);

      root.addEventListener(TOAST, this.sendToast);
      root.addEventListener(HIDE_LOADER, this.hideLoader.bind(this));
    });

    EventBus.instance.addEventListener(PLUGIN_UNLOADED, () => {
      const root = this.renderRoot.querySelector('.plugin-root');
      if (root) {
        root.remove();
      }
    });

    EventBus.instance.addEventListener(SEARCH_UPDATED, () => {
      const root = this.renderRoot.querySelector('.plugin-root');
      if (root) {
        root.innerHTML = '';
        AppModel.appStore.activePlugin.decorate(
          root,
          AppModel.appStore.pluginData,
          AppModel.appStore.searchQuery,
        );
      }
    });
  }

  loadPluginStylesheet() {
    const styleSheet = document.createElement('link');
    styleSheet.setAttribute('rel', 'stylesheet');

    const href = AppModel.appStore.activePluginPath.replace('.js', '.css');
    styleSheet.setAttribute('href', href);
    this.renderRoot.prepend(styleSheet);
  }

  displayLoader() {
    this.progressContainer.value?.classList.add('visible');
  }

  hideLoader() {
    this.progressContainer.value?.classList.remove('visible');
  }

  sendToast(event) {
    EventBus.instance.dispatchEvent(new CustomEvent(TOAST, { detail: event.detail }));
  }

  render() {
    return html`
      <div class="progress-container" ${ref(this.progressContainer)}>
        <sp-progress-circle indeterminate label="loading plugin"></sp-progress-circle>
      </div>
    `;
  }
}

customElements.define('plugin-renderer', PluginRenderer);
