
/*
 * All code interacting with the neo4j database goes in this file
 */

// vars needed for neo4j
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');

/*
 * Generic callback for neo4j queries
 */
var queryCallback = function(err, result) {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Neo4j query result\n %j\n', result);
  }
}

/*
 * Add a user to the neo4j database. Adds a single node in the category User,
 * and no relationships. Called when a user if first created.
 */
exports.addUserToNeo4j = function(username, mongo_id) {
  var query = [
    'CREATE (user:User {data})',
    'RETURN user'
  ].join('\n');

  var params = {
    data: {
      name: username,
      mongo_id: mongo_id
    }
  };

  db.query(query, params, queryCallback);
}

/*
 * This method is called when a new journal entry is written. It creates new
 * nodes for category and sub-category names if they do not exist already, and
 * it creates edges between the user and categories, and between the categories
 * and sub-categories.
 */
exports.addEntryEdge = function(data, type, mongo_id) {
  var query = [
    'MATCH (user:User)',
    'WHERE user.mongo_id = {id}',
    'CREATE UNIQUE (user)-[:HAS_CATEGORY]->(category:Category {data}),'
  ];

  var i = 0;
  for (var subcategory in data) {
    query.push('(category)-[:HAS_SUBCATEGORY]->(subcat' + i + ':SubCategory {type: "' + subcategory + '"}),');
    i++;
  }
  var last = query.length - 1;
  query[last] = query[last].substring(0, query[last].length - 1);
  query.push('RETURN user, category');

  query = query.join('\n');
  console.log('running query:\n', query);

  var params = {
    id: mongo_id,
    data: {
      type: type
    }
  };

  db.query(query, params, queryCallback);
}

/*
 * Send JSON data for all connections to a given user (categories and subcategories of entries)
 */
exports.graphData = function(res, mongo_id) {

  var query = [
    'MATCH (user:User)-[r1:HAS_CATEGORY]->(cat:Category)-[r2:HAS_SUBCATEGORY]->(subcat)',
    'WHERE user.mongo_id = {id}',
    'RETURN user, cat, subcat, r1, r2'
  ].join('\n');

  var params = { id: mongo_id };

  db.query(query, params, function (err, result) {
    if (err)
      console.log("error in neo4j query!");
    else {
      res.send(result);
    }
  });
}
