$(function () {
    // ★重要：デプロイしたウェブアプリのURLをここに貼り付けてください
    const gasUrl = "https://script.google.com/macros/s/AKfycby6JBfxawHzVC2L_CTu0Lst1kHdhzkp4cWBLbg96N_u2lAtPBd2v1BpbD9vrvzftwp-/exec";

    // 既存：お名前の処理
    $('#form-number').click(function () {
        $('#form-name').empty();
        var namelabel = $('input[name="namelabel"]').val();
    });

    // --- カレンダー生成ロジック ---
    let currentBaseDate = new Date();
    currentBaseDate.setDate(currentBaseDate.getDate() - currentBaseDate.getDay());

    const startH = 9;  // 開始 9:00
    const endH = 17;   // 終了 16:00

    function renderCalendar(baseDate) {
        // GASから予約済みリストを取得してから描画を開始する
        $.getJSON(gasUrl, function(reservedList) {
            const $header = $('#dateHeader');
            const $body = $('#timeBody');
            const days = ['日', '月', '火', '水', '木', '金', '土'];
            const now = new Date(); 
            
            $header.empty().append('<th>時間</th>');
            $body.empty();
            
            let monthText = (baseDate.getMonth() + 1) + "月";
            $('#currentMonthDisplay').text(monthText);

            let weekDates = [];
            let tempDate = new Date(baseDate);

            for (let i = 0; i < 7; i++) {
                let m = tempDate.getMonth() + 1;
                let d = tempDate.getDate();
                let w = tempDate.getDay();
                let fullDate = `${tempDate.getFullYear()}/${m}/${d}`; 
                let displayDate = `${tempDate.getFullYear()}年${('0'+m).slice(-2)}月${('0'+d).slice(-2)}日`;
                
                weekDates.push({ fullDate: fullDate, displayDate: displayDate });
                
                let color = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
                $header.append(`<th class="${color}">${d}<br><small>(${days[w]})</small></th>`);
                tempDate.setDate(tempDate.getDate() + 1);
            }

            for (let h = startH; h < endH; h++) {
                let timeStr = `${h}:00`;
                let timeLabel = `${h}：00～`; 
                let row = `<tr><td class="bg-light font-weight-bold">${h}:00</td>`;
                
                weekDates.forEach((dateObj) => {
                    let dObj = new Date(dateObj.fullDate + " " + timeStr);
                    
                    // 1. 定休日判定
                    let isMonday = (dObj.getDay() === 1);
                    let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                    
                    // 2. 過去判定
                    let isPast = (dObj < now);

                    // 3. ★予約済み判定（スプレッドシートにあるか）
                    // reservedListには「日付+時間」の形式でデータが入っている想定
                    let checkKey = dateObj.displayDate + timeLabel;
                    let isReserved = reservedList.includes(checkKey);

                    if (isMonday || isThirdTuesday || isPast || isReserved) {
                        row += `<td><span class="symbol-ng">×</span></td>`;
                    } else {
                        row += `<td><div class="time-slot" data-date="${dateObj.displayDate}" data-time="${timeLabel}">
                                    <span class="symbol-ok">〇</span>
                                </div></td>`;
                    }
                });
                $body.append(row + '</tr>');
            }
        }).fail(function() {
            // エラー時の処理
            alert("予約状況の取得に失敗しました。時間をおいて再度お試しください。");
        });
    }

    // 初回描画
    renderCalendar(currentBaseDate);

    // 週切り替え
    $('#prevWeek').on('click', function(e){ 
        e.preventDefault(); 
        currentBaseDate.setDate(currentBaseDate.getDate() - 7); 
        renderCalendar(currentBaseDate); 
    });
    $('#nextWeek').on('click', function(e){ 
        e.preventDefault(); 
        currentBaseDate.setDate(currentBaseDate.getDate() + 7); 
        renderCalendar(currentBaseDate); 
    });

    // 日時選択
    $(document).on('click', '.time-slot', function() {
        $('.selected-slot').removeClass('selected-slot');
        $(this).addClass('selected-slot');
        $('#selected_date').val($(this).data('date'));
        $('#selected_time').val($(this).data('time'));
    });

    // 送信
    $('form').submit(function (e) {
        e.preventDefault();
        var namelabel = $('input[name="namelabel"]').val();
        var date = $('#selected_date').val();
        var minute = $('#selected_time').val();
        var names = $('select[name="names"]').val();
        var inquiries = $('textarea[name="inquiries"]').val();
        
        if(!date || !minute) {
            alert("予約日時を選択してください");
            return false;
        }

        var msg = `＊＊ご予約内容＊＊\nお名前：\n ${namelabel}\n希望日：\n ${date}\n時間：\n ${minute}\nメニュー：\n ${names}\n問い合わせ内容：\n ${inquiries}`;
        sendText(msg);
        return false;
    });
});
