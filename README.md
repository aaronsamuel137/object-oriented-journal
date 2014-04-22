Object Oriented Journal
=======================

The Object Oriented Journal aims to explore an alternative way of journaling.
Journal entries are structured in a way similar to objects in object-oriented
programming, where each entry has a category (class), and sub-categories (attributes).
The idea is to give more structure to the act of journaling. This project is
really an experiment to see if there is any value in this approach or not.

Build Instructions
==================

Developed under OSX. Requires installations of Postgres, MongoDB, and Neo4j in
order to be run locally. Works with the default settings of Postgres.app, and
homebrew installations of mongodb and neo4j.

To install the dependency nodejs modules, run

```
npm install
```

To set up the postgres database, run:

```
createdb journal
psql -d journal -a -f create_table.sql
```

To run on localhost, first ensure that the the database servers are running on
their default ports. Then start the app running with

```
node app.js
```


Motivating Ideas
================

Journaling has long been viewed as a powerful tool for developing self-awareness,
and as a tool for getting a look at one's self over a period of time. One difficulty
in doing this, however, is that it is difficult to remember what you have written in
the past without explicitly flipping back through all of the pages. This journaling app
address this issue by having an autocomplete feature which reminds you of entry
categories you have used in the past, as well as displaying for you recent entries
from the same category as you write.

