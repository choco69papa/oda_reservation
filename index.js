$(function () {
    // =================================================================
    // ★設定エリア
    // =================================================================
    
    // ① カズさんのLIFF ID
    const MY_LIFF_ID = "1657883881-JG16djMv"; 

    // ② GASのURL（新しいURLになっているか確認してください！）
    const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwZLcOmYyfRAV6DnC_QViWtgRD5vUYMzrIwovN_4IDEzz6n7AtGk2SHEffKhNw-USc/exec';

    // =================================================================

    $('form').attr('action', GAS_API_URL);
    
    // ★新機能：簡易判定（LIFFの読み込みを待たずに、スマホの正体を暴く）
    // LINEアプリなら true、それ以外（SafariやChrome）なら false
    const isLineApp = navigator.userAgent.toLowerCase().indexOf('line') !== -1;

    // LIFFの初期化を開始
    initializeLiff();

    // ★改良版：救済タイマー
    // 「LINEアプリではない」と確定している場合だけ、タイムアウト処理を行う
    if (!isLineApp) {
        setTimeout(function() {
            // まだWeb用エリアが表示されていなければ、強制的に表示
            if ($('#web-contact-area').css('display') === 'none') {
                console.log("読み込みタイムアウト：Webモードで強制表示します");
                showWebFields();
            }
        }, 1000); // 1秒後
    } else {
        // LINEアプリの場合は、最初からお急ぎメッセージを出しておく（念のため）
        $('#line-urgent-msg').show();
    }

    $('#form-number').click(function () { $('#form-name').empty(); });

    let currentBaseDate = new Date();
    currentBaseDate.setDate(currentBaseDate.getDate() - currentBaseDate.getDay());
    let bookedSlots = [];

    function fetchAndRender() {
        $('#loadingMsg').show();
        const bustCache = '?t=' + new Date().getTime();
        fetch(GAS_API_URL + bustCache)
            .then(response => response.json())
            .then(data => {
                bookedSlots = data;
                renderCalendar(currentBaseDate);
                $('#loadingMsg').hide();
            })
            .catch(error => {
                console.error(error);
                renderCalendar(currentBaseDate);
                $('#loadingMsg').hide();
            });
    }

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
            weekDates.push({ fullDate: fullDate });
            let color = (w === 0) ? 'text-danger' : (w === 6) ? 'text-primary' : '';
            $header.append(`<th class="${color}">${d}<br><small>(${days[w]})</small></th>`);
            tempDate.setDate(tempDate.getDate() + 1);
        }

        const timeList = [];
        for (let h = 9; h <= 17; h++) { timeList.push(h + ":00"); timeList.push(h + ":30"); }

        timeList.forEach(timeStr => {
            let row = `<tr><td class="bg-light font-weight-bold">${timeStr}</td>`;
            weekDates.forEach((dateObj) => {
                let dObj = new Date(dateObj.fullDate + " " + timeStr);
                let checkKey = dateObj.fullDate + " " + timeStr;
                let wholeDayKey = dateObj.fullDate + " 休"; 
                let isWholeDayOff = bookedSlots.includes(wholeDayKey);
                let isBooked = bookedSlots.includes(checkKey);
                let isMonday = (dObj.getDay() === 1);
                let isThirdTuesday = (dObj.getDay() === 2 && Math.ceil(dObj.getDate() / 7) === 3);
                let isPast = (dObj < now);

                if (isMonday || isThirdTuesday || isPast || isBooked || isWholeDayOff) {
                    row += `<td><div class="time-slot-ng"><span class="symbol-ng">×</span></div></td>`;
                } else {
                    row += `<td><div class="time-slot" data-date="${dateObj.fullDate}" data-time="${timeStr}"><span class="symbol-ok">〇</span></div></td>`;
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

    let submitted = false;
    $('form').submit(function (e) {
        var date = $('#selected_date').val();
        var minute = $('#selected_time').val();
        if(!date || !minute) { alert("予約日時を選択してください"); e.preventDefault(); return false; }

        // Webモード（表示中）の時だけ電話番号チェック
        if ($('#web-contact-area').css('display') !== 'none') {
             var phone = $('input[name="user_phone"]').val();
             if (phone && phone.replace(/-/g, '').length !== 11) {
                 alert("電話番号はハイフンなしの11桁で入力してください。"); e.preventDefault(); return false;
             }
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
    // ★判定・初期化ロジック
    // =================================================================
    function initializeLiff() {
        if(typeof liff !== 'undefined'){
            liff.init({ liffId: MY_LIFF_ID })
                .then(() => {
                    // LINEアプリ内かどうかチェック
                    if (liff.isInClient()) {
                        // ★LINEの場合
                        $('#line-urgent-msg').show(); 
                        // LINEなのにWeb欄が出ていたら消す（念のため）
                        $('#web-contact-area').hide();
                        $('input[name="user_email"]').prop('required', false);
                        $('input[name="user_phone"]').prop('required', false);

                        if (!liff.isLoggedIn()) liff.login();
                    } else {
                        // ★Webの場合
                        showWebFields();
                    }
                })
                .catch((err) => {
                    console.log("LIFF Init Error:", err);
                    // エラーが出た場合、LINEアプリじゃなければWeb欄を出す
                    if (!isLineApp) {
                        showWebFields();
                    }
                });
        } else {
            // LIFFがない場合も、LINEアプリじゃなければWeb欄を出す
            if (!isLineApp) {
                showWebFields();
            }
        }
    }

    function showWebFields() {
        // LINEアプリだったら絶対に表示させない！
        if (isLineApp) return;

        $('#web-contact-area').show();
        $('input[name="user_email"]').prop('required', true);
        $('input[name="user_phone"]').prop('required', true);
    }

    function sendText(text) {
        try {
            // Webからの場合、またはLIFFが使えない場合
            if (typeof liff === 'undefined' || !liff.isInClient()) {
                throw new Error("Not in LINE");
            }
            
            // LINEからの場合
            if (!liff.isLoggedIn()) { liff.login(); return; }
            
            liff.sendMessages([{ 'type': 'text', 'text': text }])
                .then(function () { liff.closeWindow(); })
                .catch(function (error) {
                    console.error(error);
                    alert('予約は完了しましたが、LINE通知に失敗しました。');
                    window.location.reload();
                });

        } catch (e) {
            // Webの場合
            alert('予約が完了しました！\n確認メールをお送りしました。');
            window.location.reload();
        }
    }
});
