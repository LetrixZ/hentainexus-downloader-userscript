export const addSettings = () => {
  const container = document.querySelector(".container");

  const separator = document.createElement("hr");

  const title = document.createElement("h4");
  title.classList.add("title", "is-4");
  title.innerHTML = "Script settings";

  const column = document.createElement("div");
  column.classList.add("columns");
  column.innerHTML = `
  <div class="column is-one-third">
    <form id="script-form">
      <div class="field">
        <input type="checkbox" id="skip_download" name="skip_download" style="margin-right: 0.5rem" />
        <label for="skip_download">Skip downloaded galleries from batch downloads</label>
      </div>

      <div class="field">
        <div class="control">
          <button class="button is-primary">Submit</button>
        </div>
      </div>
    </form>
  </div>`;

  container.append(separator);
  container.append(title);
  container.append(column);

  const skipDownloadChecked = localStorage.getItem("skip_download");

  const skipDownloadCheckbox = document.querySelector("#skip_download");
  skipDownloadCheckbox.checked = skipDownloadChecked === "true" ? "on" : "";

  document.querySelector("#script-form").addEventListener("submit", (ev) => {
    ev.preventDefault();

    const formData = new FormData(ev.target);
    const formProps = Object.fromEntries(formData);

    localStorage.setItem("skip_download", formProps["skip_download"] ? true : false);

    location.reload();
  });
};
