import { init, i } from '@instantdb/react-native';

const APP_ID = process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || '';

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
      appUniqueId: i.string(),
      username: i.string(),
      displayName: i.string(),
      avatar: i.string(),
      tier: i.string(),
      totalSpent: i.number(),
      balance: i.number(),
      realMoneySpent: i.number(),
      kcPurchased: i.number(),
      utilitiesUsed: i.number(),
      adsRemoved: i.boolean(),
      totpEnabled: i.boolean(),
      totpSecret: i.string(),
      activeTheme: i.string(),
      liquidGlassUnlocked: i.boolean(),
      joinedDate: i.number(),
    }),
    transactions: i.entity({
      id: i.string(),
      chargeId: i.string(),
      userId: i.string(),
      type: i.string(),
      amount: i.number(),
      description: i.string(),
      timestamp: i.number(),
    }),
  },
});

export type Schema = {
  profiles: {
    id: string;
    appUniqueId: string;
    username: string;
    displayName: string;
    avatar: string;
    tier: string;
    totalSpent: number;
    balance: number;
    realMoneySpent: number;
    kcPurchased: number;
    utilitiesUsed: number;
    adsRemoved: boolean;
    totpEnabled: boolean;
    totpSecret: string;
    activeTheme?: string;
    liquidGlassUnlocked?: boolean;
    joinedDate: number;
  };
  transactions: {
    id: string;
    chargeId: string;
    userId: string;
    type: "topup" | "spend";
    amount: number;
    description: string;
    timestamp: number;
  };
};

type AppSchema = typeof schema;
export const db = init<AppSchema>({ appId: APP_ID, schema });
