$(function () {
    // カレンダー
    $(function() {
      $('input[name="date"]').datepicker({
        dateFormat: 'yy年mm月dd日',
        minDate: 0,
        beforeShowDay: function(date) {
          var day = date.getDay();
          var weekOfMonth = Math.ceil((date.getDate() - 5) / 7);
          if (day === 5 || (day === 2 && weekOfMonth === 3)) {
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
