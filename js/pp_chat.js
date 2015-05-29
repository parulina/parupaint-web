

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
            msg =   $(this).val()+ch,
            ll =    $(this).val().length;
        if(c == 13) {
            msg += '\n ';
        }
        if(e.keyCode == 13 && !e.shiftKey){
            if(ll){
                if(PP.IsConnected()){
                    PP.Emit('chat', {
                        message: msg
                    })
                } else {
                    pthis.Message({
                        msg: msg,
                        name: PP.Cursor().Name()
                    })
                }
                $(this).val((msg = ''));
                pthis.SetChatinputExpandable(msg);
            }
            $(this).blur();
            return false;
        }
        pthis.SetChatinputExpandable(msg);

    }).on('keydown', function(e){
        console.log(e.keyCode)
        if(e.keyCode == 27 || e.keyCode == 9){
            $(this).blur();
            return false;
        }
    }).on('focus', function(e){
        $(this).closest('.chat-input-box').addClass('focused');
    }).on('blur', function(e){
        $(this).closest('.chat-input-box').removeClass('focused');
    });

    this.pushEntry = function(entry){
        if(typeof entry == "object" && entry.length){
            var h = $('.chat-content').append(entry).prop('scrollHeight');
            $('.chat-content').scrollTop(h);
        }
    }
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

                    content.children().last().remove();
                    last.append(message);
                    this.pushEntry(last);
                    return;
                }
            }

            var entry = $('<div />', {
                class: 'chat-entry',
                html: message
            });
            if(typeof d.name == "string") entry.attr('data-name', d.name);

            return this.pushEntry(entry);

        }

    }

}
