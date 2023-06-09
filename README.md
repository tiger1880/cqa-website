# cqa-website

# Asktopia ( a Community Question Answer Site)

## Table of contents

- Introduction
- Running the code
- Author

## Introduction

CQA website like Quora or Stackoverflow. Users can sign in. Ask Questions, answer others questions.

## Running the code

### client side (PORT 3000)
    $ cd frontend
    $ npm install
    $ npm start

### server side (PORT 3001)
    $ cd backend
    $ npm install
    $ node initial 
    $ node index


### postgresql database server runs on PORT 5432
To set up the database, download the software engineering dataset from [Stackexchange Datadump](https://archive.org/download/stackexchange). To convert the xml data to csv follow [this tutorial](https://github.com/SkobelevIgor/stackexchange-xml-converter). 
For inserting the data into the database (Commands for postgreSQL)
```SQL
mydb=> \i script.sql   -- replace the paths first in script.sql in schema folder
```
   
## Authors

- Nitya Seshagiri Bhamidipaty
- Muskan Jaiswal 
- Deepshikha 
- Tejal Kulkarni 
