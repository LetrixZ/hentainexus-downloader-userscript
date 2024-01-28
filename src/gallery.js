import { getData } from "./data";
import { setDownloaded, startDownload } from "./download";
import { downloadIcon, spinnerIcon } from "./icons";

const setDownloadButtonState = (state) => {
  const downloadButton = document.querySelector("#download");

  if (state === "downloading") {
    downloadButton.querySelector(".icon").innerHTML = spinnerIcon;
    downloadButton.classList.add("disabled");
    downloadButton.querySelector(".button-label").innerHTML = `Downloading`;
  } else if (state === "ready") {
    downloadButton.querySelector(".icon").innerHTML = downloadIcon;
    downloadButton.querySelector(".button-label").innerHTML = `Download`;
    downloadButton.classList.remove("disabled");
  }
};

const setProgress = (progress, total) => {
  const downloadButton = document.querySelector("#download");
  downloadButton.querySelector(".button-label").innerHTML = `Downloading ${progress}/${total}`;
};

export const addButtons = () => {
  const downloadButton = document.querySelector(".level-left > .level-item").cloneNode(true);
  downloadButton.id = "download";
  downloadButton.querySelector(".button-label").innerHTML = "Download";
  downloadButton.querySelector(".icon").innerHTML = downloadIcon;
  downloadButton.setAttribute("state", "ready");
  downloadButton.querySelector("a").removeAttribute("href");
  downloadButton.addEventListener("click", async (ev) => {
    ev.preventDefault();

    try {
      setDownloadButtonState("downloading");
      const metadata = getData(document);
      await startDownload(metadata, setDownloadButtonState, setProgress);
      setDownloaded(metadata.id);
    } catch (e) {
      alert("Download failed. Try again.");
      throw e;
    }
  });

  document.querySelector(".level-left").insertBefore(downloadButton, document.querySelector(".level-left > .level-item:nth-of-type(2)"));
};
