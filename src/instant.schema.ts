// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react-native";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $streams: i.entity({
      abortReason: i.string().optional(),
      clientId: i.string().unique().indexed(),
      done: i.boolean().optional(),
      size: i.number().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    profiles: i.entity({
      appUniqueId: i.string().unique().indexed().optional(),
      username: i.string().unique().indexed(),
      displayName: i.string(),
      avatar: i.string(),
      tier: i.string(),
      totalSpent: i.number(),
      balance: i.number(),
      realMoneySpent: i.number().optional(),
      kcPurchased: i.number().optional(),
      utilitiesUsed: i.number().optional(),
      adsRemoved: i.boolean(),
      totpEnabled: i.boolean().optional(),
      totpSecret: i.string().optional(),
      joinedDate: i.number(),
    }),
    notes: i.entity({
      title: i.string(),
      content: i.string(),
      isUnlocked: i.boolean(),
      createdAt: i.number(),
      creatorId: i.string(),
    }),
    transactions: i.entity({
      chargeId: i.string(),
      userId: i.string(),
      type: i.string(),
      amount: i.number(),
      description: i.string(),
      timestamp: i.number(),
    }),
  },
  links: {
    profileNotes: {
      forward: {
        on: "profiles",
        has: "many",
        label: "notes",
      },
      reverse: {
        on: "notes",
        has: "one",
        label: "profile",
      },
    },
    $streams$files: {
      forward: {
        on: "$streams",
        has: "many",
        label: "$files",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "$stream",
        onDelete: "cascade",
      },
    },
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
  },
  rooms: {},
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
