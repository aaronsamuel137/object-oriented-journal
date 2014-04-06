
/*
 * All code interacting with the neo4j database goes in this file
 */

// vars needed for neo4j
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('http://localhost:7474');

var queryCallback = function(err, result) {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Neo4j query result\n %j\n', result);
  }
}

// var checkIfUserHasCategory = function(data, type, mongo_id) {
//   var query = [
//     'MATCH (user:User)-[:HAS_CATEGORY]-(cat)',
//     'WHERE user.mongo_id = {mongo}',
//     'RETURN user, cat'
//   ].join('\n');

//   var params = { mongo: mongo_id };

//   db.query(query, params, function (err, result) {
//     if (err) {
//       console.error('Error:', err);
//     } else {
//       console.log('Neo4j query result %j:', result);

//       // if user doesn't have this category, add the relationship
//       if (result.length == 0) {
//         var query = [
//           'MATCH (user:User)',
//           'WHERE user.mongo_id = {id}',
//           'CREATE (category:Category {data}),',
//           '(user)-[:HAS_CATEGORY]->(category)'
//         ].join('\n');

//         var params = {
//           id: mongo_id,
//           data: {
//             type: type
//           }
//         };

//         db.query(query, params, queryCallback);
//       } else {
//         // TODO: add sub categories to category
//       }
//     }
//   });
// }

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
