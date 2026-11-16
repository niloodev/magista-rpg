"use client";

import { useEffect, useState } from "react";

import { filePreviewUrl } from "./useFilePreview.utils";

/**
 * Small previews of image files (null while one is being read or cannot be decoded), in the same order.
 */
export function useFilePreviews(files: File[]): (string | null)[] {
  const [previews, setPreviews] = useState<{ files: File[]; urls: (string | null)[] }>({
    files: [],
    urls: [],
  });

  useEffect(() => {
    let active = true;
    void Promise.all(files.map(filePreviewUrl)).then((urls) => {
      if (active) setPreviews({ files, urls });
    });
    return () => {
      active = false;
    };
  }, [files]);

  return previews.files === files ? previews.urls : files.map(() => null);
}

/**
 * Small preview of one image file, or null without a file (or while it is read).
 */
export function useFilePreview(file: File | null): string | null {
  const [preview, setPreview] = useState<{ file: File; url: string | null } | null>(null);

  useEffect(() => {
    if (!file) return;
    let active = true;
    void filePreviewUrl(file).then((url) => {
      if (active) setPreview({ file, url });
    });
    return () => {
      active = false;
    };
  }, [file]);

  return file && preview?.file === file ? preview.url : null;
}
