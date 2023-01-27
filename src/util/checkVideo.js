export default function checkVideo(rawURL) {
  const domains = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "gaming.youtube.com",
  ]);

  const parsed = new URL(rawURL);
  const regex =
    /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;

  let urlID = parsed.searchParams.get("v");
  if (regex.test(rawURL) && !urlID) {
    const pathName = parsed.pathname.split("/");
    urlID = parsed.host === "youtu.be" ? pathName[1] : pathName[2];
  } else if (parsed.hostname && !domains.has(parsed.hostname)) {
    return false;
  }

  if (
    !urlID ||
    (parsed.searchParams.has("list") &&
      !parsed.searchParams.has("index") &&
      !parsed.searchParams.has("start_radio"))
  )
    return false;
  else return true;
}
