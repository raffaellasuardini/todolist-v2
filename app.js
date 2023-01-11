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
  // show all items
  Item.find({}, function (err, items) {
    if (err) {
      console.log(err);
    } else {
      // if items is empty insert default items
      if (items.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully insert items");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
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
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  // find where save new item
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    console.log(listName);
    List.findOne({ name: listName }, function (err, foundList) {
      if (err) {
        console.log(err);
      } else {
        if (foundList) {
          console.log(foundList);
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + foundList.name);
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
