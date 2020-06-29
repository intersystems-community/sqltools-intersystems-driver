import { ILanguageServerPlugin } from '@sqltools/types';
import IRISDriver from './driver';
import { DRIVER_ALIASES } from './../constants';

const InterSystemsPlugin: ILanguageServerPlugin = {
  register(server) {
    DRIVER_ALIASES.forEach(({ value }) => {
      server.getContext().drivers.set(value, IRISDriver as any);
    });
  }
}

export default InterSystemsPlugin;
