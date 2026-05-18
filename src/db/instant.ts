import { init, i } from '@instantdb/react-native';
import { INSTANTDB_APP_ID } from '@env';

const APP_ID = INSTANTDB_APP_ID;

const schema = i.schema({
  entities: {
    notes: i.entity({
      title: i.string(),
      content: i.string(),
      isUnlocked: i.boolean(),
      createdAt: i.number(),
      creatorId: i.string(),
    }),
    profiles: i.entity({
      id: i.string(),
      username: i.string(),
      displayName: i.string(),
      avatar: i.string(),
      tier: i.string(),
      totalSpent: i.number(),
      balance: i.number(),
      adsRemoved: i.boolean(),
      joinedDate: i.number(),
    }),
    transactions: i.entity({
      id: i.string(),
      userId: i.string(),
      type: i.string(),
      amount: i.number(),
      description: i.string(),
      timestamp: i.number(),
    }),
  },
});

type AppSchema = typeof schema;
export const db = init<AppSchema>({ appId: APP_ID, schema });
