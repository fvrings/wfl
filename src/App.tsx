import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

type WifiList = Array<{ ssid: string; level: number }>;

function App() {
  const [wifis, setWifis] = useState<WifiList>([]);
  const [wifi, setWifi] = useState("");
  const [entering, setEntering] = useState(false);
  const [passwd, setPasswd] = useState("");

  async function fetchWifiNetworks() {
    try {
      const ssids: WifiList = await invoke("get_ssids", {});
      setWifis(ssids);
    } catch (error) {
      console.error("Failed to fetch Wi-Fi networks", error);
    }
  }

  async function connectToWifi(event: React.FormEvent) {
    event.preventDefault(); // Prevents form from refreshing the page
    if (!wifi || !passwd) return;

    try {
      await invoke("login", { wifi, passwd });
      setEntering(false);
      setPasswd("");
    } catch (error) {
      console.error("Failed to connect to Wi-Fi", error);
    }
  }

  return (
    <main className="container flex flex-col items-center p-6 mx-auto space-y-6">
      {/* Search Button */}
      <button
        onClick={fetchWifiNetworks}
        className="py-2 px-6 font-bold text-white bg-blue-500 rounded-lg shadow-lg transition-all hover:bg-blue-600"
      >
        🔍 Search Wi-Fi Networks
      </button>

      {/* Wi-Fi List */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-2xl sm:grid-cols-2 md:grid-cols-3">
        {wifis.map((w) => (
          <div
            key={w.ssid}
            className="p-4 text-center bg-gray-100 rounded-lg shadow transition-all cursor-pointer hover:bg-gray-200"
            onClick={() => {
              setWifi(w.ssid);
              setEntering(true);
            }}
          >
            📶 {w.ssid}
          </div>
        ))}
      </div>

      {/* Password Entry Form */}
      {entering && (
        <form
          onSubmit={connectToWifi}
          className="flex flex-col items-center p-6 space-y-4 bg-white rounded-lg shadow-lg"
        >
          <h2 className="text-lg font-bold text-gray-700">
            🔐 Connect to {wifi}
          </h2>
          <input
            type="password"
            placeholder="Enter password"
            value={passwd}
            onChange={(e) => setPasswd(e.target.value)}
            className="p-2 w-64 text-center rounded-lg border border-gray-300"
          />
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setEntering(false)}
              className="py-2 px-4 font-bold text-white bg-gray-400 rounded-lg transition-all hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 font-bold text-white bg-green-500 rounded-lg transition-all hover:bg-green-600"
            >
              ✅ Connect
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

export default App;
