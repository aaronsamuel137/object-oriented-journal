/*
 * Edit a journal entry on the front-end by manipulating DOM elements.
 * These edits are pushed to the database when the "Submit Edit" button
 * is clicked.
 */
function editEntry(itemNum) {
  var item = $('#item' + itemNum);
  var itemId = item.find('.invisible').text();
  var key = item.find($('i'));
  var value = item.find($('p span'));

  item.find($('strong')).html('');

  for (var i = 0; i < key.length; i++) {
    var keyTextNode = key[i].firstChild;
    var valueTextNode = value[i].firstChild;
    var keyText = keyTextNode.nodeValue;
    var valueText = valueTextNode.nodeValue;

    var inputDiv = document.createElement('div');
    inputDiv.setAttribute('class', 'col-md-4');

    var textDiv = document.createElement('div');
    textDiv.setAttribute('class', 'col-md-8');

    var input = document.createElement('input');
    input.setAttribute('class', 'form-control');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'new_key' + itemNum  + '-' + i);
    input.setAttribute('value', keyText);

    var textarea = document.createElement('textarea');
    textarea.setAttribute('class', 'form-control');
    textarea.setAttribute('id', 'new_text' + itemNum + '-' + i);

    var text = document.createTextNode(valueText);
    textarea.appendChild(text);

    inputDiv.appendChild(input);
    textDiv.appendChild(textarea);

    key[i].replaceChild(inputDiv, keyTextNode);
    value[i].replaceChild(textDiv, valueTextNode);
  }

  item.append('' +
    '<div class="margins">' +
      '<button class="btn btn-default pull-right" type="button" onclick="submitEdit(' + itemNum + ');">Submit Edit</button>' +
    '</div>');
}

/*
 * Push edits to the database and reload the page
 */
function submitEdit(itemNum) {
  var item = $('#item' + itemNum);
  var itemId = item.find('.invisible').text();
  var numKeys = item.find($('i')).length;

  var params = {entryID: itemId};
  var key;
  var val;
  for (var i = 0; i < numKeys; i++) {
    key = $('#new_key' + itemNum + '-' + i).val();
    val = $('#new_text' + itemNum + '-' + i).val();
    params[key] = val;
  }

  $.post('/edit', params)
    .done(function(data) {
      alert('Success! Entry updated');
      location.reload();
    });
}

/*
 * Delete an entry from the database and the current view. Can't be undone.
 * In the future, maybe add an "Are you sure?" dialog.
 */
function deleteEntry(itemNum) {
  var item = $('#item' + itemNum);
  var itemId = item.find('.invisible').text();
  $.post('/delete', {entryID: itemId});
  item.html('');
}

/*
 * Submit a query, searching for certain kinds of journal entries.
 * Can query by category, sub-category, or full text.
 */
function submitQuery() {
  // remove any html from previous queries
  $('#data').html('');
  $('#header').html('');

  // type is the query text
  var type = $('#type-input').val();

  // queryby is either "category", "sub-category", or "entry text"
  var queryby = $.trim($('#query-by').contents()[0].textContent);

  // get entries in JSON format from the database
  $.getJSON('/fullquery', {type: type, queryby: queryby}, function(data) {

    // sort any returned entries by date
    data.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var items = [];
    var itemNum = 0;
    var innerType = type;

    // add html for every entry to the page
    data.forEach(function(entry) {

      if (entry.data) {
        var date = new Date(entry.date).toString();
        var dateArray = date.split(':');
        date = [dateArray[0], dateArray[1]].join(':');
        items.push('<div id="item' + itemNum + '">');
        items.push('<h4>' + date +
                     '<small><span class="pull-right">' +
                       '<a href="javascript:;" onclick="editEntry(' + itemNum + ');">edit</a> |&nbsp;' +
                       '<a href="javascript:;" onclick="deleteEntry(' + itemNum + ');">delete</a>' +
                   '</span></small></h4><hr>');
        items.push('<span class="invisible">' + entry._id + '</span>');
        items.push('<h4><u>Category</u>: ' + entry.type + '</h4>');
        $.each(entry.data, function(key, val) {
          if (val instanceof Array) {
            console.log('array!');
            for (var i = 0; i < val.length; i++) {
              items.push('<p><b><i>' + key + '</b></i><strong>:&nbsp;</strong><span>' + val[i] + '</span></p>');
            }
          } else {
            items.push('<p><b><i>' + key + '</b></i><strong>:&nbsp;</strong><span>' + val + '</span></p>');
          }
        });
        items.push('<br>');
        items.push('</div>');
        itemNum++;
      }
    });

    $('#header').append('<h3><i>' + queryby + '</i>: ' + type + '</h3>');
    $('#data').append(
      $( "<ul/>", {
        "class": "my-new-list",
        html: items.join( "" )
      })
    );

  });
  return false;
}

$().ready(function() {

  $('#category').click(function() {
    $('#query-by').contents()[0].textContent = 'category ';
    return false;
  });

  $('#sub-category').click(function(){
    $('#query-by').contents()[0].textContent = 'sub-category ';
    return false;
  });

  $('#entry-text').click(function(){
    $('#query-by').contents()[0].textContent = 'entry text ';
    return false;
  });

  // helper method
  function split( val ) {
    return val.split(/,\s*/);
  }

  // set up the autocomplete widget
  function autocomplete(symbol) {
    var availableTags = symbol.names;
    for (var key in symbol.types) {
      console.log(key);
      if (symbol.types[key] !== null) {
        for (var i = 0; i < symbol.types[key].length; i++) {
          availableTags.push(symbol.types[key][i]);
        }
      }
    }
    console.log(availableTags);

    $("#type-input")
      .autocomplete({
        position: {my: "left top", at: "right top"},
        minLength: 0,
        source: availableTags,
        select: function(event, ui) {
          $("#type-input").val(ui.item.value);
          submitQuery();
          return false;
        },
      })
      .focus(function() {
        $(this).autocomplete("search", "");
      })
  }

  $.getJSON('/data', function(data) {
    console.log(data);
    autocomplete(data);
  });
});