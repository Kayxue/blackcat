export default function(total, part) {
  let size = 13;
  let line = "─";
  let slider = "🔵";
  
  if (part > total) {
    const bar = line.repeat(size + 1) + slider;
    const percentage = (part / total) * 100;
    return [bar, percentage];
  } else {
    const percentage = part / total;
    const progress = Math.round((size * percentage));
    const emptyProgress = size - progress;
    const progressText = line.repeat(progress).replace(/.$/, slider);
    const emptyProgressText = line.repeat(emptyProgress);
    const bar = progressText + emptyProgressText;
    const calculated = percentage * 100;
    return [bar, calculated];
  }
}
