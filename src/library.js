import { getData } from "./data";
import { getDownloaded, setDownloaded, startDownload } from "./download";
import { downloadIcon, spinnerIcon, xMarkIcon } from "./icons";

export const setDownloadButtonState = (state, button) => {
  if (state === "downloading") {
    button.innerHTML = spinnerIcon;
    button.classList.add("disabled");
  } else if (state === "ready") {
    button.innerHTML = downloadIcon;
    button.classList.remove("disabled");
  } else if (state === "failed") {
    button.innerHTML = xMarkIcon;
    button.classList.remove("disabled");
  }
};

export const getGalleryData = async (id) => {
  const res = await fetch(`/view/${id}`);
  const text = await res.text();
  const el = document.createElement("html");
  el.innerHTML = text;

  return getData(el);
};

const addItemButtons = () => {
  const cards = Array.from(document.querySelectorAll(".column"));
  const downloadedGalleries = getDownloaded();

  cards.forEach((element) => {
    const id = +element.querySelector("a").getAttribute("href").replace("/view/", "");
    const title = element.querySelector(".card-header").getAttribute("title");
    const header = element.querySelector(".card-header");
    header.style.display = "flex";
    header.style.alignItems = "center";

    const downloadButton = document.createElement("button");
    downloadButton.id = `download-${id}`;
    downloadButton.title = `Download ${title}`;
    downloadButton.classList.add("button", "grey");

    if (downloadedGalleries.includes(id)) {
      downloadButton.classList.add("downloaded");
    }

    downloadButton.style.background = "none";
    downloadButton.style.border = "none";
    downloadButton.style.padding = "0.75rem";
    downloadButton.style.height = "100%";
    downloadButton.style.outline = "none";
    downloadButton.innerHTML = downloadIcon;
    downloadButton.setAttribute("state", "ready");
    downloadButton.addEventListener("click", async (ev) => {
      ev.preventDefault();

      try {
        setDownloadButtonState("downloading", downloadButton);
        const metadata = await getGalleryData(id);
        await startDownload(metadata, (state) => setDownloadButtonState(state, downloadButton));
        setDownloaded(id);
      } catch (e) {
        alert("Download failed. Try again.");
        throw e;
      }
    });

    header.appendChild(downloadButton);
  });
};

const addPageButton = () => {
  const button = document.createElement("button");
  button.classList.add("pagination-next", "button");
  button.style.background = "none";
  button.style.margin = "0";
  button.innerHTML = "Download all";
  button.addEventListener("click", async () => {
    const downloadedGalleries = getDownloaded();

    let cards = Array.from(document.querySelectorAll(".column"));

    const skipDownload = localStorage.getItem("skip_download");

    if (skipDownload === "true") {
      cards = cards.filter((card) => {
        const id = +card.querySelector("a").getAttribute("href").replace("/view/", "");
        return !downloadedGalleries.includes(id);
      });
    }

    const total = cards.length;
    let currentProgress = 0;

    button.innerHTML = `(0/${total}) Downloading`;
    button.classList.add("disabled");

    for (const card of cards) {
      const id = +card.querySelector("a").getAttribute("href").replace("/view/", "");
      const title = card.querySelector(".card-header").getAttribute("title");
      const downloadButton = document.querySelector(`#download-${id}`);

      try {
        setDownloadButtonState("downloading", downloadButton);
        const metadata = await getGalleryData(id);
        await startDownload(metadata, (state) => setDownloadButtonState(state, downloadButton));
        setDownloaded(id);
        currentProgress += 1;
      } catch (e) {
        alert(`Download failed for ${title}. Try again.`);
        setDownloadButtonState("failed", downloadButton);
        console.error(`Failed to download (${id}) '${title}'`, e);
      } finally {
        button.innerHTML = `(${currentProgress}/${total}) Downloading`;
      }
    }

    button.innerHTML = `Download all`;
    button.classList.remove("disabled");
  });

  const searchTitle = document.querySelector(".search-title");

  if (searchTitle) {
    const container = searchTitle.parentNode;
    container.style.display = "flex";
    container.style.justifyContent = "space-between";
    container.append(button);
  } else {
    button.style.marginLeft = "auto";

    const container = document.createElement("div");
    container.classList.add("container");
    container.style.display = "flex";
    container.style.marginBottom = "1.5rem";
    container.append(button);

    document.querySelector(".container").parentElement.insertBefore(container, document.querySelector(".container"));
  }
};

export const addButtons = () => {
  addItemButtons();
  addPageButton();
};
