

var ParupaintChat = function(){

    this.notifyTimeout = null;

    this.SetNotifyTimeout = function(t){
        if(t && !this.notifyTimeout){
            // idk make something dynamic here
        }
    }
    this.SetChatinputExpandable = function(s){
        $('.chat-input-box .ci-size').text(s);
    }

    var pthis = this;
    $('textarea.chat-input').keypress(function(e){
        var c =     e.which || e.keyCode,
            ch =    String.fromCharCode(c),
            msg =   $(this).val()+ch;
        if(c == 13) {
            msg += '\n ';
        }
        if(e.keyCode == 13 && !e.shiftKey){

            if(PP.IsConnected()){
                PP.Emit('chat', {
                    msg: msg
                })
            } else {
                pthis.Message({
                    msg: msg
                })
            }
            $(this).val((msg = ''));
            pthis.SetChatinputExpandable(msg);
            return false;
        }
        pthis.SetChatinputExpandable(msg);

    }).on('focus', function(e){
        //PP.ui.ShowOverlay(true);
    });

    this.Message = function(d){
        // d.name (if null, assume system)
        // d.time (if null, assume now)
        // d.msg (if null, don't do anything)
        // todo if message is null, make cursor blink?
        // in main.js ofc

        if(typeof d.msg == "string"){
            var content = $('.chat-content');

            var htmlsafe = d.msg.replace(new RegExp('\r?\n','g'), '<br />');
            if(!htmlsafe.length) {
                return false;
            }

            var time = new Date().toISOString().
                replace(/.*T/,'').replace(/\..*/, '');
            if(typeof d.time == "string"){
                time = d.time;
            }

            var message = $('<div />', {
                class: 'chat-message',
                html: htmlsafe,
                'data-time': time
            });
            // ok message done
            if(typeof d.name == "string"){
                var last = content.children().last();
                if(last.data('name') == d.name){
                    return last.append(message);
                }
            }

            var entry = $('<div />', {
                class: 'chat-entry',
                html: message
            });
            if(typeof d.name == "string") entry.attr('data-name', d.name);

            return content.append(entry);

        }

    }

}
