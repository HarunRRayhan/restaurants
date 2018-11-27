exports.myMiddleware = (req, res, next) => {
  req.name = "Rayhan";
  next();
};

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render("index");
};
