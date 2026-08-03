import axios from "axios";
import { z } from "zod";

export const userSettingsSchema = z.object({
  user_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: z.string(),
  two_factor_enabled: z.boolean(),
});

export type UserSettingsData = z.infer<typeof userSettingsSchema>;

export type UserSettingsPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  two_factor_enabled: boolean;
};

export async function getUserSettings(): Promise<UserSettingsData> {
  const res = await axios.get("/api/settings/user");
  return res.data.data;
}

export async function updateUserSettings(
  payload: UserSettingsPayload
): Promise<UserSettingsData> {
  const res = await axios.put("/api/settings/user", payload);
  return res.data.data;
}
