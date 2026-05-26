import { fileTypeFromBuffer } from "file-type";

const base64Regex =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const emptyResult = {
  fileValid: false,
  fileMimeType: null,
  fileSizeKb: null,
};

const normalizeBase64 = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("base64,")) {
    return trimmed.split("base64,").pop().trim();
  }

  return trimmed;
};

export const parseBase64File = async (value) => {
  const base64 = normalizeBase64(value);

  if (!base64 || !base64Regex.test(base64)) {
    return { ...emptyResult };
  }

  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) {
    return { ...emptyResult };
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !detected.mime) {
    return { ...emptyResult };
  }

  return {
    fileValid: true,
    fileMimeType: detected.mime,
    fileSizeKb: Math.round(buffer.length / 1024).toString(),
  };
};
