require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO);

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const cook = new Item({
  name: "Cook fantastic dishes",
});

const makeBed = new Item({
  name: "Don't remember to make your bed",
});

const eat = new Item({
  name: "Don't forget to eat properly",
});

const defaultItems = [cook, makeBed, eat];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  List.find({}, function (err, allLists) {
    if (!err) {
      if (allLists.length === 0) {
        res.render("index", { listItems: ["There's no list yet"] });
    } else {
        res.render("index", { listItems: allLists });
      }
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (err) {
      console.log(err);
    } else {
      if (foundList) {
        // show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      } else {
        // create an new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
    }
  });
});

app.post("/", function (req, res) {
  const newListName = req.body.newList;

  List.findOne({ name: newListName }, function (err, justList) {
    if (!err) {
      // list already exist
      if (justList) {
        res.render("index", {
          listItems: newListName,
          errorMessage: "This List already exitst",
  });
  } else {
        // create new list called newListName
        const list = new List({
          name: _.capitalize(newListName),
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + _.capitalize(newListName));
        }
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const currentList = req.body.listName;

  if (currentList === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted id item " + checkedItemId);
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: currentList },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + currentList);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
