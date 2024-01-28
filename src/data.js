const getInfoElement = (name, document) => {
  const infoTable = Array.from(document.querySelectorAll(".view-page-details tr"));
  return infoTable.find((tr) => tr.querySelector("td").textContent.includes(name));
};

const getArrayText = (name, document) => {
  const infoElement = getInfoElement(name, document);

  if (!infoElement) {
    return;
  }

  return Array.from(infoElement.querySelectorAll("a")).map((a) => a.childNodes[0].textContent.trim());
};

export const getData = (document) => {
  const id = +document.querySelector("a[href^='/read/']").getAttribute("href").split("/").at(-1);
  const title = document.querySelector("h1.title").textContent;
  const description = getInfoElement("Description", document)?.querySelector("td:last-of-type")?.textContent?.trim();

  const artists = getArrayText("Artist", document);
  const circles = getArrayText("Circle", document);
  const magazines = getArrayText("Magazine", document);
  const parodies = getArrayText("Parody", document);
  const publishers = getArrayText("Publisher", document);

  const pages = +getInfoElement("Pages", document).querySelector("td:last-of-type").textContent.trim();
  const favorites = +getInfoElement("Favorites", document).querySelector("td:last-of-type").textContent.trim();
  const tags = Array.from(getInfoElement("Tags", document).querySelectorAll(".tag")).map((tag) => tag.textContent.trim().split("(")[0].trim());

  const metadata = {
    id,
    title,
    description,
    artists,
    circles,
    magazines,
    parodies,
    publishers,
    pages,
    favorites,
    tags,
  };

  console.log("Gallery metadata");
  console.log(metadata);

  return metadata;
};
