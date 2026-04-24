import { v4 as uuidv4 } from "uuid";

export function createId(prefix: string): string {
  return `${prefix}_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
}
