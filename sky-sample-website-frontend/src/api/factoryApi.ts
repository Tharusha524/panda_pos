import { z } from "zod";
import axios from "axios";

export const factorySchema = z.object({
  id: z.string(),
  factoryName: z.string(),
});

export type factorySchema = z.infer<typeof factorySchema>;

export async function fetchFactoryData() {
    const res = await axios.get("/api/factory");
    return res.data;
}