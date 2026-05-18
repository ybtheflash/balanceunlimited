import { init } from '@instantdb/react-native';

const APP_ID = '58f51910-2355-4114-8d43-f9076fd4a2d1';

export type Schema = {
  profiles: {
    id: string; // The user id from auth
    username: string;
    displayName: string;
    avatar: string;
    tier: string;
    totalSpent: number;
    balance: number;
    adsRemoved: boolean;
    joinedDate: number;
  };
  transactions: {
    id: string;
    userId: string;
    type: "topup" | "spend";
    amount: number;
    description: string;
    timestamp: number;
  };
};

export const db = init({ appId: '58f51910-2355-4114-8d43-f9076fd4a2d1' });
