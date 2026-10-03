import { SITE } from "../../lib/site";
import { Icon } from "../Icon";

const ITEMS = [
  "COA published for every lot",
  "7x tested, every product",
  "Lyophilized & sealed for stability",
  "2–3 day shipping",
  `Free shipping on orders $${SITE.freeShippingThreshold}+`,
  "For laboratory research use only",
];

/** Sitewide scrolling announcement bar. The list is doubled so the loop is seamless. */
export function Announcement() {
  return (
    <div className="announce" role="region" aria-label="Store highlights">
      <p className="sr-only">{ITEMS.join(" · ")}</p>
      <div className="announce-track" aria-hidden="true">
        {[...ITEMS, ...ITEMS].map((t, i) => (
          <span className="announce-item" key={i}><Icon name="check" strokeWidth={2.6} />{t}</span>
        ))}
      </div>
    </div>
  );
}
