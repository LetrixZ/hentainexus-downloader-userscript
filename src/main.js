import * as Gallery from "./gallery";
import * as Library from "./library";
import "./styles.css";

if (location.pathname == "/" || location.pathname.startsWith("/page")) {
  Library.addButtons();
} else if (location.pathname.startsWith("/view/")) {
  Gallery.addButtons();
}
