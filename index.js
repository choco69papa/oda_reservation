$(function () {
    $('input[name="date"]').datepicker({
        dateFormat: 'yy年mm月dd日',
        minDate: 0,
        beforeShowDay: function(date) {
            // 曜日を取得
            var dayOfWeek = date.getDay();
            // 月曜日または第3火曜日の場合、選択不可にする
            if (dayOfWeek === 1 || (dayOfWeek === 2 && Math.floor((date.getDate() - 1) / 7) === 2)) {
                return [false];
            } else {
                return [true];
            }
        }
    });
});



    // 予約フォームを表示する
    $('#form-number').click(function () {
        $('#form-name').empty();
        var date = $('input[name="date"]').val();
        var num = $('input[name="number"]:checked').val();
        var minute = $('select[name="minute"]').val();
        var names = $('select[name="names"]').val();
        var inquiries = $('textarea[name="inquiries"]').val();
    });
	

    // 送信
    $('form').submit(function () {
        var date = $('input[name="date"]').val();
        var number = $('input[name="number"]:checked').val();	
        var minute = $('select[name="minute"]').val();
        var names = $('select[name="names"]').val();
        var inquiries = $('textarea[name="inquiries"]').val();
	    
        var msg = `希望日： \n ${date}\n時間： \n ${minute}\nメニュー： \n ${names}\n問い合わせ内容：\n ${inquiries}`;
        sendText(msg);

        return false;
    });
	
});
