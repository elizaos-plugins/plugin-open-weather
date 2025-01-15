import { Action, Plugin } from '@elizaos/core';

declare const getCurrentWeatherAction: Action;

declare const index_getCurrentWeatherAction: typeof getCurrentWeatherAction;
declare namespace index {
  export { index_getCurrentWeatherAction as getCurrentWeatherAction };
}

declare const openWeatherPlugin: Plugin;

export { index as actions, openWeatherPlugin as default, openWeatherPlugin };
