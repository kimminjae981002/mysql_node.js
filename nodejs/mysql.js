var mysql = require("mysql2");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root", // 내가 mysql 만든 id
  password: "root", // 내가 mysql에 사용한 패스워드
  database: "opentutorials", // 사용할 mysql 데이터베이스
});

connection.connect(); // mysql 연결

connection.query("select * from author", function (error, results, fields) {
  if (error) {
    // console.log(error);
    // author 테이블을 보여달라
  }
  console.log(results);
});

connection.end();
