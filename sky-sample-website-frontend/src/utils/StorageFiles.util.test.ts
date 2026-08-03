import { getStorageFileTypeFromName, StorageFileSchema } from "./StorageFiles.util";

describe("StorageFiles.util", () => {
  test("StorageFileSchema validates shape", () => {
    const parsed = StorageFileSchema.parse({
      gsutil_uri: "gs://b/o",
      imageUrl: "https://img",
      fileName: "a.jpg",
    });
    expect(parsed.fileName).toBe("a.jpg");
  });

  test("getStorageFileTypeFromName", () => {
    expect(getStorageFileTypeFromName("photo.jpg")).toBe("image");
    expect(getStorageFileTypeFromName("doc.pdf")).toBe("pdf");
    expect(getStorageFileTypeFromName("readme")).toBeNull();
    expect(getStorageFileTypeFromName("file.")).toBeNull();
    expect(getStorageFileTypeFromName("file.txt")).toBeNull();
  });
});
