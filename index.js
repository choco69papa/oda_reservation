$(function () {
    // =================================================================
    // ★設定エリア：ここにGASのウェブアプリURLを貼り付けてください
    // =================================================================
    const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxEROcIusSFfJiU57Rhgo5mZ8ZdI6JE3MaSSf9YyDL9Eb1AMReWLS-azgaPNF71e5C4/exec';

    // LIFFの初期化 (LINEから開いた時に必要)
    initializeLiff();

    // 既存：お名前の自動入力処理（もしform-numberというIDがある場合）
    $('#form-number').click(function () {
        $('#form-name').empty();
        var namelabel = $('input[name="namelabel"]').val();
    });

    // --- カレンダー用の変数設定 ---
    let currentBaseDate = new Date();
    // 日曜日から始まるように調整
    currentBaseDate.setDate(currentBaseDate.getDate() - currentBaseDate.getDay());

    const startH = 9;  // 開始時間 9:00
    const endH = 17;   // 終了時間 16:00 (17:00まで表示したい場合は18にする)

    // 予約済みリスト（GASから取得したデータをここに入れる）
    let bookedSlots = [];

    // =================================================================
    // 1. 予約状況を取得してカレンダーを表示する関数 (GET処理)
    // =================================================================
    function fetchAndRender() {
        // カレンダー部分を読み込み中表示にする
        $('#timeBody').html('<tr><td colspan="8" class="text-center py-4"><i class="fa fa-spinner fa-spin"></i> 予約状況を確認中...</td></tr>');

        $.ajax({
            url: GAS_API_URL,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log("予約データ取得成功:", data);
                bookedSlots = data; // 例: ["2026/1/10 10:00", "2026/1/11 14:00"]
                renderCalendar(currentBaseDate);
            },
            error: function() {
                alert("予約状況の取得に失敗しました。画面を再読み込みしてください。");
                renderCalendar(currentBaseDate); // エラーでも一応カレンダーは出す
            }
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
        
        // 月の表示更新
        let monthText = (baseDate.getMonth() + 1) + "月";
        $('#currentMonthDisplay').text(monthText);

        let weekDates = [];
        let tempDate = new Date(baseDate);

        // 7日分のヘッダー作成
        for (let i = 0; i < 7; i++) {
            let m = tempDate.getMonth() + 1;
            let d = tempDate.getDate();
            let w = tempDate.getDay();
            
            // GASデータとの照合用キー (例: 2026/1/10) ※ゼロ埋めなし
            let fullDate = `${tempDate.getFullYear()}/${m}/${d}`; 
            // 表示用 (例: 2026年01月10日)
            let displayDate = `${tempDate.getFullYear()}年${('0'+m).slice(-2)}月${('0'+d).slice(-2)}日`;
            
            weekDates.push({ fullDate: fullDate, displayDate: displayDate });
            
            let color = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
            $header.append(`<th class="${color}">${d}<br><small>(${days[w]})</small></th>`);
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // 時間枠（1時間刻み）の作成
        for (let h = startH; h < endH; h++) {
            let timeStr = `${h}:00`; 
            let timeLabel = `${h}：00～`; // 送信時の表記
            let row = `<tr><td class="bg-light font-weight-bold">${h}:00</td>`;
            
            weekDates.forEach((dateObj) => {
                let dObj = new Date(dateObj.fullDate + " " + timeStr);
                
                // ★判定用キー (例: 2026/1/10 9:00)
                let checkKey = dateObj.fullDate + " " + timeStr;

                // --- NG条件の判定 ---
                // 1. 定休日（毎週月曜・第三火曜）
                let isMonday = (dObj.getDay() === 1);
                let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                
                // 2. 過去の日時
                let isPast = (dObj < now);

                // 3. 予約済み（GASから取得したリストに含まれているか）
                let isBooked = bookedSlots.includes(checkKey);

                // 判定結果で分岐
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

    // --- 週切り替えボタンの動作 ---
    $('#prevWeek').on('click', function(e){ 
        e.preventDefault(); 
        currentBaseDate.setDate(currentBaseDate.getDate() - 7); 
        renderCalendar(currentBaseDate); // 既にデータは持っているので再描画のみ
    });
    $('#nextWeek').on('click', function(e){ 
        e.preventDefault(); 
        currentBaseDate.setDate(currentBaseDate.getDate() + 7); 
        renderCalendar(currentBaseDate); 
    });

    // --- 日時をクリックした時の動作 ---
    $(document).on('click', '.time-slot', function() {
        // 全ての選択状態を解除して、クリックした箇所だけ選択
        $('.selected-slot').removeClass('selected-slot');
        $(this).addClass('selected-slot');
        
        // 隠しフィールドに値をセット
        $('#selected_date').val($(this).data('date'));
        $('#selected_time').val($(this).data('time'));
    });

    // =================================================================
    // 3. 送信ボタンを押した時の処理 (POST処理)
    // =================================================================
    $('form').submit(function (e) {
        e.preventDefault();
        
        // 入力値を取得
        var namelabel = $('input[name="namelabel"]').val();
        var date = $('#selected_date').val();
        var minute = $('#selected_time').val();
        var names = $('select[name="names"]').val();
        var inquiries = $('textarea[name="inquiries"]').val();
        
        // バリデーション
        if(!date || !minute) {
            alert("予約日時を選択してください");
            return false;
        }

        // 二重送信防止のためボタンを無効化
        var $submitBtn = $('input[type="submit"]');
        $submitBtn.prop('disabled', true).val('送信中...');

        // GASにデータを送信（保存）
        $.ajax({
            url: GAS_API_URL,
            type: 'POST',
            data: {
                date: date,    // 予約日
                time: minute,  // 予約時間
                name: namelabel,
                menu: names,
                inquiry: inquiries
            },
            success: function(response) {
                // 保存成功！LINEにメッセージを送る
                var msg = `＊＊ご予約内容＊＊\nお名前：\n ${namelabel}\n希望日：\n ${date}\n時間：\n ${minute}\nメニュー：\n ${names}\n問い合わせ内容：\n ${inquiries}`;
                
                sendText(msg); // LINE送信関数を呼ぶ
            },
            error: function() {
                alert("予約の保存に失敗しました。通信環境の良い場所で再度お試しください。");
                $submitBtn.prop('disabled', false).val('送信'); // ボタンを戻す
            }
        });

        return false;
    });

    // =================================================================
    // LIFF関連の関数 (初期化とメッセージ送信)
    // =================================================================
    function initializeLiff() {
        // LIFF IDは自動取得、またはliff.jsの設定に従います
        liff.init({ liffId: "LIFF_ID_HERE" }) // ※LIFF IDが自動でない場合はここに入れてください
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
            alert('予約完了しました！(LINE外からのアクセスです)');
            window.location.reload();
            return;
        }

        liff.sendMessages([{
            'type': 'text',
            'text': text
        }]).then(function () {
            // 送信完了
            liff.closeWindow(); // 画面を閉じる
        }).catch(function (error) {
            window.alert('メッセージの送信に失敗しました: ' + error);
            $('input[type="submit"]').prop('disabled', false).val('送信');
        });
    }
});
