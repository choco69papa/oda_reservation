$(function () {
    // カレンダー
$(function() {
  $('input[name="date"]').datetimepicker({
    dateFormat: 'yy年mm月dd日',
    minDate: 0,
    beforeShowDay: function(date) {
      var day = date.getDay();
      if (day === 1 || (day === 2 && Math.ceil(date.getDate() / 7) === 3)) {
        return [false];
      } else {
        return [true];
      }
    },
    timeFormat: 'HH:mm',
    controlType: 'select',
    oneLine: true,
    stepMinutes: 60, // 1時間ごとに設定
    minTime: '9:00', // 最小時刻
    maxTime: '16:00' // 最大時刻
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
	    
        var msg = `＊＊ご予約内容＊＊\n希望日： \n ${date}\n時間： \n ${minute}\nメニュー： \n ${names}\n問い合わせ内容：\n ${inquiries}`;
        sendText(msg);

        return false;
    });
	
});
