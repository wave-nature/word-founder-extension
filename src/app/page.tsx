import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import "./App.css";
import Card from "./components/Card";

function App() {
  const [url, setUrl] = useState("");
  const [word, setWord] = useState("");
  const [result, setResult] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [occurrence, setOccurrence] = useState(1);

  useEffect(() => {
    const getUrl = async () => {
      const tabs = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      const currentUrl = tabs[0].url;
      if (currentUrl?.includes("youtube") && currentUrl?.includes("watch")) {
        if (currentUrl.includes("&t=")) {
          const url = currentUrl.split("&t=")[0];
          setUrl(url);
        } else {
          setUrl(currentUrl);
        }
      }
    };
    getUrl();
  }, []);

  async function searchWord(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return toast.error("Youtube URL is required");
    if (!word) return toast.error("Word to search is required");

    try {
      toast.loading("Searching for the word in video");
      const res = await fetch("http://localhost:7000/video-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) return;
      const data = await res.json();
      console.log(data);
      toast.remove();
      const newResult = [];

      for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        const text = obj.text?.toLowerCase()?.trim();
        if (text.includes(word?.toLowerCase()?.trim())) {
          newResult.push(obj);
        }
      }

      setResult(newResult);
      if (newResult.length > 0) {
        setTotal(newResult.length);
        toast.success("Word found in video");
      } else {
        toast.error("Word not found in video");
      }
    } catch (error) {
      toast.error("Error in searching the word");
    }
  }

  const occurred = result?.[occurrence - 1];
  let timeStampMinutes = 0;
  let timestampSeconds = Math.ceil(occurred?.offset / 1000);
  if (timestampSeconds > 60) {
    timeStampMinutes = Math.floor(timestampSeconds / 60);
    timestampSeconds = timestampSeconds % 60;
  }

  return (
    <main className="main">
      <header className="logo-container">
        <div className="logo">Worvid</div>
      </header>

      <Card>
        <div className="search-box">
          <h4>Oh! you just remember a word</h4>
          <h4>Don't worry search where it exactly is in video!</h4>

          <form className="form" onSubmit={searchWord}>
            <div className="input-group">
              <label htmlFor="yt-url">Youtube URL:</label>
              <input
                id="yt-url"
                type="text"
                placeholder="Youtube URL"
                value={url}
                onChange={(e) => setUrl(e.target.value.trim())}
              />
            </div>
            <div className="input-group">
              <label htmlFor="search-word">Word:</label>
              <input
                id="search-word"
                type="text"
                placeholder="You know the text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
              />
            </div>

            <div className="btn-container">
              <button className="btn">Search</button>
            </div>
          </form>
        </div>
      </Card>

      {result && result.length > 0 && (
        <Card>
          <div className="search-result">
            <h4>
              "{word}" occurs <span>{result?.length} times</span> in this video
            </h4>

            <div className="search-result-container">
              <div className="occurrence">
                <h4>Occurrence</h4>
                <div className="occ-input">
                  <input type="number" value={occurrence} />
                  <div className="arrow-container">
                    <button
                      className="btn-up"
                      onClick={() => {
                        if (occurrence < total) setOccurrence(occurrence + 1);
                      }}
                    ></button>
                    <button
                      className="btn-down"
                      onClick={() => {
                        if (occurrence > 1) setOccurrence(occurrence - 1);
                      }}
                    ></button>
                  </div>
                </div>
              </div>

              <div className="timestamp">
                <h4>Timestamp</h4>
                <div>
                  {timeStampMinutes <= 0 ? "00" : timeStampMinutes}:
                  {timestampSeconds < 10
                    ? `0${timestampSeconds}`
                    : timestampSeconds}
                  s
                </div>
              </div>
            </div>

            <div className="go-to">
              Go to this timestamp or copy the url below
            </div>
          </div>

          <div className="copy-url">
            <div>{`${url}&t=${Math.ceil(
              (occurred?.offset || 0) / 1000
            )}s`}</div>
            <button
              id="copy-url"
              className="btn"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${url}&t=${Math.ceil((occurred?.offset || 0) / 1000)}s`
                );
                const copyBtn = document.getElementById("copy-url");
                if (copyBtn) copyBtn.innerText = "Copied!";
                toast.success("URL copied to clipboard");
                setTimeout(() => {
                  if (copyBtn) copyBtn.innerText = "Copy";
                }, 2000);
              }}
            >
              Copy
            </button>
          </div>
        </Card>
      )}
      <Toaster />
    </main>
  );
}
export default App;
