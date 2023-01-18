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
        res.status(404).render("404", {
          listTitle: listName,
          textError: `List "${listName}" don't exist`,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const newListName = req.body.newList;

  List.findOne({ name: newListName }, async function (err, justList) {
    if (!err) {
      // list already exist
      if (justList) {
        List.find({}, function (errAll, allLists) {
          if (!errAll) {
        res.render("index", {
              listTitle: newListName,
              listItems: allLists,
          errorMessage: "This List already exitst",
  });
          }
        });
  } else {
        // create new list called newListName
        const list = new List({
          name: newListName,
          items: defaultItems,
        });
        await list.save();
        res.redirect("/" + newListName);
        }
      }
    });
});

app.post("/:listName", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  item.save();
  // find where save new Item
  List.findOne({ name: listName }, function (err, foundList) {
    if (err) {
      console.log(err);
    } else {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + foundList.name);
  }
  });
});

app.post("/delete/:listId/:itemId", function (req, res) {
  const checkedItemId = req.params.itemId;
  const currentList = req.params.listId;

    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Succesfully deleted id item " + checkedItemId);
      }
    });

    List.findOneAndUpdate(
      { name: currentList },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + currentList);
        }
      }
    );
});

app.post("/delete/:thisIdList", function (req, res) {
  const deleteListId = req.params.thisIdList;
  const namedeleteList = req.body.deleteButton;
  console.log(namedeleteList);
  List.findOneAndRemove({ _id: deleteListId }, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully delete this list " + namedeleteList);
      res.redirect("/");
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
