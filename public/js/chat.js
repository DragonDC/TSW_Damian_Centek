$(document).ready(function(){
  
    var socket = io.connect();

    socket.on('chat', function (data) {
        var hour = new Date(data.hour);
        $('#content').append(
            $('<li></li>').append(
           
                $('<span>').text('[' +
                    (hour.getHours() < 10 ? '0' + hour.getHours() : hour.getHours())
                    + ':' +
                    (hour.getMinutes() < 10 ? '0' + hour.getMinutes() : hour.getMinutes())
                    + '] '
                ),

                $('<b>').text(typeof(data.name) != 'undefined' ? data.name + ': ' : ''),

                $('<span>').text(data.text))
        );

        $('body').scrollTop($('body')[0].scrollHeight);
    });

    function senden(){
 
        var name = $('#name').val();
        var text = $('#text').val();
 
        socket.emit('chat', { name: name, text: text });

        $('#text').val('');
    }
    
    $('#senden').click(senden);

    $('#text').keypress(function (e) {
        if (e.which == 13) {
            senden();
        }
    });
});