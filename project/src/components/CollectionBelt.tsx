import { ITEMS } from "../data/items";
import { useModal } from "../context/ModalContext";

function CardHTML({ item }: { item: (typeof ITEMS)[0] }) {
  const { openProfile } = useModal();
  const img = item.img || "";
  return (
    <div className="card" onClick={() => openProfile(item)}>
      <div className="thumb">{img && <img loading="lazy" alt="" src={img} />}</div>
      <div className="card-meta">
        <div className="meta-a">{item.designation}</div>
        <div className="meta-b">{item.name || "DL_ASSET"}</div>
        <div className="meta-c">{item.status}{item.threat ? ` · THREAT: ${item.threat}` : ""}</div>
      </div>
    </div>
  );
}

export default function CollectionBelt() {
  const sliceA = ITEMS.slice(0, Math.min(ITEMS.length, 10));
  const sliceB = ITEMS.slice(2, Math.min(ITEMS.length, 12));

  return (
    <div className="belt" aria-label="NFT belt">
      <div className="belt-row marquee-a">
        {sliceA.map(item => <CardHTML key={`a1-${item.id}`} item={item} />)}
        {sliceA.map(item => <CardHTML key={`a2-${item.id}`} item={item} />)}
      </div>
      <div className="belt-row marquee-b">
        {sliceB.map(item => <CardHTML key={`b1-${item.id}`} item={item} />)}
        {sliceB.map(item => <CardHTML key={`b2-${item.id}`} item={item} />)}
      </div>
    </div>
  );
}
