import { galleryGroups, totalEndings } from "../data/collection";

// 見た結末の記録。章ごとに並べ、まだ見ていないものは伏せる。
// 伏せ方は文字数だけ残す（どのくらいの長さの言葉があるのかは見せる）。
// 何があるかを全部見せると探す楽しみが消えるし、何も見せないと
// 残りがあること自体に気づかれないため。
export function EndingGallery({ seen }: { seen: string[] }) {
  const groups = galleryGroups();
  const total = totalEndings();

  return (
    <div className="gallery">
      <div className="gallery-head">
        結末の記録　<strong>{seen.length}</strong> / {total}
      </div>
      {groups.map((g) => (
        <div className="gallery-group" key={g.title}>
          <div className="gallery-chapter">{g.title}</div>
          <ul className="gallery-list">
            {g.endings.map((e) => {
              const found = seen.includes(e.id);
              return (
                <li key={e.id} className={found ? "found" : "hidden-ending"}>
                  {found ? e.title : "？".repeat(Math.min(e.title.length, 10))}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
