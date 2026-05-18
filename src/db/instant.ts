import { init, i } from '@instantdb/react-native';
import { INSTANTDB_APP_ID } from '@env';

const schema = i.schema({
  entities: {
    notes: i.entity({
      title: i.string(),
      content: i.string(),
      isUnlocked: i.boolean(),
      createdAt: i.number(),
      creatorId: i.string(),
    }),
  },
});

type AppSchema = typeof schema;
export const db = init<AppSchema>({ appId: INSTANTDB_APP_ID, schema });
