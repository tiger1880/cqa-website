const express = require('express');
const session = require('express-session');
const { Cookie } = require('express-session');
const cors = require("cors");
const bcrypt = require('bcryptjs');
const { request } = require('express');

const port = 3001;
const app = express();
app.use(express.urlencoded({ extended: true })); // convert url encoded objects aswell
app.use(express.json()); // req json to jsx objects conversion

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));


app.use(function (req, res, next) {

  res.header('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,UPDATE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, X-Requested-With, X-HTTP-Method-Override, Accept');
  next();

});

const Pool = require('pg').Pool;
const pgSession = require('connect-pg-simple')(session);

const DBUSER = 'nitya';
const DBHOST = 'localhost';
const DBNAME = 'cqadb';
const DBPASS = 'Nitya@12345$'
const DBPORT = 5432

const pool = new Pool({

  user: DBUSER,
  host: DBHOST,
  database: DBNAME,
  password: DBPASS,
  port: DBPORT

});


const store = new pgSession({
  pool: pool,
  createTableIfMissing: true,
  tableName: 'user_sessions',
});

app.use(session({
  store: store,
  secret: 'TOPSECRET',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24,
  }

}))


/*pool.query("SELECT * FROM users", (err, result) => {


  // 

  let count = 0;

  if (err) 
  console.log(err)
  
  if (result) {
    
    result.rows.forEach( (user) => {
      
        let username = user.display_name + '#' + user.id;
        
        pool.query('UPDATE users SET username = $1 WHERE id = $2',[username, user.id], (err,result) => {
          if(err) {
            console.log(err);
          }

          if (result) {
            count++;
            console.log(count);

          }
        })


  })
  }

})*/


/*
pool.query("SELECT * FROM users WHERE password = 'user123' LIMIT 1000", (err, result) => {

  let count = 0;

  // 
  if (err) 
  console.log(err)
  
  if (result) {
    
    result.rows.forEach( (user) => {


      
      console.log('hi');
      bcrypt.hash(user.username,12, (err,hashPassword) => {
        
        if(err) {
          console.log(err);
        }
        
        pool.query('UPDATE users SET password = $1 WHERE id = $2',[hashPassword,user.id], (err,result) => {
          if(err) {
            console.log(err);
          }

          if (result) {
            count++;
            console.log(count);

          }
        })


    
      });

  })
  }

})
*/


// search filter posts

app.get('/posts', (req, res) => {

  const offset = req.query.offset;
  const limit = req.query.limit;
  const like = req.query.str;
  const sort = req.query.sort;
  const option = req.query.option;

  console.log(option, sort);

  getPosts(like, offset, limit, sort, option)
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {

      res.status(500).send(error);
    });

});

app.post("/register", async (req, res) => {

  const display_name = req.body.display_name;
  const password = req.body.password;
  const location = req.body.location;
  const image_url = req.body.image_url;
  const about_me = req.body.about_me;

  bcrypt.hash(password, 12, (err, hashPassword) => {

    if (err) {
      console.log(err);
    }

    pool.query("INSERT INTO users (id,reputation,display_name,location,profile_image_url,about_me,creation_date,password) VALUES (DEFAULT,1,$1,$2,$3,$4,current_timestamp,$5) RETURNING id, display_name",

      [display_name, location, image_url, about_me, hashPassword], (err, result) => {

        if (err) {
          console.log(err);
        }

        if (result) {

          console.log('Hello registered successfully');
          console.log(result.rows[0]);
          res.send(result.rows[0]);
        }
      })
  })
});

app.post('/upvote', (req, res) => {

  const postid = req.body.postid;
  const userid = req.body.userid;

  pool.query("SELECT COUNT(*) FROM votes WHERE user_id = $1 AND post_id = $2 AND vote_type_id = 2", [userid, postid], (err, result) => {

    if (err) {

      console.log(err);

    }

    if (result) {

      res.send(result.rows);
    }


  })


})

app.post('/downvote', (req, res) => {

  const postid = req.body.postid;
  const userid = req.body.userid;

  pool.query("SELECT COUNT(*) FROM votes WHERE user_id = $1 AND post_id = $2 AND vote_type_id = 3", [userid, postid], (err, result) => {

    if (err) {

      console.log(err);

    }

    if (result) {

      res.send(result.rows);
    }


  })


})

app.post("/login", (req, res) => {

  const display_name = req.body.display_name;
  const password = req.body.password;

  pool.query("SELECT * FROM users WHERE username = $1;",
    [display_name], (err, result) => {
      if (err) {
        console.log(err)
        return res.send({ err: err });
      }


      if (result.rowCount > 0) {
        const id = result.rows[0].id;
        console.log(result.rows[0].password);
        bcrypt.compare(password, result.rows[0].password, (error, response) => {

          if (response) {

            req.session.isAuth = true;
            req.session.username = display_name;
            req.session.userid = id;

            return res.send({ message: "Login Successful" });
          } else {
            req.session.isAuth = false;
            return res.send({ message: "Incorrect Password" });
          }
        })
      }
      else {
        req.session.isAuth = false;
        return res.send({ message: "User doesn't exist" });
      }

    })

});


app.get('/home', (req, res) => {

  console.log(req.session.isAuth);
  if (req.session.isAuth) {

    res.send({ message: "Active", display_name: req.session.display_name, userid: req.session.userid });

  }
  else {
    res.send({ message: "Not active", display_name: null, userid: null });
  }

});

app.post('/logout', (req, res) => {

  req.session.isAuth = false
  console.log(req.session.userid);


  if (!req.session.isAuth) {
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
      }
      else {
        res.clearCookie('connect.sid');
        res.send({ message: 'Logged out' });
      }
    })
  }
})

let owner_id;
app.post("/own_profile", (req, res) => {
  console.log(req.session);
  const sent_name = req.body.name;
  const username = req.session.username;
  console.log(username);

  pool.query("SELECT *  FROM users WHERE username = $1;", [username], (err, responses) => {
    if (err) {
      console.log(err);
      res.send({ err: err });
    }
    else {

      res.send({ data: responses.rows });
    }
  })
});

app.post("/own_profile_posts", (req, res) => {

  const owner_id = req.body.id;
  const owner_user_id = req.session.userid;
  pool.query("SELECT title,score,creation_date from posts where owner_user_id = $1 and title is not null order by score desc LIMIT 10;", [owner_user_id], (err, responses) => {
    if (err) {
      console.log(err);
      res.send({ err: err });
    }
    else {
      res.send({ data: responses.rows });
    }
  })

});

app.get("/tags", (req, res) => {
  pool.query("select tag_name from tags;", (err, responses) => {
    if (err) {
      console.log(err);
      res.send({ err: err });
    }
    else {
      res.send({ data: responses.rows });
    }
  })
});



app.post("/createpost", async (req, res) => {

  const title = req.body.title;
  const body = req.body.question;
  const tags = req.body.tags;
  var msg = "";
  var tag_string = "";
  for (var i = 0; i < tags.length; i++) {
    tag_string = tag_string + "<" + tags[i].tag_name + ">";
  }

  const id = req.session.userid;
  console.log(id);

  pool.query("SELECT display_name from users where id = $1", [id], (err, result) => {
    if (err) {
      console.log(err);
    }
    else {

      const display_name = result.rows[0].display_name;

      pool.query("INSERT INTO posts (id,owner_user_id,post_type_id,score,view_count,owner_display_name,title,tags,content_license,body,creation_date) VALUES (DEFAULT,$1,1,0,0,$2,$3,$4,'license',$5,current_timestamp);", [id, display_name, title, tag_string, body],
        (err, result) => {
          if (err) {
            console.log(err);
          }
          if (result) {
            msg = "Created Post";
            console.log(msg);

            if (msg == "Created Post") {
              for (var i = 0; i < tags.length; i++) {
                console.log(tags[i]);
                pool.query("UPDATE tags set count = count + 1 where tag_name = $1;", [tags[i].tag_name], (err, result) => {
                  if (err) {
                    console.log(err);
                  }
                  if (result) {
                    console.log("Count increased");
                  }
                })
              }
            }

            res.send(msg);

          }

        })

    }
  })

});



app.get("/own_all_questions", (req, res) => {
  const id = req.session.userid;
  pool.query("select * from posts where owner_user_id = $1 and post_type_id = 1 order by creation_date;", [id], (err, responses) => {
    if (err) {
      console.log(err);
      res.send({ err: err });
    }
    else {
      
      res.send({ data: responses.rows });
    }
  })
})

app.get("/own_all_answers", (req, res) => {
  const id = req.session.userid;
  pool.query("select P.id,P.score,P.creation_date,Q.title from posts as P,posts as Q where P.owner_user_id = $1 and P.post_type_id = 2 and P.parent_id = Q.id order by creation_date;", [id], (err, responses) => {
    if (err) {
      console.log(err);
      res.send({ err: err });
    }
    else {
      res.send({ data: responses.rows });
    }
  })
})


var tagstring = "";
app.post("/own_post", (req, res) => {
  const id = req.body.id;
  console.log(id)
  pool.query("select title,tags,body from posts where id = $1 AND owner_user_id = $2", [id, req.session.userid], (err, responses) => {
    if (err) {
      console.log(err);
      res.send({ err: err });
    }
    else {

      if (responses.rows.length !== 0){
        tagstring = responses.rows[0].tags;
      }
      res.send({ data: responses.rows });
    }
  })
});


app.post("/editanswer", async (req, res) => {


  const body = req.body.question;
  const id = req.body.id

  pool.query("UPDATE posts SET body = $1 WHERE id = $2;", [body, id],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      if (result) {
        msg = "Edited Post";
        console.log('Edited post')

        res.send(msg);
      }

    })

});


app.post("/editpost", async (req, res) => {


  const title = req.body.title;
  const body = req.body.question;
  const tags = req.body.tags;
  const id = req.body.id
  var tag_string = "";
  var msg = "";

  for (var i = 0; i < tags.length; i++) {
    tag_string = tag_string + "<" + tags[i].tag_name + ">";
  }

  console.log(tag_string)

  pool.query("UPDATE posts SET title = $1,tags = $2,body = $3 WHERE id = $4;", [title, tag_string, body, id],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      if (result) {
        msg = "Edited Post";
        console.log('Edited post')
        if (msg == "Edited Post") {
          var old_tags = tagParser(tagstring);

          for (var i = 0; i < old_tags.length; i++) {
            pool.query("UPDATE tags set count = count - 1 where tag_name = $1;", [old_tags[i]], (err, result) => {
              if (err) {
                console.log(err);
              }
              if (result) {
                console.log("Count decreased");
              }
            })
          }

          for (var i = 0; i < tags.length; i++) {
            pool.query("UPDATE tags set count = count + 1 where tag_name = $1;", [tags[i].tag_name], (err, result) => {
              if (err) {
                console.log(err);
              }
              if (result) {
                console.log("Count increased");
              }
            })
          }

        }
        res.send(msg);
      }

    })

});

function tagParser(tag_string) {
  var j = 0;
  var start = 1, end;
  var myTags = []
  for (var i = 0; i < tag_string.length; i++) {
    if (tag_string[i] == '>') {
      end = i;
      myTags[j] = tag_string.slice(start, end);
      j++;
      start = end + 2;
    }
  }
  return myTags;
}


app.get('/', (req, res) => {


  const like = req.query.str;
  const which = req.query.which;
  const offset = req.query.offset;
  const limit = req.query.limit;

  if (which === "tag") {

    getStudents(like, offset, limit)
      .then(response => {
        res.status(200).send(response);
      })
      .catch(error => {

        res.status(500).send(error);
      }
      );
  }
  else if (which === "user") {

    getUsers(like, offset, limit)
      .then(response => {
        res.status(200).send(response);
      })
      .catch(error => {

        res.status(500).send(error);
      }
      );

  }
  else if (which === "post") {

    getPosts(like, offset, limit)
      .then(response => {
        res.status(200).send(response);
      })
      .catch(error => {

        res.status(500).send(error);
      });
  }
  else if (which === "specific-post") {


    const id = like;

    getPost(id)
      .then(response => {
        res.status(200).send(response);
      })
      .catch(error => {

        res.status(500).send(error);
      });


  }
  else if (which === "answers") {

    const q_id = like;

    getAnswers(q_id)
      .then(response => {
        res.status(200).send(response);
      })
      .catch(error => {

        res.status(500).send(error);
      });


  }
  else {

    res.status(404).send("Unknown GET request");
  }

});


app.post('/addAnswer', (req, res) => {

  addAnswer(req.body)
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {

      res.status(500).send(error);
    }
    );
});

app.post('/removeVote', (req, res) => {

  const userid = req.body.userid;
  const postid = req.body.postid;
  const update = req.body.update;
  let type = -1;

  if (update === '+'){

    type = 2;

  }
  else if (update === '-'){

    type = 3;

  }
  else
    console.log('shouldn\'t print this');


  pool.query("DELETE FROM votes WHERE user_id = $1 AND post_id = $2 AND vote_type_id = $3", [userid, postid, type], (err, result) => {
    
    if (err)
      console.log(err);

    console.log('Vote Removed');
    res.send("Vote Removed");

  })

// when we delete a post delete the votes from the table aswell

})

app.post('/addVote', (req, res) => {

  const userid = req.body.userid;
  const postid = req.body.postid;
  const update = req.body.update;
  let type = -1;

  if (update === '+'){

    type = 2;

  }
  else if (update === '-'){

    type = 3;

  }
  else
    console.log('shouldn\'t print this');

  pool.query("INSERT INTO votes(user_id, post_id, vote_type_id, creation_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)", [userid, postid, type], (err, result) => {
    
    if (err)
      console.log(err);

    console.log('Vote Inserted');
    res.send('Vote Inserted');

  })

})

app.post('/updateScore', (req, res) => {


  updateScore(req.body)
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {

      res.status(500).send(error);
    }
    );
});

app.get('/user', (req, res) => {

  const id = req.query.id;

  getUser(id)
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {

      res.status(500).send(error);
    }
    );

});

app.get('/loggeduser', (req, res) => {

  const id = req.session.userid;

  getUser(id)
    .then(response => {
      res.status(200).send(response);
    })
    .catch(error => {

      res.status(500).send(error);
    }
    );

});

app.post('/deletepost', (req, res) => {


  const postid = req.body.id;

  pool.query("DELETE FROM posts WHERE id = $1", [postid], (err, result) => {


    if (err)
      console.log(err);


    res.send("Post Deleted");
    console.log('Post deleted');
  });

});

const getStudents = (like, offset, limit) => {

  return new Promise(function (resolve, reject) {


    const str = `SELECT tag_name, id, count FROM tags WHERE tag_name LIKE $1 OR tag_name LIKE $2 OFFSET $3 LIMIT $4`;
    const fLike = `${like}%`;
    const sLike = `% ${like}%`;

    pool.query(str, [fLike, sLike, offset, limit], (error, results) => {

      if (error) {
        reject(error);
      }

      resolve(results.rows);
    });
  });
};

const getUsers = (like, offset, limit) => {


  const fLike = `${like}%`;

  return new Promise(function (resolve, reject) {

    pool.query(`SELECT display_name, id, profile_image_url FROM users WHERE LOWER(display_name) LIKE '${like}%' OR LOWER(display_name) LIKE '% ${like}%' ORDER BY id OFFSET ${offset} LIMIT ${limit}`, (error, results) => {

      if (error) {
        reject(error);
      }

      resolve(results.rows);

    });

  });

};

const getUser = (id) => {

  // console.log(id);

  str = `SELECT * FROM users WHERE id = $1`;

  return new Promise(function (resolve, reject) {

    pool.query(str, [id], (error, results) => {

      if (error) {
        reject(error);
      }
      if (results.rows.length !== 0)
        resolve(results.rows);
      else
        resolve([{
          display_name: "Anonymous",
          profile_image_url: 'https://graph.facebook.com/694282006/picture?type=large',
          id: null
        }]);

    });

  });


}

const getPosts = (like, offset, limit, sort, option) => {


  if (option === 'title' && sort === 'upvotes') {
    return new Promise(function (resolve, reject) {

      pool.query(`SELECT * FROM posts WHERE (LOWER(title) LIKE '${like}%' OR LOWER(title) LIKE '% ${like}%') AND ( post_type_id = 1) ORDER BY score DESC OFFSET ${offset} LIMIT ${limit}`, (error, results) => {

        if (error) {
          reject(error)
        }

        resolve(results.rows);

      });
    });

  }
  else if (option === 'title' && sort === 'newest') {

    return new Promise(function (resolve, reject) {

      pool.query(`SELECT * FROM posts WHERE (LOWER(title) LIKE '${like}%' OR LOWER(title) LIKE '% ${like}%') AND ( post_type_id = 1) ORDER BY creation_date DESC OFFSET ${offset} LIMIT ${limit}`, (error, results) => {

        if (error) {
          reject(error)
        }

        // console.log(results.rows);

        resolve(results.rows);

      });
    });


  }
  else if (option === 'userpost' && sort === 'newest') {



    return new Promise(function (resolve, reject) {


      pool.query(`SELECT * FROM posts WHERE  ( post_type_id = 1 ) AND (owner_user_id = $1) ORDER BY creation_date DESC OFFSET ${offset} LIMIT ${limit}`, [+like], (error, results) => {

        if (error) {
          reject(error)
        }

        resolve(results.rows);

      });
    });
  }
  else if (option === 'userpost' && sort === 'upvotes') {


    return new Promise(function (resolve, reject) {

      pool.query(`SELECT * FROM posts WHERE (post_type_id = 1 ) AND (owner_user_id = $1) ORDER BY score DESC OFFSET ${offset} LIMIT ${limit}`, [+like], (error, results) => {

        if (error) {
          reject(error)
        }

        resolve(results.rows);

      });
    });
  }
  else if (option === 'tags' && sort === 'upvotes') {

    like = like.replace(/<|>/g, ' ');
    like = like.trim();
    const arr = like.split(/\s+/);

    // console.log(arr);


    return new Promise(function (resolve, reject) {

      pool.query(`SELECT * FROM getPosts($1) WHERE post_type_id = 1  ORDER BY score DESC OFFSET ${offset} LIMIT ${limit}`, [arr], (error, results) => {

        if (error) {
          reject(error)
        }

        resolve(results.rows);

      });
    });


  }
  else if (option === 'tags' && sort === 'newest') {

    like = like.replace(/<|>/g, ' ');
    like = like.trim();
    const arr = like.split(/\s+/);

    return new Promise(function (resolve, reject) {

      pool.query(`SELECT * FROM getPosts($1) WHERE post_type_id = 1  ORDER BY creation_date DESC OFFSET ${offset} LIMIT ${limit}`, [arr], (error, results) => {

        if (error) {
          reject(error)
        }

        resolve(results.rows);

      });
    });

  }
  else {

    console.log('wth');
    return new Promise((res, rej) => { rej('ERROR!!! getPosts') })
  }


}

const getPost = (id) => {


  const str = `SELECT * FROM posts WHERE id = $1`;

  return new Promise(function (resolve, reject) {

    pool.query(str, [id], (error, results) => {

      if (error) {

        console.log(error);
        reject(error)
      }

      resolve(results.rows);

    });
  });
};


const getAnswers = (q_id) => {

  // console.log(q_id);

  /*
      SELECT * 
      FROM posts
      WHERE parent_id = {q_id} AND 
      post_type_id = 2
      ORDER BY score DESC

  */

  //Not limiting not expecting too many answers

  const str = `SELECT * FROM posts WHERE parent_id = ${q_id} AND post_type_id = 2 ORDER BY score DESC`;

  return new Promise(function (resolve, reject) {

    pool.query(str, (error, results) => {

      if (error) {

        console.log(error);
        reject(error)
      }

      // console.log(results.rows);
      resolve(results.rows);

    });
  });



};

const addAnswer = (ans) => {


  const { owner, q_id, owner_display_name, content_license, body } = ans;


  const str = `INSERT INTO posts(id, owner_user_id, post_type_id, score, parent_id, answer_count, owner_display_name, content_license, body, creation_date) VALUES (DEFAULT, $1, 2, 0, $2, NULL, $3, $4, $5,CURRENT_TIMESTAMP) RETURNING id`;

  return new Promise(function (resolve, reject) {


    pool.query(str, [owner, q_id, owner_display_name, content_license, body], (error, results) => {

      if (error) {

        console.log(error);
        reject(error);
      }
      resolve(results.rows[0]);

    });
  });

};

const updateScore = (body) => {

  const id = body.id;

  if (body.update === "+") {

    const str = `UPDATE posts SET score = score + 1 WHERE id = ${id}`;

    return new Promise(function (resolve, reject) {


      pool.query(str, (error, results) => {

        if (error) {

          console.log(error);
          reject(error);
        }

        resolve(`Score incremented`);

      });
    });

  }
  else if (body.update === "-") {

    const str = `UPDATE posts SET score = score - 1  WHERE id = ${id}`;

    return new Promise(function (resolve, reject) {


      pool.query(str, (error, results) => {

        if (error) {

          console.log(error);
          reject(error);
        }

        resolve(`Score decremented`);

      });
    });


  }
  else {

    //bad request  not here 
  }

};

app.listen(port, () => {

  console.log(`App running on port ${port}`);

});

