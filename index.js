$(function () {
    // ★重要：ここにデプロイしたGASのウェブアプリURLを貼り付けてください
    const gasUrl = "https://script.google.com/macros/s/AKfycbyLhGqKDt_jActqjvbyih9uQXYhYYzBkY_AuJTtdeahZ5lP9YGtRbi13NuwX31EwQKY/exec";

    // 既存：お名前の処理
    $('#form-number').click(function () {
        $('#form-name').empty();
        var namelabel = $('input[name="namelabel"]').val();
    });

    // --- カレンダー生成ロジック ---
    let currentBaseDate = new Date();
    // 日曜日から始まるように調整
    currentBaseDate.setDate(currentBaseDate.getDate() - currentBaseDate.getDay());

    const startH = 9;  // 開始 9:00
    const endH = 17;   // 終了 16:00

    function renderCalendar(baseDate) {
        // GASから予約済みリストを取得 (非同期通信)
        $.getJSON(gasUrl, function(reservedList) {
            const $header = $('#dateHeader');
            const $body = $('#timeBody');
            const days = ['日', '月', '火', '水', '木', '金', '土'];
            const now = new Date(); // 今の時刻（過去判定用）
            
            $header.empty().append('<th>時間</th>');
            $body.empty();
            
            // カレンダーに表示されている期間の「月」を表示
            let monthText = (baseDate.getMonth() + 1) + "月";
            $('#currentMonthDisplay').text(monthText);

            let weekDates = [];
            let tempDate = new Date(baseDate);

            // 7日分のヘッダー作成
            for (let i = 0; i < 7; i++) {
                let m = tempDate.getMonth() + 1;
                let d = tempDate.getDate();
                let w = tempDate.getDay();
                let fullDate = `${tempDate.getFullYear()}/${m}/${d}`; // 判定用
                let displayDate = `${tempDate.getFullYear()}年${('0'+m).slice(-2)}月${('0'+d).slice(-2)}日`;
                
                weekDates.push({ fullDate: fullDate, displayDate: displayDate });
                
                let color = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
                $header.append(`<th class="${color}">${d}<br><small>(${days[w]})</small></th>`);
                tempDate.setDate(tempDate.getDate() + 1);
            }

            // 時間枠（1時間刻み）の作成
            for (let h = startH; h < endH; h++) {
                let timeStr = `${h}:00`;
                let timeLabel = `${h}：00～`; // 送信用ラベル
                let row = `<tr><td class="bg-light font-weight-bold">${h}:00</td>`;
                
                weekDates.forEach((dateObj) => {
                    let dObj = new Date(dateObj.fullDate + " " + timeStr);
                    
                    // 1. 定休日判定（毎週月曜・第三火曜）
                    let isMonday = (dObj.getDay() === 1);
                    let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                    
                    // 2. 過去判定（今日より前、または今日の過ぎた時間）
                    let isPast = (dObj < now);

                    // 3. 予約済み判定（GASから取得したリストにあるか）
                    // checkKeyはスプレッドシートの保存形式（例：2026年01月11日10：00～）に合わせる
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
            // 通信エラー時（URL間違いやGAS側の権限設定ミスなど）
            console.error("予約状況の取得に失敗しました");
            alert("予約状況の読み込みに失敗しました。時間をおいて再度お試しください。");
        });
    }

    // 初回描画
    renderCalendar(currentBaseDate);

    // 週切り替えボタン
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

    // 日時選択時の動作
    $(document).on('click', '.time-slot', function() {
        $('.selected-slot').removeClass('selected-slot');
        $(this).addClass('selected-slot');
        $('#selected_date').val($(this).data('date'));
        $('#selected_time').val($(this).data('time'));
    });

    // 送信
    $('form').submit(function (e) {
        e.preventDefault();
        
        // 入力値取得
        var namelabel = $('input[name="namelabel"]').val();
        var date = $('#selected_date').val();
        var minute = $('#selected_time').val();
        var names = $('select[name="names"]').val();
        var inquiries = $('textarea[name="inquiries"]').val();
        
        if(!date || !minute) {
            alert("予約日時を選択してください");
            return false;
        }

        // 送信ボタンを無効化（連打防止）
        var $submitBtn = $(this).find('input[type="submit"]');
        $submitBtn.prop('disabled', true).val('送信中...');

        // スプレッドシートへ送るデータ
        var sendData = {
            date: date,
            minute: minute,
            name: namelabel,
            menu: names,
            inquiries: inquiries
        };

        // GASへ送信（書き込み）
        $.ajax({
            type: 'POST',
            url: gasUrl,
            data: JSON.stringify(sendData),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                // 書き込み成功後にLINE送信
                var msg = `＊＊ご予約内容＊＊\nお名前：\n ${namelabel}\n希望日：\n ${date}\n時間：\n ${minute}\nメニュー：\n ${names}\n問い合わせ内容：\n ${inquiries}`;
                sendText(msg);
                alert("予約が完了しました！");
            },
            error: function() {
                alert("通信エラーが発生しました。もう一度お試しください。");
                $submitBtn.prop('disabled', false).val('送信');
            }
        });

        return false;
    });
});
