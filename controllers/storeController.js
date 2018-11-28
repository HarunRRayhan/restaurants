const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That file type is not allowed" }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we written photo to our filesystem, keep going.
  next();
};

exports.createStore = async (req, res) => {
  // prettier-ignore
  const store = await (new Store(req.body)).save();
  req.flash(
    "success",
    `Successfully create ${store.name}!. Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // 1. Query the database for all stores
  const allStores = await Store.find();
  res.render("stores", { title: "Stores", stores: allStores });
};

exports.editStore = async (req, res) => {
  // 1. Find The store by given ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  // TODO
  // 3. Render the edit form
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // 1. Set location data to be a point
  req.body.location.type = "Point";
  // 2. Find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true
  }).exec();
  // 3. Redirect them to the store and show flash message
  req.flash(
    "success",
    `Successfully Updated <strong>${store.name}</strong>. <a href="/store/${
      store.slug
    }">View Store -></a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};
