import { getData } from "./data";
import { startDownload } from "./download";
import { downloadIcon, spinnerIcon } from "./icons";

const setDownloadButtonState = (state, button) => {
  if (state === "downloading") {
    button.innerHTML = spinnerIcon;
    button.classList.add("disabled");
  } else if (state === "ready") {
    button.innerHTML = downloadIcon;
    button.classList.remove("disabled");
  }
};

const getGalleryData = async (id) => {
  const res = await fetch(`/view/${id}`);
  const text = await res.text();
  const el = document.createElement("html");
  el.innerHTML = text;

  return getData(el);
};

export const addButtons = () => {
  const cards = Array.from(document.querySelectorAll(".column"));

  cards.forEach((element) => {
    const id = +element.querySelector("a").getAttribute("href").replace("/view/", "");
    const header = element.querySelector(".card-header");
    header.style.display = "flex";
    header.style.alignItems = "center";

    const downloadButton = document.createElement("button");
    downloadButton.id = `download-${id}`;
    downloadButton.classList.add("button");
    downloadButton.style.background = "none";
    downloadButton.style.border = "none";
    downloadButton.style.outline = "none";
    downloadButton.innerHTML = downloadIcon;
    downloadButton.setAttribute("state", "ready");
    downloadButton.addEventListener("click", async (ev) => {
      ev.preventDefault();

      try {
        setDownloadButtonState("downloading", downloadButton);
        const metadata = await getGalleryData(id);
        startDownload(metadata, (state) => {
          setDownloadButtonState(state, downloadButton);
        });
      } catch (e) {
        alert("Download failed. Try again.");
        throw e;
      }
    });

    header.appendChild(downloadButton);
  });
};
