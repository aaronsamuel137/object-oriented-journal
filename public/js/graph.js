$().ready(function() {
  $.getJSON('/graphdata', function(data) {

    var links = [];
    var username, category, subcategory;
    var prevCategory = 'null';
    for (var i = 0; i < data.length; i++) {

      username = data[i].user._data.data.name;
      category = data[i].cat._data.data.type;
      subcategory = data[i].subcat._data.data.type;

      if (category !== prevCategory) {
        links.push({
          source: username,
          target: category,
          type: 'has_category'
        });
      }

      prevCategory = category;

      links.push({
        source: category,
        target: subcategory,
        type: 'has_sub-category'
      });

    }
    makeGraph(links);
  });
});

/*
 * The following code is adapted from http://jsfiddle.net/7HZcR/3/
 */
function makeGraph(links) {

  //sort links by source, then target
  links.sort(function(a,b) {
      if (a.source > b.source) {return 1;}
      else if (a.source < b.source) {return -1;}
      else {
          if (a.target > b.target) {return 1;}
          if (a.target < b.target) {return -1;}
          else {return 0;}
      }
  });
  //any links with duplicate source and target get an incremented 'linknum'
  for (var i=0; i<links.length; i++) {
      if (i != 0 &&
          links[i].source == links[i-1].source &&
          links[i].target == links[i-1].target) {
              links[i].linknum = links[i-1].linknum + 1;
          }
      else {links[i].linknum = 1;};
  };

  var nodes = {};

  // Compute the distinct nodes from the links.
  links.forEach(function(link) {
    link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
  });

  var w = 600,
      h = 600;

  var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([w, h])
      .linkDistance(60)
      .charge(-300)
      .on("tick", tick)
      .start();

  var svg = d3.select("body").append("svg:svg")
      .attr("width", w)
      .attr("height", h);

  // Per-type markers, as they don't inherit styles.
  svg.append("svg:defs").selectAll("marker")
      .data(["has_category", "has_sub-category"])
    .enter().append("svg:marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -1.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

  var path = svg.append("svg:g").selectAll("path")
      .data(force.links())
    .enter().append("svg:path")
      .attr("class", function(d) { return "link " + d.type; })
      .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

  var circle = svg.append("svg:g").selectAll("circle")
      .data(force.nodes())
    .enter().append("svg:circle")
      .attr("r", 6)
      .call(force.drag);

  var text = svg.append("svg:g").selectAll("g")
      .data(force.nodes())
    .enter().append("svg:g");

  // A copy of the text with a thick white stroke for legibility.
  text.append("svg:text")
      .attr("x", 8)
      .attr("y", ".31em")
      .attr("class", "shadow")
      .text(function(d) { return d.name; });

  text.append("svg:text")
      .attr("x", 8)
      .attr("y", ".31em")
      .text(function(d) { return d.name; });

  // Use elliptical arc path segments to doubly-encode directionality.
  function tick() {
    path.attr("d", function(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = 75/d.linknum;  //linknum is defined above
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    });

    circle.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

    text.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }
};
