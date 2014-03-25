function editEntry(itemNum) {
  var item = $('#item' + itemNum);
  var itemId = item.find('.invisible').text();
  var key = item.find($('i'));
  var value = item.find($('p span'));

  for (var i = 0; i < key.length; i++) {
    var keyTextNode = key[i].firstChild;
    var valueTextNode = value[i].firstChild;
    var keyText = keyTextNode.nodeValue;
    var valueText = valueTextNode.nodeValue;

    var input = document.createElement('input');
    input.setAttribute('class', 'form-control');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'new_key');
    input.setAttribute('placeholder', keyText);

    var textarea = document.createElement('textarea');
    textarea.setAttribute('class', 'form-control');
    textarea.setAttribute('id', 'new_text');

    var text = document.createTextNode(valueText);
    textarea.appendChild(text);

    key[i].replaceChild(input, keyTextNode);
    value[i].replaceChild(textarea, valueTextNode);
  }
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
  console.log("submit called");
  $.getJSON('/similar', {type: type}, function(data) {

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
          items.push('<p><b><i>' + key + '</b></i>:&nbsp;<span>' + val + '</span></p>');
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
    // helper methods
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