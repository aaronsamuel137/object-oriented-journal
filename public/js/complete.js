// var symbol = {
//   types: {
//     'judgment': ['toward', 'trigger', 'reason'],
//     'reaction': ['toward', 'trigger', 'reason'],
//     'intention': ['to', 'by', 'because']
//   },
//   names: [
//     'judgment',
//     'reaction',
//     'intention'
//   ]
// };

var next = 0;

function newInput(arg) {
  var inputID = arg + '-id';
  var rowID = arg + '-row-id'
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

function newField(arg) {
  $('#inner').append('' +
    '<div id="new-holder" class="form-group">' +
      '<input type="text" class="form-control" id="new" placeholder="Enter new field name">' +
    '</div>'
  );
  $('#new')
    .bind('keydown', function(event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        $(newInput($('#new').val())).insertBefore('#new-holder');
        $('#new').val('');
      }
    });
}

function submitForm() {
  $('#form').submit();
}

$().ready(function() {

  function split( val ) {
    return val.split(/,\s*/);
  }
  function extractLast(term) {
    return split(term).pop();
  }

  // function newButton(arg) {
  //     return '' +
  //     '<div class="form-group">' +
  //         '<div class="col-sm-offset-2 col-sm-10">' +
  //             '<button type="button" onclick="newInput(' + arg +')" class="btn btn-default">New</button>' +
  //         '</div>' +
  //     '</div>';
  // }

  function autocomplete(symbol) {
    var availableTags = symbol.names;

    $("#field")
      .autocomplete({
        position: {my: "left top", at: "right top"},
        minLength: 0,
        source: function(request, response) {
          // delegate back to autocomplete, but extract the last term
          response($.ui.autocomplete.filter(availableTags, extractLast(request.term)));
        },
        select: function(event, ui) {
          var val = ui.item.value;
          var attrs = symbol.types[val];
          var div = document.createElement('div');
          div.class = 'inner';
          div.id = 'inner';
          $('#fields').append(div);
          // div.insertBefore('#submit');
          for (var i = 0; i < attrs.length; i++) {
            $('#inner').append(newInput(attrs[i]));
          };
          newField();
          var joined = attrs.join(':\n\t');
          this.value = val + ': {\n\t' + joined + '\n}';
          this.value = val;
          return false;
        },
      })
      .focus(function() {
        $(this).autocomplete("search", "");
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
      // var items = [];
      // $.each( data, function( key, val ) {
      //   items.push( "<li id='" + key + "'>" + val + "</li>" );
      // });

      // $( "<ul/>", {
      //   "class": "my-new-list",
      //   html: items.join( "" )
      // }).appendTo( "body" );
  });
})