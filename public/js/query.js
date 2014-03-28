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

function submitEdit(itemNum) {
  console.log('edit called with ' + itemNum);
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

function deleteEntry(itemNum) {
  var item = $('#item' + itemNum);
  var itemId = item.find('.invisible').text();
  $.post('/delete', {entryID: itemId});
  item.html('');
}

function submitQuery() {
  $('#data').html('');
  $('#header').html('');
  var type = $('#type-input').val();
  var queryby = $.trim($('#query-by').contents()[0].textContent);
  console.log(queryby);
  console.log("submit called");
  $.getJSON('/similar', {type: type, queryby: queryby}, function(data) {

    data.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var items = [];
    var itemNum = 0;
    var innerType = type;

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

    $('#header').append('<h3>' + type + '</h3>');
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
    for (var i = 0; i < availableTags.length; i++) {
      if (availableTags[i] === null) {
        availableTags.splice(i, 1);
      }
      if (availableTags[i] === null) {
        availableTags.splice(i, 1);
      }
    }
    console.log(availableTags);

    $("#type-input")
      .autocomplete({
        position: {my: "left top", at: "right top"},
        minLength: 0,
        source: availableTags,
        select: function(event, ui) {
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