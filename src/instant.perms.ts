// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react-native";

const rules = {
  profiles: {
    allow: {
      view: "true",
      create: "isOwner",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: { isOwner: "auth.id != null && auth.id == data.id" },
  },
  notes: {
    allow: {
      view: "isCreator",
      create: "auth.id != null",
      update: "isCreator",
      delete: "isCreator",
    },
    bind: { isCreator: "auth.id != null && auth.id == data.creatorId" },
  },
  transactions: {
    allow: {
      view: "isOwner",
      create: "auth.id != null",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: { isOwner: "auth.id != null && auth.id == data.userId" },
  },
} satisfies InstantRules;

export default rules;
