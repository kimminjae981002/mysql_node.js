var http = require("http");
var fs = require("fs");
var url = require("url");
var qs = require("querystring");
var mysql = require("mysql2");
var template = require("./lib/template.js");
var path = require("path");
var sanitizeHtml = require("sanitize-html");

// mysql과 연동하여 데이터베이스를 가져옴
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "opentutorials",
});

// db변수를 연결함.
db.connect();

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === "/") {
    if (queryData.id === undefined) {
      // fs.readdir("./data", function (error, filelist) {
      //   var title = "Welcome";
      //   var description = "Hello, Node.js";
      //   var list = template.list(filelist);
      //   var html = template.HTML(
      //     title,
      //     list,
      //     `<h2>${title}</h2>${description}`,
      //     `<a href="/create">create</a>`
      //   );
      //   response.writeHead(200);
      //   response.end(html);
      // });

      // db.query를 사용해서 실행
      db.query(`select * from topic`, function (error, topics) {
        var title = "Welcome";
        var description = "Hello, Node.js";
        var list = template.list(topics);
        var html = template.HTML(
          title,
          list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    } else {
      // fs.readdir("./data", function (error, filelist) {
      //   var filteredId = path.parse(queryData.id).base;
      //   fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
      //     var title = queryData.id;
      //     var sanitizedTitle = sanitizeHtml(title);
      //     var sanitizedDescription = sanitizeHtml(description, {
      //       allowedTags: ["h1"],
      //     });
      //     var list = template.list(filelist);
      //     var html = template.HTML(
      //       sanitizedTitle,
      //       list,
      //       `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      //       ` <a href="/create">create</a>
      //           <a href="/update?id=${sanitizedTitle}">update</a>
      //           <form action="delete_process" method="post">
      //             <input type="hidden" name="id" value="${sanitizedTitle}">
      //             <input type="submit" value="delete">
      //           </form>`
      //     );
      //     response.writeHead(200);
      //     response.end(html);
      //   });
      // });
      db.query(`select * from topic`, function (error, topics) {
        if (error) {
          throw error;
        }
        db.query(
          `select * from topic where id=?`,
          [queryData.id],
          // 공격할 수 있기 때문에 이렇게 처리
          function (error2, topic) {
            if (error2) {
              throw error2;
            }
            console.log(topic);
            var title = topic[0].title;
            var description = topic[0].description;
            var list = template.list(topics);
            var html = template.HTML(
              title,
              list,
              `<h2>${title}</h2>${description},
              <a href="/create">create</a>   
               <a href="/update?id=${queryData.id}">update</a>
              <form action="delete_process" method="post">
              <input type="hidden" name="id" value="${queryData.id}">
              <input type="submit" value="delete">
              </form>
              `,
              ""
            );

            response.writeHead(200);
            response.end(html);
          }
        );
      });
    }
  } else if (pathname === "/create") {
    fs.readdir("./data", function (error, filelist) {
      var title = "WEB - create";
      var list = template.list(filelist);
      var html = template.HTML(
        title,
        list,
        `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `,
        ""
      );
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === "/create_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;
      fs.writeFile(`data/${title}`, description, "utf8", function (err) {
        response.writeHead(302, { Location: `/?id=${title}` });
        response.end();
      });
    });
  } else if (pathname === "/update") {
    fs.readdir("./data", function (error, filelist) {
      var filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, "utf8", function (err, description) {
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(
          title,
          list,
          `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === "/update_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, function (error) {
        fs.writeFile(`data/${title}`, description, "utf8", function (err) {
          response.writeHead(302, { Location: `/?id=${title}` });
          response.end();
        });
      });
    });
  } else if (pathname === "/delete_process") {
    var body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      var post = qs.parse(body);
      var id = post.id;
      var filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function (error) {
        response.writeHead(302, { Location: `/` });
        response.end();
      });
    });
  } else {
    response.writeHead(404);
    response.end("Not found");
  }
});
app.listen(3000);
