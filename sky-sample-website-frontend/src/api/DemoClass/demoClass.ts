import { z } from "zod";
import axios from "axios";
export const demoSchema = z.object({
  id: z.number(),
  demo1: z.string(),
  demo2: z.string(),
  demo3: z.string(),
  demo4: z.string(),
  demo5: z.string(),
  demo6: z.string(),
});

export type DemoClass = z.infer<typeof demoSchema>;
