import chalk from "chalk";

export default function getDateString() {
  let month =
    (new Date().getMonth() + 1).toString().length === 1
      ? `0${new Date().getMonth() + 1}`
      : new Date().getMonth() + 1;
  let date =
    new Date().getDate().toString().length === 1
      ? `0${new Date().getDate()}`
      : new Date().getDate();
  let hours =
    new Date().getHours().toString().length === 1
      ? `0${new Date().getHours()}`
      : new Date().getHours();
  let minutes =
    new Date().getMinutes().toString().length === 1
      ? `0${new Date().getMinutes()}`
      : new Date().getMinutes();
  let seconds =
    new Date().getSeconds().toString().length === 1
      ? `0${new Date().getSeconds()}`
      : new Date().getSeconds();

  return (
    chalk.dim(`${month}/${date}`) +
    " " +
    chalk.cyan(`${hours}:${minutes}:${seconds}`)
  );
}
