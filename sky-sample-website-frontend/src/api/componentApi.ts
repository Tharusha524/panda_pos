import { z } from "zod";
import axios from "axios";
import { userSchema } from "./userApi";
import { StorageFileSchema } from "../utils/StorageFiles.util";

export enum EnumButtons {
  DEMO_BUTTON_01 = "Demo 1",
  DEMO_BUTTON_02 = "Demo 2",
}
export const ComponentSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  date: z.date(),
  enumButton: z.nativeEnum(EnumButtons),
  files: z.array(z.union([z.instanceof(File), StorageFileSchema])).optional(),
});

export type Component = z.infer<typeof ComponentSchema>;



export const demoData = [
  {
    id: 1,
    name: "Demo A",
    created_at: null,
    updated_at: null,
  },
  {
    id: 2,
    name: "Demo B",
    created_at: null,
    updated_at: null,
  },
  {
    id: 3,
    name: "Demo C",
    created_at: null,
    updated_at: null,
  },
  {
    id: 4,
    name: "Demo D",
    created_at: null,
    updated_at: null,
  },
  {
    id: 5,
    name: "Demo E",
    created_at: null,
    updated_at: null,
  },
  {
    id: 6,
    name: "Demo F",
    created_at: null,
    updated_at: null,
  },
];
