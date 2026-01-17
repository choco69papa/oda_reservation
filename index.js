$(function () {
    // =================================================================
    // ★設定エリア
    // =================================================================
    const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxWVY5MyHHpeF4Qho8PO6bmOCb3KIUjctsIuA5fUsS0s_iFVmQYhlyx5k1BclLAu9x_dA/exec';

    // =================================================================
    // ★ここが新機能：最強の「メール欄隠し」処理
    // =================================================================
    // LIFFの読み込みを待たず、スマホの「ブラウザ情報」を見てLINEなら即隠します
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('line') !== -1) {
        $('#email-area').hide(); // LINEなら瞬時に隠す！
    }

    // フォーム設定
    $('form').attr('action', GAS_API_URL);
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
        
        // 月表示
        $('#currentMonthDisplay').text((baseDate.getMonth() + 1) + "月");

        let weekDates = [];
        let tempDate = new Date(baseDate);

        // ヘッダー作成
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

        // 30分刻みの時間リスト作成 (9:00〜17:30)
        const timeList = [];
        for (let h = 9; h <= 17; h++) {
            timeList.push(h + ":00");
            timeList.push(h + ":30");
        }

        // リストを使って行を作る
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

    // ボタン操作
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
    // LIFF初期化処理
    // =================================================================
    function initializeLiff() {
        if(typeof liff !== 'undefined'){
            // ★重要：ここの "LIFF_ID_HERE" は、もし分かれば正しいIDに変えておくと安心です
            // でも、上の「最強の隠す処理」を入れたので、そのままでも隠れるはずです！
            liff.init({ liffId: "LIFF_ID_HERE" }).then(() => {
                // 初期化成功時の処理（今回は特に何もしなくてOK）
            }).catch((err)=>{ 
                // エラーでも気にしない（メール隠しはもう実行済みだから）
                console.log(err); 
            });
        }
    }

    function sendText(text) {
        // ここでも「LINEアプリかどうか」をチェックして分岐
        var userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf('line') === -1) {
            // LINEじゃない（Web）なら、アラートを出してリロード
            alert('予約が完了しました！\n確認メールをお送りしました。');
            window.location.reload();
            return;
        }

        // LINEならメッセージ送信を試みる
        if (liff.isInClient()) {
             liff.sendMessages([{ 'type': 'text', 'text': text }])
                .then(function () { liff.closeWindow(); })
                .catch(function (error) {
                    alert('予約は完了しましたが、LINE通知に失敗しました。');
                    window.location.reload();
                });
        } else {
            // 万が一ここに来たらWeb扱い
            alert('予約が完了しました！');
            window.location.reload();
        }
    }
});
