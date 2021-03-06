var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");
var cookieSession = require('cookie-session');
var app = express();
var mysql = require("mysql");
var giberrish = require("gibberish-aes/dist/gibberish-aes-1.0.0.js");
var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DB || "asp2",
    charset: "utf8mb4"
});
console.log(connection);
//essentials
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", express.static("./"));
app.use("/", express.static("./node_modules"));
app.use("/", express.static("./simple-scrollbar-master"));
app.use("/scrollbar", express.static("./malihu-custom-scrollbar-plugin-master"));
app.use(cookieSession({ secret: 'tobo!', cookie: { maxAge: 60 * 60 * 1000 } }));
//routers
var chatRouter = express.Router();
var loginRouter = express.Router();
var adminRouter = express.Router();
var feedbackRouter = express.Router();
var rantRouter = express.Router();
app.use("/counsel", chatRouter);
app.use("/login", loginRouter);
app.use("/admin", adminRouter);
app.use("/feedback", feedbackRouter);
app.use("/rant", rantRouter);
chatRouter.get("/", function(req, res) {
    var chatId = req.query.chatid || req.session.chatId;
    if (!(req.session.chatId || req.query.chatid)) {
        var password = "";
        connection.query("INSERT INTO chat_info SET password = ?", [password], function(err, res1) {
            if (err) {
                console.log("AN ERROR OCCURED " + err.stack);
                res.sendfile("./error.html")
            } else {
                req.session.chatId = res1.insertId;
                console.log(res1.insertId);
                res.sendfile("./chat.html");
            }
        });
    } else {
        req.session.chatId = chatId;
        res.sendfile("./chat.html")
    }
});
chatRouter.get("/getChatId", function(req, res){
    var chatId = req.session.chatId || "";
    var data = {
        err:1,
        res: chatId
    };
    res.json(data);

});


chatRouter.post("/sendMessage", function(req, res) {
    var message = req.body.message;
    var chatId = req.session.chatId;
    var messageLength = req.body.messageLength;
    var messageLengthDecryptionKey = message.substring(0, 5);
    var messageLength = giberrish.dec(req.body.messageLength, messageLengthDecryptionKey);
    var receivedText = message.substring(5, parseInt(messageLength) + 5);
    var encryptionKey = message.substring(parseInt(messageLength) + 5);
    var decryptedMessage = giberrish.dec(receivedText, encryptionKey);
    var data = {
        err: 1,
        res: "",
        chatId: ""
    };
    var time = new Date().getTime();
    connection.query("INSERT INTO messages SET message_content = ?, user_sent_by = ?, chat_id =?, message_security_key=?, sender_name=?, timestamp=?", [receivedText, "client", chatId, encryptionKey, "Anon", time], function(err, res1) {
        if (err) {
            data.res = "Error inserting message " + err;
            console.log(err);
            res.json(data);
        } else {
            data.err = 0;
            data.res = "Successful";
            data.chatId = chatId;
            res.json(data);
        }

    });
});

chatRouter.get("/lastMessageTime", function(req, res) {
    var data = {
        err: 1,
        res: ""
    }
    connection.query("SELECT timestamp FROM messages ORDER BY message_id DESC LIMIT 1", function(err, res1, rows) {
        if (err) {
            console.log(err);
            data.res = err;
        } else {
            data.err = 0;
            data.res = res1[0].timestamp;
            res.json(data);
        }
    });
});

chatRouter.post("/getMessages", function(req, res) {
    var chatId = req.session.chatId;
    if (req.session.adminId) {
        req.session.adminId = req.session.adminId;
    }
    var data = {
        err: 1,
        res: ""
    }
    connection.query("SELECT * FROM messages WHERE chat_id=?", [chatId], function(err, res1, rows) {
        if (err) {
            data.res = "ERROR ";
            console.log(err);
            res.json(data);

        } else {
            data.res = res1;
            res.json(data);
        }
    });
});

loginRouter.get("/", function(req, res) {
    if (req.session.adminId) {
        res.sendfile("./admin_home.html");
    } else {
        res.sendfile("./login.html");
    }
});

loginRouter.post("/login", function(req, res) {
    var username = req.body.username || "";
    var password = req.body.password || "";
    var data = {
        err: 1,
        res: ""
    };
    connection.query("SELECT * FROM admins WHERE admin_username=? AND admin_password=?", [username, password], function(err, res1, rows) {
        if (err) {
            data.res = "Problem logging in";
            console.log(err);
            res.json(data);
        } else {
            if (res1[0]) {
                req.session.adminUsername = res1[0].admin_username;
                req.session.adminName = res1[0].admin_name;
                req.session.adminId = res1[0].admin_id;
                req.session.adminPool = res1[0].admin_pool;
                data.err = 0;
                data.res = "Login Successful";
                res.json(data);
            } else {
                data.res = "Incorrect Username/ Password";
                res.json(data);

            }
        }
    });
});

loginRouter.post("/logout", function(req, res) {
    req.session.adminUsername = null;
    req.session.adminId = null;
    req.session.adminPool = null;
    res.send();
});
adminRouter.get("/home", function(req, res) {
    if (req.session.adminId) {
        res.sendfile("./admin.html");
    } else {
        res.redirect("/login");
    }
});
adminRouter.post("/retrieveMessages", function(req, res) {
    if (req.session.adminId) {
        var adminPool = req.session.adminPool;
        data = {
            err: 1,
            res: "",
            adminId: ""
        }
        connection.query("SELECT * FROM messages WHERE pool=? AND status=? ORDER BY message_id DESC", [adminPool, 0], function(err, res1, rows) {
            if (err) {
                data.res = [];
                res.json(data);
            } else {
                data.err = 0;
                var chatIds = [];
                var processCompleted = 0;
                for (var i = 0; i < res1.length; i++) {
                    if (chatIds.indexOf(res1[i].chat_id) == -1) {
                        chatIds.push(res1[i].chat_id);
                    }
                    if (i == res1.length - 1) {
                        processCompleted = 1;
                    }
                }

                var mappingProcessCompleted = 0;
                var outerArray = [];

                function mapMessages(earlierProcessCompleted) {
                    if (earlierProcessCompleted == 1) {

                        for (var i = 0; i < chatIds.length; i++) {
                            var innerArray = [];
                            for (var j = 0; j < res1.length; j++) {
                                if (chatIds[i] == res1[j].chat_id) {
                                    innerArray.push(res1[j]);
                                }
                                if (j == res1.length - 1) {
                                    outerArray.push(innerArray);
                                }
                            }
                            if (i == chatIds.length - 1) {
                                mappingProcessCompleted = 1;
                            }
                        }

                    }
                }
                mapMessages(processCompleted);

                function returnMappedMessages(earlierProcessCompleted) {
                    if (earlierProcessCompleted == 1) {
                        data.res = outerArray;
                        data.adminId = req.session.adminId;
                    }
                }
                returnMappedMessages(mappingProcessCompleted);

                res.json(data);

            }
        });
    } else {
        res.redirect("/login");
    }
});

adminRouter.post("/sendMessage", function(req, res) {
    if (req.session.adminId) {
        var message = req.body.message;
        var messageLength = req.body.messageLength;
        var chatId = req.body.chatId;
        var messageLengthDecryptionKey = message.substring(0, 5);
        var messageLength = giberrish.dec(req.body.messageLength, messageLengthDecryptionKey);
        var receivedText = message.substring(5, parseInt(messageLength) + 5);
        var encryptionKey = message.substring(parseInt(messageLength) + 5);
        var decryptedMessage = giberrish.dec(receivedText, encryptionKey);
        console.log(decryptedMessage);
        var data = {
            err: 1,
            res: "",
            chatId: ""
        };
        var time = new Date().getTime();
        connection.query("INSERT INTO messages SET message_content = ?, user_sent_by = ?, chat_id =?, message_security_key=?, admin_id=?, sender_name=?, timestamp=?", [receivedText, "audiri", chatId, encryptionKey, req.session.adminId, req.session.adminName, time], function(err, res1) {
            if (err) {
                data.res = "Error inserting message " + err;
                console.log(err);
                res.json(data);
            } else {
                data.err = 0;
                data.res = "Successful";
                data.chatId = chatId;
                res.json(data);
            }

        });
    }

});

adminRouter.post("/openMessage", function(req, res) {
    var chatOpened = req.body.chatId;
    var adminId = req.session.adminId;
    var data = {
        err: 1,
        res: ""
    }
    connection.query("SELECT admins_opened_by FROM messages WHERE chat_id=?", [chatOpened], function(err, res1) {
        console.log("HERE");
        if (err) {
            res.json(data);
            console.log("HERE 2");
        } else {
            console.log("HERE 3");
            var previousArray = JSON.parse(res1[(res1.length - 1)].admins_opened_by);
            if (previousArray.indexOf(adminId) == -1) {
                previousArray.push(adminId);
                console.log(previousArray);
                connection.query("UPDATE messages SET admins_opened_by=? WHERE chat_id=?", ["[" + previousArray.join() + "]", chatOpened], function(err, res2) {
                    if (err) {
                        console.log(err);
                        res.json(data);
                    } else {
                        data.err = 0;
                        data.res = "Completed";
                        console.log("completed");
                        res.json(data);
                    }
                });

            }
        }
    });
});


feedbackRouter.post("/chatFeedback", function(req, res) {
    var rating = req.body.rating;
    var comment = req.body.comment;
    data = {
        err: 1,
        res: ""
    }
    connection.query("UPDATE messages SET status=? WHERE chat_id=?", [1, req.session.chatId], function(err, res1) {
        if (err) {
            res.json(data);
        } else {
            connection.query("INSERT INTO feedback SET chat_id=?, rating=?, comment=?", [req.session.chatId, rating, comment], function(err, res2) {
                if (err) {
                    res.json(data);
                } else {
                    data.res = "Complete";
                    data.err = 0;
                    req.session.chatId = "";
                    res.json(data);
                }
            });
        }
    });
});

rantRouter.post("/getSingleRant", function(req, res) {
    var data = {
        err: 1,
        res: ""
    };

    function getRants() {
        var rantId = req.body.rantId;
        console.log(rantId);
        connection.query("SELECT * FROM rants WHERE rant_id=?", [rantId], function(err, res1, rows) {
            if (err || res1.length <= 0) {
                data.res = err;
                console.log(err);
                res.json(data);

            } else {
                var loopCompleted = 0;
                //SAVE 0-100 in localstorage
                data.err = 0;
                data.res = {};
                var rantIds = [];
                rantIds.push(res1[0].rant_id);
                data.res[res1[0].rant_id] = {};
                data.res[res1[0].rant_id]["content"] = res1[0].rant_content;
                data.res[res1[0].rant_id]["pseudonym"] = res1[0].pseudonym;
                data.res[res1[0].rant_id]["rantType"] = res1[0].rant_type;
                getReplies(rantIds);
            }
        });
    }

    function getReplies(array) {

        connection.query("SELECT * FROM rant_replies WHERE rant_id=?", array, function(err, res1, rows) {
            data.res[array[0]]["replies"] = [];
            if (res1.length > 0) {
                for (var j in res1) {
                    data.res[array[0]]["replies"].push(res1[j]);
                    if (j == (res1.length - 1)) {
                        getLikes(array);
                    }
                }
            } else {
                getLikes(array);
            }
        });

    }

    function getLikes(array) {
        connection.query("SELECT * FROM rant_likes WHERE rant_id=?", array, function(err, res1, rows) {

            data.res[array[0]]["likes"] = [];
            if (res1.length > 0) {
                for (var j in res1) {
                    data.res[array[0]]["likes"].push(res1[j]);
                    if (j == (res1.length - 1)) {
                        res.json(data);
                    }
                }
            } else {
                res.json(data);
            }
        });
    }
    getRants();

});

rantRouter.get("/getPublicRants", function(req, res) {
    var data = {
        err: 1,
        res: ""
    };
    var limit = "LIMIT 1000";
    var addedQuery = "WHERE rant_type = 0 LIMIT 1000";
    if (req.session.chatId) {
        addedQuery = ((req.query.rantType == 1) ? "WHERE chat_id = " + req.session.chatId : "WHERE rant_type=0 LIMIT 1000");
    }

    function generateLikesQuery(array) {
        var baseString = "SELECT * FROM rant_likes WHERE rant_id=?";
        for (var i = 1; i < array.length; i++) {
            baseString += " OR rant_id=?";
        }
        return baseString;
    }

    function generateReplyQuery(array) {
        var baseString = "SELECT * FROM rant_replies WHERE rant_id=?";
        for (var i = 1; i < array.length; i++) {
            baseString += " OR rant_id=?";
        }
        return baseString;
    }

    function getRants() {
        connection.query("SELECT * FROM rants " + addedQuery, function(err, res1, rows) {
            if (err) {
                data.res = err;
                console.log(err);
                res.json(data);

            } else {
                var loopCompleted = 0;
                //SAVE 0-100 in localstorage
                data.err = 0;
                data.res = {};
                var rantIds = [];
                if (res1.length > 0) {
                    for (var i in res1) {
                        rantIds.push(res1[i].rant_id);
                        data.res[res1[i].rant_id] = {};
                        data.res[res1[i].rant_id]["content"] = res1[i].rant_content;
                        data.res[res1[i].rant_id]["pseudonym"] = res1[i].pseudonym;
                        data.res[res1[i].rant_id]["rantType"] = res1[i].rant_type;
                        if (i == (res1.length - 1)) {
                            getReplies(rantIds);
                        }
                    }
                } else {
                    data.res = [];
                    res.json(data);
                }
            }
        });
    }

    function getReplies(array) {
        if (array.length > 0) {
            connection.query(generateReplyQuery(array), array, function(err, res1, rows) {
                for (var i in array) {
                    data.res[array[i]]["replies"] = [];
                    for (var j in res1) {
                        if (res1[j].rant_id == array[i]) {
                            data.res[array[i]]["replies"].push(res1[j]);
                        }
                    }
                    if (i == (array.length - 1)) {
                        getLikes(array);
                    }
                }
            });
        }
    }

    function getLikes(array) {
        connection.query(generateLikesQuery(array), array, function(err, res1, rows) {
            for (var i in array) {
                data.res[array[i]]["likes"] = [];
                for (var j in res1) {
                    if (res1[j].rant_id == array[i]) {
                        data.res[array[i]]["likes"].push(res1[j].chat_id);
                    }
                }
                if (i == (array.length - 1)) {
                    res.json(data);
                }
            }
        });
    }
    getRants();
});

rantRouter.get("/getRantsLikedByUser", function(req, res) {
    var data = {
        err: 1,
        res: ""
    }

    function generateRantsQuery(array) {
        if (array.length > 0) {
            var baseString = "SELECT * FROM rants WHERE rant_id=?";
            for (var i = 1; i < array.length; i++) {
                baseString += " OR rant_id=?";
            }
            return baseString;
        }
    }

    function generateLikesQuery(array) {
        if (array.length > 0) {
            var baseString = "SELECT * FROM rant_likes WHERE rant_id=?";
            for (var i = 1; i < array.length; i++) {
                baseString += " OR rant_id=?";
            }
            return baseString;
        }
    }

    function generateReplyQuery(array) {
        if (array.length > 0) {
            var baseString = "SELECT * FROM rant_replies WHERE rant_id=?";
            for (var i = 1; i < array.length; i++) {
                baseString += " OR rant_id=?";
            }
            return baseString;
        }
    }

    function getRantsLiked(chatId) {
        connection.query("SELECT * FROM rant_likes WHERE chat_id=?", [chatId], function(err, res1, rows) {
            if (err) {
                data.res = err;
                console.log(err);
                res.json(data);

            } else {
                var loopCompleted = 0;
                //SAVE 0-100 in localstorage
                data.err = 0;
                data.res = {};
                var rantIds = [];
                if (res1.length > 0) {
                    for (var i in res1) {
                        data.res[res1[i].rant_id] = {};
                        rantIds.push(res1[i].rant_id);
                        data.res[res1[i].rant_id]["rant_like_id"] = res1[i].rant_like_id;
                        if (i == (res1.length - 1)) {
                            getRants(rantIds);
                        }
                    }
                } else {
                    getLikes([]);
                }

            }
        });
    }

    function getRants(array) {
        if (array.length > 0) {
            connection.query(generateRantsQuery(array), array, function(err, res1, rows) {
                if (err) {
                    data.res = err;
                    console.log(err);
                    res.json(data);

                } else {
                    var loopCompleted = 0;
                    //SAVE 0-100 in localstorage
                    data.err = 0;
                    for (var i in res1) {
                        data.res[res1[i].rant_id]["content"] = res1[i].rant_content;
                        data.res[res1[i].rant_id]["pseudonym"] = res1[i].pseudonym;
                        if (i == (res1.length - 1)) {
                            getReplies(array);
                        }
                    }
                }
            });
        } else {
            getLikes(array);
        }
    }

    function getReplies(array) {
        if (array.length > 0) {
            connection.query(generateReplyQuery(array), array, function(err, res1, rows) {
                for (var i in array) {
                    data.res[array[i]]["replies"] = [];
                    for (var j in res1) {
                        if (res1[j].rant_id == array[i]) {
                            data.res[array[i]]["replies"].push(res1[j]);
                        }
                    }
                    if (i == (array.length - 1)) {
                        getLikes(array);
                    }
                }
            });
        }
    }

    function getLikes(array) {
        if (array.length > 0) {
            connection.query(generateLikesQuery(array), array, function(err, res1, rows) {
                for (var i in array) {
                    data.res[array[i]]["likes"] = [];
                    for (var j in res1) {
                        if (res1[j].rant_id == array[i]) {
                            data.res[array[i]]["likes"].push(res1[j]);
                        }
                    }
                    if (i == (array.length - 1)) {
                        res.json(data);
                    }
                }
            });
        } else {
            data.res = [];
            res.json(data);
        }
    }
    if (req.session.chatId || req.query.chatId) {
        var chatId = req.session.chatId || req.query.chatId;
        getRantsLiked(chatId);
    } else {
        data.err = "No Chat Id";
        res.json(data);
    }
});

rantRouter.get("/getRantsByUser", function(req, res) {
    if (req.session.chatId) {
        var chatId = req.session.chatId;
        var data = {
            err: 1,
            res: ""
        }
        connection.query("SELECT * FROM rants WHERE chat_id = ?", [chatId], function(err, res1, rows) {
            if (err) {
                data.err = err;
                res.json(data);
            } else {
                data.err = 0;
                data.res = res1;
                res.json(data);
            }
        });
    }
});
rantRouter.post("/deleteRant", function(req, res){
    var rantId = req.body.rantId;
    var data = {
        err:1,
        res:""
    }
    connection.query("DELETE FROM rants WHERE rant_id=?",[rantId], function(err, res1){
        if(err){
            data.res=err;
            res.json(data); 
            console.log(err);
        }
        else{
            data.res="Successful";
            data.err=0;
            res.json(data);
        }
    });
});
rantRouter.post("/postRant", function(req, res) {
    var rantContent = req.body.rantContent;
    console.log(rantContent); 
    var pseudonym = req.body.pseudonym || "Anon";
    var chatId = req.body.chatId || req.session.chatId;
    var rantType = req.body.rantType || 0;
    var data = {
        err: 1,
        res: ""
    }
    connection.query("INSERT INTO rants SET rant_content=?, pseudonym=?, chat_id=?, rant_type=?", [rantContent, pseudonym, chatId, rantType], function(err, res1) {
        if (err) {
            data.res = err;
            res.json(data);
        } else {
            data.err = 0;
            data.res = "Successful";
            res.json(data);
        }
    });
});


rantRouter.post("/likeRant", function(req, res) {
    var rantId = req.body.rantId;
    var chatId = req.body.chatId || req.session.chatId;
    var data = {
        err: 1,
        res: ""
    }
    connection.query("INSERT IGNORE INTO rant_likes SET rant_id=?, chat_id=?", [rantId, chatId], function(err, res1) {
        if (err) {
            data.res = err;
            res.json(data);
        } else {
            data.err = 0;
            data.res = "Successful";
            res.json(data);
        }
    });
});

rantRouter.post("/unlikeRant", function(req, res){
    var rantId = req.body.rantId;
    var chatId = req.session.chatId;
    var data = {
        err: 1,
        res: ""
    }
    connection.query("DELETE FROM rant_likes WHERE rant_id = ? AND chat_id = ?", [rantId, chatId], function(err, res1){
        if(err){
            data.res = err;
            res.json(data);
        }else{
            data.res = "Successful";
            data.err = 0;
            res.json(data);
        }
    });
});

rantRouter.post("/replyRant", function(req, res) {
    var rantId = req.body.rantId;
    var chatId = req.body.chatId || req.session.chatId;
    var replyContent = req.body.replyContent;
    var data = {
        err: 1,
        res: ""
    }
    connection.query("INSERT INTO rant_replies SET rant_id=?, chat_id=?, rant_reply_content=?", [rantId, chatId, replyContent], function(err, res1) {
        if (err) {
            data.res = err;
            res.json(data);
        } else {
            data.err = 0;
            data.res = "Successful";
            res.json(data);
        }
    });
});

rantRouter.post("/searchRant", function(req, res){
    var query = req.body.query;
    var queryArray = query.split(" ");
    var data = {
        err:1,
        res:""
    }
    
    function generateSearchQuery(splitQuery){
        var baseString = "SELECT * from rants WHERE rant_type = 0 AND (rant_content LIKE ? OR pseudonym LIKE ?)";
        for(var i=1; i<splitQuery.length; i++){
            baseString = baseString.concat("AND (rant_content LIKE ? OR pseudonym LIKE ?)");
        }
        return baseString;
    }

    function createArray(splitQuery) {
        var initialArray = ["%" + splitQuery[0] + "%", "%" + splitQuery[0] + "%"];
        for (var i = 1; i < splitQuery.length; i++) {
            initialArray.push("%" + splitQuery[i] + "%");
            initialArray.push("%" + splitQuery[i] + "%");
        }
        console.log(initialArray);
        return initialArray;
    }

    function generateLikesQuery(array) {
        if (array.length > 0) {
            var baseString = "SELECT * FROM rant_likes WHERE rant_id=?";
            for (var i = 1; i < array.length; i++) {
                baseString += " OR rant_id=?";
            }
            return baseString;
        }
    }

    function generateReplyQuery(array) {
        if (array.length > 0) {
            var baseString = "SELECT * FROM rant_replies WHERE rant_id=?";
            for (var i = 1; i < array.length; i++) {
                baseString += " OR rant_id=?";
            }
            return baseString;
        }
    }

    function getRants(queryArray){
        connection.query(generateSearchQuery(queryArray), createArray(queryArray), function(err, res1, rows){
            if(err){
                data.res = err;
                res.json(data);
            }
            else{
                data.err = 0;
                data.res = {};
                var rantIds = [];
                if (res1.length > 0) {
                    for (var i in res1) {
                        rantIds.push(res1[i].rant_id);
                        data.res[res1[i].rant_id] = {};
                        data.res[res1[i].rant_id]["content"] = res1[i].rant_content;
                        data.res[res1[i].rant_id]["pseudonym"] = res1[i].pseudonym;
                        data.res[res1[i].rant_id]["rantType"] = res1[i].rant_type;
                        if (i == (res1.length - 1)) {
                            getReplies(rantIds);
                        }
                    }
                } else {
                    data.res = [];
                    res.json(data);
                }
            }
        });
    }

    function getReplies(array) {
        if (array.length > 0) {
            connection.query(generateReplyQuery(array), array, function(err, res1, rows) {
                for (var i in array) {
                    data.res[array[i]]["replies"] = [];
                    for (var j in res1) {
                        if (res1[j].rant_id == array[i]) {
                            data.res[array[i]]["replies"].push(res1[j]);
                        }
                    }
                    if (i == (array.length - 1)) {
                        getLikes(array);
                    }
                }
            });
        }
    }

    function getLikes(array) {
        if (array.length > 0) {
            connection.query(generateLikesQuery(array), array, function(err, res1, rows) {
                for (var i in array) {
                    data.res[array[i]]["likes"] = [];
                    for (var j in res1) {
                        if (res1[j].rant_id == array[i]) {
                            data.res[array[i]]["likes"].push(res1[j]);
                        }
                    }
                    if (i == (array.length - 1)) {
                        res.json(data);
                    }
                }
            });
        } else {
            data.res = [];
            res.json(data);
        }
    }

    getRants(queryArray);
    
})


app.listen(process.env.PORT || 3000);