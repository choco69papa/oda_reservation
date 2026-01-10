$(function () {
    // =================================================================
    // ★設定エリア：ここに「シークレットモードで動いたURL」を貼ってください
    // =================================================================
    const GAS_API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLhi2oO7oYT8jY4Oz9c_GMIh7-ro5bGDpePvSTmPdJhZ5QLJlMtH57DRJEuKT6NCoL550uLY-PNGyzv_8Udf3nQKwuVQ9RTavF6H8M_Gf8Nu3Is1Ca6ljlIgRcJZmsZ_wmwJdjwYWowlorwk9ruXJz1JIezh2MaXUg-swLHSyOPcOiM3pvqwwTNvpMNKnZePR2ZUN0oIxOfA1r814xozyxhe1XJgjizNUJOVaqpv1q1JwtPnhFsoOmXGR4gv9GJVSUM-4bXupMWAUmCKztMBU0YJP8EsfA&lib=MwEfIsBinZcZ-nfMENVujXv1jsbRDKtsU';

    // LIFFの初期化
    initializeLiff();

    // 既存：お名前の自動入力処理
    $('#form-number').click(function () {
        $('#form-name').empty();
        var namelabel = $('input[name="namelabel"]').val();
    });

    // --- カレンダー用の変数設定 ---
    let currentBaseDate = new Date();
    // 日曜日から始まるように調整
    currentBaseDate.setDate(currentBaseDate.getDate() - currentBaseDate.getDay());

    const startH = 9;  // 開始時間 9:00
    const endH = 17;   // 終了時間 16:00

    // 予約済みリスト
    let bookedSlots = [];

    // =================================================================
    // 1. 予約状況を取得してカレンダーを表示する (読み込み)
    // =================================================================
    function fetchAndRender() {
        $('#timeBody').html('<tr><td colspan="8" class="text-center py-4"><i class="fa fa-spinner fa-spin"></i> 予約状況を確認中...</td></tr>');

        // ★読み込みも安定性の高い fetch に変更しました
        fetch(GAS_API_URL)
            .then(response => response.json())
            .then(data => {
                console.log("予約データ取得成功:", data);
                bookedSlots = data;
                renderCalendar(currentBaseDate);
            })
            .catch(error => {
                console.error("読み込みエラー:", error);
                alert("予約状況の取得に失敗しました。画面を再読み込みしてください。");
                renderCalendar(currentBaseDate);
            });
    }

    // =================================================================
    // 2. カレンダーを描画する関数
    // =================================================================
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

        // 7日分のヘッダー作成
        for (let i = 0; i < 7; i++) {
            let m = tempDate.getMonth() + 1;
            let d = tempDate.getDate();
            let w = tempDate.getDay();
            
            // GASデータとの照合用キー (例: 2026/1/10)
            let fullDate = `${tempDate.getFullYear()}/${m}/${d}`; 
            // 表示用
            let displayDate = `${tempDate.getFullYear()}年${('0'+m).slice(-2)}月${('0'+d).slice(-2)}日`;
            
            weekDates.push({ fullDate: fullDate, displayDate: displayDate });
            
            let color = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
            $header.append(`<th class="${color}">${d}<br><small>(${days[w]})</small></th>`);
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // 時間枠の作成
        for (let h = startH; h < endH; h++) {
            let timeStr = `${h}:00`; 
            let timeLabel = `${h}：00～`;
            let row = `<tr><td class="bg-light font-weight-bold">${h}:00</td>`;
            
            weekDates.forEach((dateObj) => {
                let dObj = new Date(dateObj.fullDate + " " + timeStr);
                
                // 判定用キー
                let checkKey = dateObj.fullDate + " " + timeStr;

                // NG条件判定
                let isMonday = (dObj.getDay() === 1);
                let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                let isPast = (dObj < now);
                let isBooked = bookedSlots.includes(checkKey);

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

    // 初回実行
    fetchAndRender();

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

    // =================================================================
    // 3. 送信ボタンを押した時の処理 (書き込み)
    // =================================================================
    $('form').submit(function (e) {
        e.preventDefault();
        
        // 入力値を取得
        var namelabel = $('input[name="namelabel"]').val();
        var date = $('#selected_date').val();
        var minute = $('#selected_time').val();
        var names = $('select[name="names"]').val();
        var inquiries = $('textarea[name="inquiries"]').val();
        
        if(!date || !minute) {
            alert("予約日時を選択してください");
            return false;
        }

        // ボタンを無効化（二重送信防止）
        var $submitBtn = $('input[type="submit"]');
        $submitBtn.prop('disabled', true).val('送信中...');

        // ★ここを fetch に変更（GASのエラー対策）
        fetch(GAS_API_URL, {
            method: 'POST',
            body: new URLSearchParams({
                date: date,
                time: minute,
                name: namelabel,
                menu: names,
                inquiry: inquiries
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log("保存成功:", data);

            // LINEメッセージ作成
            var msg = `＊＊ご予約内容＊＊\nお名前：\n ${namelabel}\n希望日：\n ${date}\n時間：\n ${minute}\nメニュー：\n ${names}\n問い合わせ内容：\n ${inquiries}`;
            
            sendText(msg); // LINE送信へ
        })
        .catch(error => {
            console.error("保存エラー:", error);
            alert("予約の保存に失敗しました。通信環境の良い場所で再度お試しください。");
            $submitBtn.prop('disabled', false).val('送信');
        });

        return false;
    });

    // =================================================================
    // LIFF関連
    // =================================================================
    function initializeLiff() {
        // LIFF IDはliff.jsなどで設定されている前提
        liff.init({ liffId: "LIFF_ID_HERE" }) // 必要に応じてIDを入れる
            .then(() => {
                if (!liff.isLoggedIn()) {
                    liff.login();
                }
            })
            .catch((err) => {
                console.log('LIFF Initialization failed ', err);
            });
    }

    function sendText(text) {
        if (!liff.isInClient()) {
            alert('予約完了しました！(LINE外のためメッセージは送信されません)');
            window.location.reload();
            return;
        }

        liff.sendMessages([{
            'type': 'text',
            'text': text
        }]).then(function () {
            liff.closeWindow(); 
        }).catch(function (error) {
            window.alert('メッセージ送信に失敗: ' + error);
            $('input[type="submit"]').prop('disabled', false).val('送信');
        });
    }
});
