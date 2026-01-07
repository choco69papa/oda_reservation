// ▼▼▼ 以下2行を必ずご自身のものに書き換えてください ▼▼▼
const GAS_URL = "https://script.google.com/macros/s/AKfycbzbMVsrdEcxcyJtHNYZWwC0BzkdYSKGO8cvnLogsDqQtyTbMI33Ztu2k3g4c0JEJBs2/exec";
const MY_LIFF_ID = "https://liff.line.me/1657883881-JG16djMv";
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

$(function () {
    // LIFF初期化
    liff.init({ liffId: MY_LIFF_ID }).then(() => {
        // 初期化成功
        console.log("LIFF initialized");
    }).catch((err) => {
        console.log("LIFF initialization failed", err);
    });

    // 予約済みリスト格納用
    let bookedSlots = [];

    // --- カレンダー設定 ---
    let currentBaseDate = new Date();
    // 日曜始まりに調整
    currentBaseDate.setDate(currentBaseDate.getDate() - currentBaseDate.getDay());

    const startH = 9;  // 開始時間
    const endH = 17;   // 終了時間

    // --- ページ読み込み時に予約状況を取得 ---
    fetch(GAS_URL)
        .then(response => response.json())
        .then(data => {
            bookedSlots = data; // ["2026年01月07日_10：00～", ...] の形式
            renderCalendar(currentBaseDate); // カレンダー再描画
            $('#loading').fadeOut(); // ローディング消す
        })
        .catch(error => {
            console.error('Error:', error);
            alert("予約状況の取得に失敗しました。通信環境を確認してください。");
            $('#loading').fadeOut();
            // 失敗してもカレンダーは描画しておく（ただし空き状況は反映されない）
            renderCalendar(currentBaseDate);
        });


    // --- カレンダー描画関数 ---
    function renderCalendar(baseDate) {
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

        // ヘッダー（日付）作成
        for (let i = 0; i < 7; i++) {
            let m = tempDate.getMonth() + 1;
            let d = tempDate.getDate();
            let w = tempDate.getDay();
            
            // GASとの照合用にフォーマットを統一
            let displayDate = `${tempDate.getFullYear()}年${('0'+m).slice(-2)}月${('0'+d).slice(-2)}日`;
            let fullDate = `${tempDate.getFullYear()}/${m}/${d}`; 
            
            weekDates.push({ fullDate: fullDate, displayDate: displayDate });
            
            let color = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
            $header.append(`<th class="${color}">${d}<br><small>(${days[w]})</small></th>`);
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // 時間枠作成
        for (let h = startH; h < endH; h++) {
            let timeStr = `${h}:00`;
            let timeLabel = `${h}：00～`; // GASとの照合用文字列
            let row = `<tr><td class="bg-light font-weight-bold">${h}:00</td>`;
            
            weekDates.forEach((dateObj) => {
                let dObj = new Date(dateObj.fullDate + " " + timeStr);
                
                // 定休日や過去の判定
                let isMonday = (dObj.getDay() === 1);
                let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                let isPast = (dObj < now);

                // ★ GASから取得した予約済みチェック ★
                let slotKey = dateObj.displayDate + '_' + timeLabel;
                let isBooked = bookedSlots.includes(slotKey);

                if (isMonday || isThirdTuesday || isPast || isBooked) {
                    row += `<td><span class="symbol-ng">×</span></td>`;
                } else {
                    row += `<td><div class="time-slot" data-date="${dateObj.displayDate}" data-time="${timeLabel}">
                                <span class="symbol-ok">〇</span>
                            </div></td>`;
                }
            });
            $body.append(row + '</tr>');
        }
    }

    // --- イベントハンドラ ---
    
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

    // 時間選択
    $(document).on('click', '.time-slot', function() {
        $('.selected-slot').removeClass('selected-slot');
        $(this).addClass('selected-slot');
        $('#selected_date').val($(this).data('date'));
        $('#selected_time').val($(this).data('time'));
    });

    // 送信処理（重複チェック付き）
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

        if(!confirm(date + " " + minute + "\nこの日時で予約しますか？")) {
            return false;
        }

        // ローディング表示
        $('#loading').find('div.text-primary').text('予約を処理しています...');
        $('#loading').fadeIn();

        // GASへ送るデータ
        const postData = {
            date: date,
            time: minute,
            name: namelabel,
            menu: names,
            inquiry: inquiries
        };

        // GASへ送信
        fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain' 
            },
            body: JSON.stringify(postData)
        })
        .then(response => response.json())
        .then(result => {
            $('#loading').fadeOut();

            if(result.result === 'success') {
                // 成功したらLINE送信
                var msg = `＊＊ご予約完了＊＊\nお名前：\n ${namelabel}\n希望日：\n ${date}\n時間：\n ${minute}\nメニュー：\n ${names}\n問い合わせ内容：\n ${inquiries}`;
                sendText(msg);
            } else {
                // 重複エラーなどの場合
                alert(result.message);
                // 最新情報を再取得してリロード
                location.reload(); 
            }
        })
        .catch(error => {
            $('#loading').fadeOut();
            console.error(error);
            alert("通信エラーが発生しました。もう一度お試しください。");
        });

        return false;
    });

    // LINE送信関数
    function sendText(text) {
        if (!liff.isInClient()) {
            alert('予約は完了しました！（LINEアプリ外のためメッセージ送信はスキップされました）');
            // 必要ならここでリロードや完了画面へ遷移
            return;
        }
        liff.sendMessages([{
            'type': 'text',
            'text': text
        }]).then(function () {
            liff.closeWindow();
        }).catch(function (error) {
            alert('LINEへのメッセージ送信に失敗しましたが、予約台帳への登録は完了しています。');
        });
    }
});
