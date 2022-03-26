export default function(http) {
  http.get("/", (_req, res) => {
    res.send("Hello World!");
  });
}