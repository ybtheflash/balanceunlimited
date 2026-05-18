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
      username: i.string(),
      displayName: i.string(),
      avatar: i.string(),
      tier: i.string(),
      totalSpent: i.number(),
      balance: i.number(),
      adsRemoved: i.boolean(),
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
