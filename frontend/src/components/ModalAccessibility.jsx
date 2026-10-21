import { useEffect } from "react";

// Portal dialogs share keyboard behavior without changing their business actions.
export default function ModalAccessibility() {
 useEffect(() => {
  let current = null; let previousOverflow; const origins = new Map();
  const shell = document.querySelector(".rp-shell");
  const controls = () => current ? [...current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter(e => e.getClientRects().length) : [];
  function sync() {
   const dialogs = [...document.querySelectorAll(".riccati-modal-backdrop .riccati-modal")];
   const next = dialogs.at(-1) || null;
   if (next === current) return;
   if (current && !current.isConnected) { shell?.removeAttribute("inert"); origins.get(current)?.focus(); origins.delete(current); }
   if (next) {
    origins.set(next, document.activeElement);
    next.setAttribute("role", "dialog"); next.setAttribute("aria-modal", "true");
    if (!next.hasAttribute("aria-label") && !next.hasAttribute("aria-labelledby")) next.setAttribute("aria-label", next.querySelector("h3")?.textContent.trim() || "Detalles");
    if (!current) { previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    shell?.setAttribute("inert", "");
    current = next; (controls()[0] || next).focus();
   } else {
    shell?.removeAttribute("inert"); document.body.style.overflow = previousOverflow || "";
    current = null;
   }
  }
  function keydown(e) {
   if (!current) return;
   if (e.key === "Escape") {
    const close = [...current.querySelectorAll("button:not([disabled])")].find(b => /^(cerrar|cancelar)$/i.test(b.getAttribute("aria-label") || b.textContent.trim()));
    if (close) {e.preventDefault(); close.click();}
   }
   if (e.key === "Tab") {
    const items=controls(), first=items[0],last=items.at(-1);
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
   }
  }
  const observer = new MutationObserver(sync); observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener("keydown",keydown); sync();
  return () => { observer.disconnect(); document.removeEventListener("keydown",keydown); shell?.removeAttribute("inert"); if(current)document.body.style.overflow=previousOverflow || ""; };
 }, []);
 return null;
}
