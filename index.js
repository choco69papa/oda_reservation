$(function () {
    // カレンダー
$(function() {
  $('input[name="dattes"]').datepicker({
    dateFormat: 'yy年mm月dd日',
    minDate: 0,
    beforeShowDay: function(date) {
      var day = date.getDay();
      var weekOfMonth = Math.ceil((date.getDate() - 1) / 7);
      var nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      if ((day === 1 || (day === 2 && weekOfMonth === 3)) && date.getMonth() === nextMonth.getMonth()) {
        return [false];
      } else {
        return [true];
      }
    }
  }).on('show', function(event, ui) {
    var widget = $(this).datepicker('widget');
    var nextMonthButton = widget.find('.ui-datepicker-next');
    nextMonthButton.on('click', function() {
      setTimeout(function() {
        updateNextMonthRestrictions(widget);
      }, 0);
    });
    updateNextMonthRestrictions(widget);
  });

  function updateNextMonthRestrictions(widget) {
    var nextMonthTd = widget.find('.ui-datepicker-next').closest('td');
    var nextMonthLink = nextMonthTd.find('a');
    var nextMonth = new Date(nextMonthLink.data('year'), nextMonthLink.data('month'), 1);
    var nextMonthDays = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
    var nextMonthRestrictions = [];
    for (var i = 1; i <= nextMonthDays; i++) {
      var date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
      if (isDateSelectable(date)) {
        nextMonthRestrictions.push(true);
      } else {
        nextMonthRestrictions.push(false);
      }
    }
    nextMonthLink.data('dateRestrictions', nextMonthRestrictions.join(','));
  }

  function isDateSelectable(date) {
    var day = date.getDay();
    var weekOfMonth = Math.ceil((date.getDate() - 1) / 7);
    var nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    if ((day === 1 || (day === 2 && weekOfMonth === 3))





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
