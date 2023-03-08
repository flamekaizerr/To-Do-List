//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");

const _ = require("lodash");
const PORT = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect(process.env.MONGO_URI);
const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemsSchema);
const i1 = new Item({
  name: "Buy Food"
});
const i2 = new Item({
  name: "Cook Food"
});
const i3 = new Item({
  name: "Eat Food"
});
const defaultItem = [i1, i2, i3];
// Item.insertMany(defaultItem)
// .then(()=>{console.log("Default Items added to db successfully")})
// .catch((err)=>{console.log("Cant add, there was an error")});
// Item.deleteOne({_id: "64077738627bf355a8188419"})
// .then(()=>{console.log("Items deleted successfully")})
// .catch((err)=>{console.log("Cant delete, there was an error")});
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});
const List = mongoose.model("List", listSchema);

app.get("/:customListName",(req, res)=>{

  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName})
  .then((foundList)=>{
    if(!foundList){
    //create a new list
      const newList = new List({
        name: customListName,
        items:defaultItem
      });
      newList.save();
      res.redirect("/" + customListName);
    }else{
      //list already present
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch((err)=>{console.log(err)});


});
const day = date.getDate();
//GET request to HOME route
app.get("/", function(req, res) {


Item.find({})
.then((foundItems)=>{
  if(foundItems.length == 0){
    Item.insertMany(defaultItem)
    .then(()=>{console.log("Default Items added to db successfully")})
    .catch((err)=>{console.log("Cant add, there was an error")});

    res.redirect("/");
  }else{
    res.render("list", {listTitle: day, newListItems: foundItems});
  }
})
.catch((err)=>{
  console.log("Error here mate! Cant find!");
});
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === day){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName})
    .then((foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + foundList.name);
    })
    .catch((err)=>{
      console.log(err);
    });
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === day){
    Item.findByIdAndRemove(checkedItemId).then(()=>{console.log("successfully deleted")}).catch((err)=>{console.log("Can't delete")});
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
    .then(()=>{console.log("item added successfully")})
    .catch((err)=>{console.log(err)});
    res.redirect("/" + listName);
  }

});
app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(PORT, function() {
  console.log("Server started on port 3000");
});
