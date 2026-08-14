// Barrel re-export — kept so existing `import { X } from "@/types"` call sites
// across the app don't need to change. Add new domains as their own file here
// and re-export them below, rather than growing this back into one big file.
export * from "./user";
export * from "./startup";
export * from "./misc";
export * from "./job";
export * from "./contest";
export * from "./service";
export * from "./chat";
export * from "./admin";
export * from "./summaries";
export * from "./mentorSession";
export * from "./notification";
export * from "./subscription";
export * from "./payment";
export * from "./withdrawal";
export * from "./grievance";
export * from "./talentRoster";
export * from "./agencyClient";
