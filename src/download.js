import { ZipWriter } from "@zip.js/zip.js";
import pLimit from "p-limit";
import { createWriteStream } from "streamsaver";

const primeNumbers = [2, 3, 5, 7, 11, 13, 17];
const limit = pLimit(4);

const generateFilename = ({ title, artists, magazines }) => {
  let splits = [];

  if (artists.length === 1) {
    splits.push(`[${artists[0]}]`);
  } else if (artists.length === 2) {
    splits.push(`[${artists[0]} & ${artists[1]}]`);
  } else if (artists.length >= 3) {
    splits.push("[Various]");
  }

  splits.push(title);

  if (magazines.length === 1) {
    splits.push(`(${magazines[0]})`);
  }

  return splits.join(" ").replace("\u{FF0A}", "*").replace("\u{FF1F}", "?").replace("\u{2044}", "/").replace("\u{A792}", ":");
};

const base64ToBytes = (base64) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
};

export const decryptData = (base64) => {
  const data = base64ToBytes(base64);
  const keyStream = data.slice(0, 64).map((byte) => byte & 0xff);
  const ciphertext = data.slice(64).map((byte) => byte & 0xff);
  const digest = Array.from({ length: 256 }, (_, i) => i);

  let primeIdx = 0;

  for (let i = 0; i < 64; i++) {
    primeIdx = primeIdx ^ keyStream[i];

    for (let j = 0; j < 8; j++) {
      primeIdx = (primeIdx & 1) != 0 ? (primeIdx >>> 1) ^ 12 : primeIdx >>> 1;
    }
  }

  primeIdx = primeIdx & 7;

  let temp;
  let key = 0;

  for (let i = 0; i < 256; i++) {
    key = (key + digest[i] + keyStream[i % 64]) % 256;

    temp = digest[i];
    digest[i] = digest[key];
    digest[key] = temp;
  }

  const q = primeNumbers[primeIdx];
  let k = 0;
  let n = 0;
  let p = 0;
  let xorKey = 0;
  let result = "";
  for (let i = 0; i < ciphertext.length; i++) {
    k = (k + q) % 256;
    n = (p + digest[(n + digest[k]) % 256]) % 256;
    p = (p + k + digest[k]) % 256;

    temp = digest[k];
    digest[k] = digest[n];
    digest[n] = temp;

    xorKey = digest[(n + digest[(k + digest[(xorKey + p) % 256]) % 256]) % 256];
    result += String.fromCharCode(ciphertext[i] ^ xorKey);
  }

  return result;
};

const getImages = async (id) => {
  const res = await fetch(`/read/${id}`);
  const text = await res.text();
  const el = document.createElement("html");
  el.innerHTML = text;

  const data = Array.from(el.querySelectorAll("script"))
    .find((script) => script.innerHTML.includes("initReader"))
    .innerHTML.match(/(?<=initReader\(").*?(?=")/g);

  return JSON.parse(decryptData(data));
};

const fetchImage = async (image, writer) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.src = image.image;
      img.crossOrigin = "anonymous";
      img.addEventListener("load", () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        canvas.toBlob((blob) => {
          writer.add(image.url_label + ".png", blob.stream());
          resolve();
        });
      });
    } catch (e) {
      reject(e);
    }
  });
};

export const startDownload = async (metadata, setState, setProgress) => {
  try {
    const images = await getImages(metadata.id);

    let currentProgress = 0;
    setProgress?.(0, images.length);

    const fileStream = createWriteStream(`${generateFilename(metadata)}.cbz`);

    const zipFileStream = new TransformStream();
    const zipFileBlobPromise = new Response(zipFileStream.readable).blob();
    const zipWriter = new ZipWriter(zipFileStream.writable);

    const infoRedable = new Blob([JSON.stringify(metadata, null, 2)]).stream();

    zipWriter.add("info.json", infoRedable);

    await Promise.all(
      images.map((image) =>
        limit(() =>
          fetchImage(image, zipWriter).then(() => {
            currentProgress += 1;
            setProgress?.(currentProgress, images.length);
          })
        )
      )
    );

    await zipWriter.close();
    const zipFileBlob = await zipFileBlobPromise;
    await zipFileBlob.stream().pipeTo(fileStream);
  } catch (e) {
    throw e;
  } finally {
    setState("ready");
  }
};

export const getDownloaded = () => {
  return JSON.parse(localStorage.getItem("downloads") || "[]");
};

export const setDownloaded = (id) => {
  const downloads = JSON.parse(localStorage.getItem("downloads") || "[]");
  downloads.push(id);
  localStorage.setItem("downloads", JSON.stringify(downloads));
};
