$(function () {
    // 既存：お名前の処理（クリックイベントが不要な場合は削除してもOKですが、元コードに合わせます）
    $('#form-number').click(function () {
        $('#form-name').empty();
        var namelabel = $('input[name="namelabel"]').val();
    });

    // --- カレンダー生成 ---
    let currentBaseDate = new Date();
    const startH = 9, endH = 17; // 9:00 〜 16:30 

    function renderCalendar(baseDate) {
        const $header = $('#dateHeader');
        const $body = $('#timeBody');
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        
        $header.empty().append('<th>時間</th>');
        $body.empty();
        $('#currentMonthDisplay').text((baseDate.getMonth() + 1) + "月");

        let weekDates = [];
        let tempDate = new Date(baseDate);

        for (let i = 0; i < 7; i++) {
            let m = tempDate.getMonth() + 1;
            let d = tempDate.getDate();
            let w = tempDate.getDay();
            let fullDate = `${tempDate.getFullYear()}年${('0'+m).slice(-2)}月${('0'+d).slice(-2)}日`;
            weekDates.push(fullDate);
            let color = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
            $header.append(`<th class="${color}">${d}<br><small>(${days[w]})</small></th>`);
            tempDate.setDate(tempDate.getDate() + 1);
        }

        for (let h = startH; h < endH; h++) {
            [0, 30].forEach(min => {
                let timeStr = `${h}:${('0'+min).slice(-2)}`;
                let row = `<tr><td class="bg-light font-weight-bold">${timeStr}</td>`;
                weekDates.forEach((dateStr) => {
                    let dObj = new Date(dateStr.replace(/年|月/g, '/').replace('日', ''));
                    // 月曜(1) or 第3火曜(2)
                    let isMonday = (dObj.getDay() === 1);
                    let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                    
                    if (isMonday || isThirdTuesday) {
                        row += `<td><span class="symbol-ng">×</span></td>`;
                    } else {
                        row += `<td><div class="time-slot" data-date="${dateStr}" data-time="${timeStr}：00～">
                                    <span class="symbol-ok">〇</span>
                                </div></td>`;
                    }
                });
                $body.append(row + '</tr>');
            });
        }
    }

    renderCalendar(currentBaseDate);

    $('#prevWeek').on('click', function(e){ e.preventDefault(); currentBaseDate.setDate(currentBaseDate.getDate()-7); renderCalendar(currentBaseDate); });
    $('#nextWeek').on('click', function(e){ e.preventDefault(); currentBaseDate.setDate(currentBaseDate.getDate()+7); renderCalendar(currentBaseDate); });

    $(document).on('click', '.time-slot', function() {
        $('.selected-slot').removeClass('selected-slot');
        $(this).addClass('selected-slot');
        $('#selected_date').val($(this).data('date'));
        $('#selected_time').val($(this).data('time'));
    });

    // --- 送信 ---
    $('form').submit(function (e) {
        e.preventDefault();
        var namelabel = $('input[name="namelabel"]').val();
        var date = $('#selected_date').val();
        var minute = $('#selected_time').val();
        var names = $('select[name="names"]').val();
        var inquiries = $('textarea[name="inquiries"]').val();
        
        if(!date || !minute) {
            alert("予約日時を選択してください。");
            return false;
        }
        
        var msg = `＊＊ご予約内容＊＊\nお名前：\n ${namelabel}\n希望日：\n ${date}\n時間：\n ${minute}\nメニュー：\n ${names}\n問い合わせ内容：\n ${inquiries}`;
        sendText(msg);
        return false;
    });
});
