const mongoose = require("mongoose");
const Store = mongoose.model("Store");

exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
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
  // 1. Find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true,
    runValidators: true
  }).exec();
  // 2. Redirect them to the store and show flash message
  req.flash(
    "success",
    `Successfully Updated <strong>${store.name}</strong>. <a href="/store/${
      store.slug
    }">View Store -></a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
};
