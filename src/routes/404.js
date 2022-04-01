export default function (http) {
  http.use((req, res) => {
    res.status(404);

    res.format({
      html: function () {
        res.render("404", { url: req.url });
      },
      json: function () {
        res.json({ error: "Not found" });
      },
      default: function () {
        res.type("txt").send("Not found");
      },
    });
  });
}
