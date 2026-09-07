import { ChatScreen } from "./components/ChatScreen";
import { chapters } from "./data/chapters";

function App() {
  return (
    <div className="app-shell">
      {/* 章を足したときに直し忘れないよう、登録簿の数から出す */}
      <div className="app-title">人生（終盤）ゲーム ── 第1〜{chapters.length}章</div>
      <ChatScreen />
    </div>
  );
}

export default App;
