export default function checkURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
