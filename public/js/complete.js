var selectCalled = false; // set to true if autocomplete's select is called

function newInput(arg) {
  var inputID = toID(arg);
  var rowID = toRowID(arg);
  return '' +
  '<div id="' + rowID + '" class="form-group">' +
    '<label class="col-sm-2 control-label" for="' + inputID + '">' + arg + '</label>' +
    '<div class="col-sm-9">' +
      '<input type="text" class="form-control" id="' + inputID + '" name="' + arg + '">' +
    '</div>' +
    '<div class="col-sm-1">' +
      '<button type="button" onclick="$(\'#' + rowID + '\').remove();">X</button>' +
    '</div>' +
  '</div>';
}

function newField() {
  if ($('#new').length) { // new input already exists, and we only want one existing
    return;
  }

  // append new input field
  $('#inner').append('' +
    '<div id="new-holder" class="form-group">' +
      '<input type="text" class="form-control" id="new" placeholder="Enter new field name">' +
    '</div>'
  );

  // capture enter key for new input field
  $('#new')
    .bind('keydown', function(event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        var newInputName = $('#new').val();

        if (newInputName != '') {
          $(newInput(newInputName)).insertBefore('#new-holder');
          $('#new').val('');
          $('#' + toID(newInputName)).focus();
          $('#' + toID(newInputName)).bind('keydown', function(event) {
            if (event.keyCode === 13) {
              $('#new').focus();
            }
          })
        }
      }
    });
}

function submitForm() {
  $('#form-submit').submit();
}

function toID(string) {
  return string.replace(/\s+/, '') + '-id';
}

function toRowID(string) {
  return string.replace(/\s+/, '') + '-row-id';
}

function loadSimilar(type) {
  $.getJSON('/similar', {type: type}, function(data) {
    data.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    var items = [];
    data.forEach(function(entry) {
      var date = new Date(entry.date).toString();
      var dateArray = date.split(':');
      date = [dateArray[0], dateArray[1]].join(':');
      // var dateStr = (date.getMonth()+1) + '-' + date.getDate() + ' at ' + date.getHours() + ':' + date.getMinutes();
      items.push('<h4>' + date + '</h4><h4>' + entry.type + '</h4>');
      $.each(entry.data, function(key, val) {
        items.push('<h5>' + key + ': <p>' + val + '</p></h5>');
      });
    });

    $('#similar').append(
      $( "<ul/>", {
        "class": "my-new-list",
        html: items.join( "" )
      })
    );

    console.log(data);
  });
}

$().ready(function() {

  // set escape key to reload page, thus reseting the new entry fields
  $(document).keyup(function(e) {
    if (e.keyCode == 27) {
      location.reload();
    }
  })

  // helper methods
  function split( val ) {
    return val.split(/,\s*/);
  }
  function extractLast(term) {
    return split(term).pop();
  }

  // set up the autocomplete widget
  function autocomplete(symbol) {
    var availableTags = symbol.names;

    $("#type-input")
      .autocomplete({
        position: {my: "left top", at: "right top"},
        minLength: 0,
        // source: function(request, response) {
        //   // delegate back to autocomplete, but extract the last term
        //   response($.ui.autocomplete.filter(availableTags, extractLast(request.term)));
        // },
        source: availableTags,
        select: function(event, ui) {
          selectCalled = true;

          var val = ui.item.value;
          var attrs = symbol.types[val];
          console.log(attrs);

          if (attrs) {

            var bindEm = function(attrs, i) {
              console.log('binding ' + attrs[i]);
              $('#' + toID(attrs[i])).bind('keydown', function(event) {
                if (event.keyCode === 13) {
                  event.preventDefault();
                  console.log('pressed enter in %s', attrs[i]);
                  if (attrs[i+1])
                    $('#' + toID(attrs[i+1])).focus();
                  else
                    $('#new').focus();
                }
              });
            };

            for (var i = 0; i < attrs.length; i++) {
              $('#inner').append(newInput(attrs[i]));
              console.log(attrs[i]);
              bindEm(attrs, i);
            }

            $('#' + toID(attrs[0])).focus();
            console.log('should have focused');
            $('#type-input').prop('readonly', true);
            loadSimilar(val);
          }
          if ($('#type-input').val() != '') {
            newField();
          }
          var joined = attrs.join(':\n\t');
          this.value = val + ': {\n\t' + joined + '\n}';
          this.value = val;
          return false;
        },
      })
      .focus(function() {
        $(this).autocomplete("search", "");
      })
      .bind('keydown', function(event) {
        if (event.keyCode === 13 || event.keyCode === 9) {
          event.preventDefault();

          if (!selectCalled) {
            var typeValue = $('#type-input').val();
            if (typeValue != '') {
              newField();
              $('#new').focus();
              // .disabled(true);
              $('#type-input').prop('readonly', true);
              loadSimilar(typeValue);
              console.log('focusing on new');
            }
          }
        }
      });
      // .bind( "keydown", function( event ) {
      //     if ( event.keyCode === $.ui.keyCode.TAB &&
      //         $( this ).data( "ui-autocomplete" ).menu.active ) {
      //             event.preventDefault();
      //         }
      // });
  }

  $.getJSON('/data', function(data) {
    console.log(data);
    autocomplete(data);
  });
});