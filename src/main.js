import * as Gallery from "./gallery";
import * as Library from "./library";
import * as Settings from "./settings";
import "./styles.css";

if (location.pathname == "/" || location.pathname.startsWith("/page") || location.pathname.startsWith("/favorites")) {
  Library.addButtons();
} else if (location.pathname.startsWith("/view/")) {
  Gallery.addButtons();
} else if (location.pathname.startsWith("/settings")) {
  Settings.addSettings();
}
