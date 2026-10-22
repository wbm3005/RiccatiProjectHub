import wordmark from "../assets/brand/riccati-wordmark.png";
import fullLogo from "../assets/brand/riccati-full.png";

/** Original supplied artwork. CSS frames excess canvas without modifying the asset. */
export default function RiccatiLogo({ full = false }) {
 return <span className={"rp-official-logo" + (full ? " rp-official-logo-full" : "")}>
  <img src={full ? fullLogo : wordmark} alt={full ? "Riccati · Ingenieros y Arquitectos" : "Riccati"} width={full ? 447 : 192} height={full ? 447 : 192} draggable="false" />
 </span>;
}
