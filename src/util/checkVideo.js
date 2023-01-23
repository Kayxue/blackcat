export default function checkVideo(rawURL) {
  let domains = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "gaming.youtube.com",
  ]);

  let parsed = new URL(rawURL);
  let regex =
    /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;

  let urlID = parsed.searchParams.get("v");
  if (regex.test(rawURL) && !urlID) {
    let pathName = parsed.pathname.split("/");
    urlID = parsed.host === "youtu.be" ? pathName[1] : pathName[2];
  } else if (parsed.hostname && !domains.has(parsed.hostname)) {
    return false;
  }

  if (
    !urlID ||
    (parsed.searchParams.has("list") &&
      !parsed.searchParams.has("index"))
  )
    return false;
  else return true;
}
