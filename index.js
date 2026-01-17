$(function () {
    // =================================================================
    // ★設定エリア（ここを必ず書き換えてください！）
    // =================================================================
    
    // ① カズさんのLIFF ID（例：16577xxxxx-xxxxxxx）
    const MY_LIFF_ID = "1657883881-JG16djMv"; 

    // ② GASのURL
    const GAS_API_URL = 'https://script.google.com/macros/s/AKfycby4HvZWI5uOq9-mDpFEWRwJJMYe70ztIX7xcYExoY6pG98HWEwLDS9p1XzxNJS6_jvf/exec';

    // =================================================================

    // フォーム設定
    $('form').attr('action', GAS_API_URL);
    
    // LIFFの初期化を開始
    initializeLiff();

    // お名前コピー処理
    $('#form-number').click(function () {
        $('#form-name').empty();
        var namelabel = $('input[name="namelabel"]').val();
    });

    // --- カレンダー設定 ---
    let currentBaseDate = new Date();
    currentBaseDate.setDate(currentBaseDate.getDate() - currentBaseDate.getDay()); // 日曜始まり

    let bookedSlots = [];

    // --- 読み込み処理 ---
    function fetchAndRender() {
        $('#loadingMsg').show();
        const bustCache = '?t=' + new Date().getTime();
        
        fetch(GAS_API_URL + bustCache)
            .then(response => response.json())
            .then(data => {
                console.log("予約済みリスト:", data);
                bookedSlots = data;
                renderCalendar(currentBaseDate);
                $('#loadingMsg').hide();
            })
            .catch(error => {
                console.error("読み込みエラー:", error);
                renderCalendar(currentBaseDate);
                $('#loadingMsg').hide();
            });
    }

    // --- カレンダー描画 ---
    function renderCalendar(baseDate) {
        const $header = $('#dateHeader');
        const $body = $('#timeBody');
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const now = new Date(); 
        
        $header.empty().append('<th>時間</th>');
        $body.empty();
        
        $('#currentMonthDisplay').text((baseDate.getMonth() + 1) + "月");

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

        const timeList = [];
        for (let h = 9; h <= 17; h++) {
            timeList.push(h + ":00");
            timeList.push(h + ":30");
        }

        timeList.forEach(timeStr => {
            let row = `<tr><td class="bg-light font-weight-bold">${timeStr}</td>`;
            
            weekDates.forEach((dateObj) => {
                let dObj = new Date(dateObj.fullDate + " " + timeStr);
                let checkKey = dateObj.fullDate + " " + timeStr;
                let wholeDayKey = dateObj.fullDate + " 休"; 
                let isWholeDayOff = bookedSlots.includes(wholeDayKey);
                let isMonday = (dObj.getDay() === 1);
                let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                let isPast = (dObj < now);
                let isBooked = bookedSlots.includes(checkKey);

                if (isMonday || isThirdTuesday || isPast || isBooked || isWholeDayOff) {
                    row += `<td><div class="time-slot-ng"><span class="symbol-ng">×</span></div></td>`;
                } else {
                    row += `<td><div class="time-slot" data-date="${dateObj.fullDate}" data-time="${timeStr}">
                                <span class="symbol-ok">〇</span>
                            </div></td>`;
                }
            });
            $body.append(row + '</tr>');
        });
    }

    fetchAndRender();

    $('#prevWeek').on('click', function(e){ e.preventDefault(); currentBaseDate.setDate(currentBaseDate.getDate() - 7); renderCalendar(currentBaseDate); });
    $('#nextWeek').on('click', function(e){ e.preventDefault(); currentBaseDate.setDate(currentBaseDate.getDate() + 7); renderCalendar(currentBaseDate); });

    $(document).on('click', '.time-slot', function() {
        $('.selected-slot').removeClass('selected-slot');
        $(this).addClass('selected-slot');
        $('#selected_date').val($(this).data('date'));
        $('#selected_time').val($(this).data('time'));
    });

    // 送信処理
    let submitted = false;
    $('form').submit(function (e) {
        var date = $('#selected_date').val();
        var minute = $('#selected_time').val();
        
        if(!date || !minute) {
            alert("予約日時を選択してください");
            e.preventDefault();
            return false;
        }
        submitted = true;
        $('input[type="submit"]').prop('disabled', true).val('送信中...');
    });

    $('#hidden_iframe').on('load', function() {
        if(submitted) {
            var namelabel = $('input[name="namelabel"]').val();
            var date = $('#selected_date').val();
            var minute = $('#selected_time').val();
            var names = $('select[name="names"]').val();
            var inquiries = $('textarea[name="inquiries"]').val();
            
            var msg = `＊＊ご予約内容＊＊\nお名前：\n ${namelabel}\n希望日：\n ${date}\n時間：\n ${minute}\nメニュー：\n ${names}\n問い合わせ内容：\n ${inquiries}`;
            sendText(msg);
        }
    });

    // =================================================================
    // ★判定・初期化ロジック（修正版）
    // =================================================================
    function initializeLiff() {
        // IDが設定されていない場合のアラート
        if (MY_LIFF_ID === "ここにご自身のLIFF IDを入れてください") {
            console.error("LIFF IDが設定されていません。コードの先頭を確認してください。");
            return;
        }

        if(typeof liff !== 'undefined'){
            liff.init({ liffId: MY_LIFF_ID }).then(() => {
                
                // LINEアプリ内かどうかチェック
                if (liff.isInClient()) {
                    // ★LINEの場合：ログインしていなければ強制ログイン
                    if (!liff.isLoggedIn()) {
                        liff.login();
                    }
                    // Web用の入力欄は隠れたまま
                } else {
                    // ★Webの場合：入力欄を表示＆必須化
                    $('#web-contact-area').show();
                    $('input[name="user_email"]').prop('required', true);
                    $('input[name="user_phone"]').prop('required', true);
                }

            }).catch((err)=>{ 
                console.log("LIFF Initialization failed: ", err);
            });
        }
    }

    // =================================================================
    // ★メッセージ送信ロジック（エラー対策済み）
    // =================================================================
    function sendText(text) {
        // Webからの場合
        if (!liff.isInClient()) {
            alert('予約が完了しました！\n確認メールをお送りしました。');
            window.location.reload();
            return;
        }

        // LINEからの場合
        // もし何らかの理由でログインが外れていたら、ここで再ログインさせる
        if (!liff.isLoggedIn()) {
            alert("ログイン情報が切れました。再度ログインします。");
            liff.login();
            return;
        }

        liff.sendMessages([{ 'type': 'text', 'text': text }])
            .then(function () { 
                // 送信成功！
                liff.closeWindow(); 
            })
            .catch(function (error) {
                // 送信失敗
                console.error(error);
                // エラー内容に応じたメッセージ
                if (error.code === "401" || error.message.includes("access_token")) {
                    alert('認証エラーが発生しました。\n画面を閉じて、もう一度開き直してください。');
                } else {
                    alert('予約は完了しましたが、LINE通知に失敗しました。\n(' + error.message + ')');
                }
                window.location.reload();
            });
    }
});
