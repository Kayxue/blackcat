export default function moveArray(original, oldIndex, newIndex) {
  let modified = original.slice(0);
  if (newIndex >= modified.length) {
    let k = newIndex - modified.length + 1;
    while (k--) {
      modified.push(undefined);
    }
  }
  modified.splice(newIndex, 0, modified.splice(oldIndex, 1)[0]);
  return modified;
}
