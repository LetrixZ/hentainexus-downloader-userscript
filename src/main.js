import { createWriteStream } from "streamsaver";
import ZIP from "./zip-stream";
import "./styles.css";

const primeNumbers = [2, 3, 5, 7, 11, 13, 17];

const downloadIcon = `<svg class="svg-inline--fa" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path fill="currentColor" d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>`;
const spinnerIcon = `<svg aria-hidden="true" class="svg-inline--fa animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#2B3E50"/></svg>`;

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

const getImages = async () => {
  const url = document.querySelector("a[href^='/read/'");
  const res = await fetch(url);
  const text = await res.text();
  const el = document.createElement("html");
  el.innerHTML = text;

  const data = Array.from(el.querySelectorAll("script"))
    .find((script) => script.innerHTML.includes("initReader"))
    .innerHTML.match(/(?<=initReader\(").*?(?=")/g);

  return JSON.parse(decryptData(data));
};

const getInfoElement = (name) => {
  const infoTable = Array.from(document.querySelectorAll(".view-page-details tr"));
  return infoTable.find((tr) => tr.querySelector("td").textContent.includes(name));
};

const getArrayText = (name) => {
  const infoElement = getInfoElement(name);

  if (!infoElement) {
    return;
  }

  return Array.from(infoElement.querySelectorAll("a")).map((a) => a.childNodes[0].textContent.trim());
};

const getData = () => {
  const id = +document.querySelector("a[href^='/read/']").getAttribute("href").split("/").at(-1);
  const title = document.querySelector("h1.title").textContent;

  const artists = getArrayText("Artist");
  const magazines = getArrayText("Magazine");
  const parodies = getArrayText("Parody");
  const publishers = getArrayText("Publisher");

  const pages = +getInfoElement("Pages").querySelector("td:last-of-type").textContent.trim();
  const favorites = +getInfoElement("Favorites").querySelector("td:last-of-type").textContent.trim();
  const tags = Array.from(getInfoElement("Tags").querySelectorAll(".tag")).map((tag) => tag.textContent.trim().split("(")[0].trim());

  return {
    id,
    title,
    artists,
    magazines,
    parodies,
    publishers,
    pages,
    favorites,
    tags,
  };
};

const toggleDownloadButton = () => {
  const downloadButton = document.querySelector("#download");

  const state = downloadButton.getAttribute("state");

  if (state === "downloading") {
    downloadButton.querySelector(".icon").innerHTML = downloadIcon;
    downloadButton.setAttribute("state", "ready");
    downloadButton.classList.remove("disabled");
    downloadButton.querySelector(".button-label").innerHTML = `Download`;
  } else if (state === "ready") {
    downloadButton.querySelector(".icon").innerHTML = spinnerIcon;
    downloadButton.setAttribute("state", "downloading");
    downloadButton.classList.add("disabled");
  }
};

const setProgress = (progress, total) => {
  const downloadButton = document.querySelector("#download");
  downloadButton.querySelector(".button-label").innerHTML = `Downloading ${progress}/${total}`;
};

const generateArchive = async (metadata, images) => {
  const infoFile = new File([JSON.stringify(getData(), null, 2)], "info.json");
  const imageFiles = images.map((image) => [`${image.url_label}.png`, image.image]).values();

  const fileStream = createWriteStream(`${generateFilename(metadata)}.cbz`);

  let currentImage = 0;

  await new ZIP({
    start(ctrl) {
      ctrl.enqueue(infoFile);
    },
    pull(ctrl) {
      const it = imageFiles.next();
      if (it.done) {
        ctrl.close();
      } else {
        const [name, url] = it.value;

        setProgress(currentImage, images.length);
        currentImage += 1;

        return fetch(url).then((res) => {
          ctrl.enqueue({
            name,
            stream: () => res.body,
          });
        });
      }
    },
  }).pipeTo(fileStream);
};

const downloadGallery = async () => {
  try {
    toggleDownloadButton();

    const metadata = getData();
    const images = await getImages();

    await generateArchive(metadata, images);
  } catch (e) {
    alert("Download failed");
    throw e;
  } finally {
    toggleDownloadButton();
  }
};

const downloadButton = document.querySelector(".level-left > .level-item").cloneNode(true);
downloadButton.id = "download";
downloadButton.querySelector(".button-label").innerHTML = "Download";
downloadButton.querySelector(".icon").innerHTML = downloadIcon;
downloadButton.setAttribute("state", "ready");
downloadButton.querySelector("a").removeAttribute("href");
downloadButton.addEventListener("click", () => downloadGallery());

document.querySelector(".level-left").insertBefore(downloadButton, document.querySelector(".level-left > .level-item:nth-of-type(2)"));
