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
  req.body.author = req.user._id;
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

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error("You must need to be owner to edit this store");
  }
};

exports.editStore = async (req, res) => {
  // 1. Find The store by given ID
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  confirmOwner(store, req.user);
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

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate(
    "author"
  );
  if (!store) return next();
  res.render("store", { store, title: store.name });
};

exports.getStoresByTags = async (req, res, next) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };

  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

  res.render("tag", { tags, title: "Tags", tag, stores });
};

exports.searchStore = async (req, res) => {
  const stores = await Store
    // First Find the match
    .find(
      {
        $text: {
          $search: req.query.q
        }
      },
      {
        score: {
          $meta: "textScore"
        }
      }
    )
    // Sort them into scroe
    .sort({
      score: {
        $meta: "textScore"
      }
    })
    // Limit result to 5
    .limit(5);
  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const stores = await Store.find(q)
    .select("slug name description location photo")
    .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render("map", { title: "Map" });
};
