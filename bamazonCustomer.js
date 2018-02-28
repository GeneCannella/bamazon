console.log("bamazon")
var mysql = require("mysql");
var inquirer = require("inquirer");

// create the connection information for the sql database
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "#noobAt54MSQL",
    database: "bamazon"
});

// connect to the mysql server and sql database

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    //displayAll();
    //placeOrder();
    //connection.end();
});

displayAll();



//*********************************************

//function to display all items in db
function displayAll() {
    console.log("running displayAll");

    connection.query("SELECT * FROM products", function(err, results) {

        console.log("********************************************************");
        console.log("Displaying all items:");
        console.log("********************************************************");
        for (var i = 0; i < results.length; i++) {
            console.log("item_id:", results[i].item_id);
            console.log("product_name:", results[i].product_name);
            console.log("department_name:", results[i].department_name);
            console.log("price:", results[i].price);
            console.log("stock_quantity:", results[i].stock_quantity);
            console.log("********************************************************");
        } //closes the for loop
        placeOrder(results);
    }); //closes the query and its callback
}; //closes the displayAll function

// function which prompts the user for what action they should take
function placeOrder(resultsArray) {
    inquirer
        .prompt(
            [{
                    name: "chosenItem",
                    type: "input",
                    message: "Please enter the item_id of the item you would like to buy:"
                },
                {
                    name: "howMany",
                    type: "input",
                    message: "How many of the item would you like to purchase?"
                }
            ]
        )
        .then(function(answer) {
            console.log("Purchasing item:", answer.chosenItem);
            console.log("Purchasing QTY:", answer.howMany);

            var chosenItemObject;
            for (var i = 0; i < resultsArray.length; i++) {
                if (resultsArray[i].item_id == answer.chosenItem) { //item_id is an int, chosenItem is a string
                    chosenItemObject = resultsArray[i];
                }
            }
            console.log(chosenItemObject);

            //check to see if store has sufficient qty of chosenItemObject
            if (chosenItemObject.stock_quantity < answer.howMany) {
                console.log("Insufficient quantity! Your order cannot be placed.");
            } else {
                console.log("Sufficient quantity in stock!");

                //need code here to update the db for the entry for chodenItemObject

                var newStockQTY = chosenItemObject.stock_quantity - answer.howMany;

                connection.query(
                    "UPDATE products SET ? WHERE ?", [{
                            stock_quantity: newStockQTY
                        },
                        {
                            item_id: parseInt(answer.chosenItem)
                        }
                    ],
                    function(err, results) {

                        console.log("newStockQTY =", newStockQTY);
                        console.log("Your total purchase: $", chosenItemObject.price * answer.howMany);
                        console.log(parseInt(answer.chosenItem));

                        displayAll();
                        //console.log(queryStr);
                    });


            }





        }); //closing the then promise and its callback
} //closing the placeOrder function

// function to handle posting new items up for auction
function postAuction() {
    // prompt for info about the item being put up for auction
    inquirer
        .prompt([{
                name: "item",
                type: "input",
                message: "What is the item you would like to submit?"
            },
            {
                name: "category",
                type: "input",
                message: "What category would you like to place your auction in?"
            },
            {
                name: "startingBid",
                type: "input",
                message: "What would you like your starting bid to be?",
                validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            }
        ])
        .then(function(answer) {
            // when finished prompting, insert a new item into the db with that info
            connection.query(
                "INSERT INTO auctions SET ?", {
                    item_name: answer.item,
                    category: answer.category,
                    starting_bid: answer.startingBid,
                    highest_bid: answer.startingBid
                },
                function(err) {
                    if (err) throw err;
                    console.log("Your auction was created successfully!");
                    // re-prompt the user for if they want to bid or post
                    start();
                }
            );
        });
}

function bidAuction() {
    // query the database for all items being auctioned
    connection.query("SELECT * FROM auctions", function(err, results) {
        if (err) throw err;
        // once you have the items, prompt the user for which they'd like to bid on
        inquirer
            .prompt([{
                    name: "choice",
                    type: "rawlist",
                    choices: function() {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].item_name);
                        }
                        return choiceArray;
                    },
                    message: "What auction would you like to place a bid in?"
                },
                {
                    name: "bid",
                    type: "input",
                    message: "How much would you like to bid?"
                }
            ])
            .then(function(answer) {
                // get the information of the chosen item
                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].item_name === answer.choice) {
                        chosenItem = results[i];
                    }
                }

                // determine if bid was high enough
                if (chosenItem.highest_bid < parseInt(answer.bid)) {
                    // bid was high enough, so update db, let the user know, and start over
                    connection.query(
                        "UPDATE auctions SET ? WHERE ?", [{
                                highest_bid: answer.bid
                            },
                            {
                                id: chosenItem.id
                            }
                        ],
                        function(error) {
                            if (error) throw err;
                            console.log("Bid placed successfully!");
                            start();
                        }
                    );
                } else {
                    // bid wasn't high enough, so apologize and start over
                    console.log("Your bid was too low. Try again...");
                    start();
                }
            });
    });
}