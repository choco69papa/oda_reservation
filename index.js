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
    showButtonPanel: false,
    onSelect: function(dateText, inst) {
      // 日付の選択時に時刻セレクトボックスを更新
      updateSelectOptions(inst.input);
    },
    onClose: function(dateText, inst) {
      // カレンダーを閉じた時に時刻セレクトボックスを更新
      updateSelectOptions(inst.input);
    }
  });

  // 時刻セレクトボックスのオプションを更新する関数
  function updateSelectOptions(input) {
    var selectedDate = $.datepicker.parseDate('yy年mm月dd日', input.value);
    var startHour = 9; // 開始時刻（9時）
    var endHour = 16; // 終了時刻（16時）
    var stepMinutes = 60; // 間隔（1時間）

    // 時刻セレクトボックスをクリア
    $(input).next('.ui-timepicker-select').empty();

    // 開始時刻から終了時刻までのオプションを追加
    for (var hour = startHour; hour <= endHour; hour++) {
      for (var minute = 0; minute < 60; minute += stepMinutes) {
        var time = ('0' + hour).slice(-2) + ':' + ('0' + minute).slice(-2);
        $(input).next('.ui-timepicker-select').append($('<option>').val(time).text(time));
      }
    }
  }
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
