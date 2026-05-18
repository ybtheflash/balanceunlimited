import { init } from '@instantdb/react-native';
import { INSTANTDB_APP_ID } from '@env';

export const db = init({ appId: INSTANTDB_APP_ID });
